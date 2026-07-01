const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
    uploadChatAttachment,
    validateChatAttachment,
} = require('../middlewares/chatAttachmentUpload');

const uploadDir = path.join(__dirname, '..', 'uploads', 'voice');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedAudioTypes = new Map([
    ['audio/webm', '.webm'],
    ['video/webm', '.webm'],
    ['audio/ogg', '.ogg'],
    ['audio/wav', '.wav'],
    ['audio/x-wav', '.wav'],
    ['audio/mpeg', '.mp3'],
    ['audio/mp4', '.m4a'],
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = allowedAudioTypes.get(file.mimetype) || '.bin';
        cb(null, `voice_${crypto.randomUUID()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (allowedAudioTypes.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file âm thanh.'));
        }
    },
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    keyGenerator: (req) => String(req.user.id),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Bạn đã upload quá nhiều file. Vui lòng thử lại sau.' },
});

const hasValidAudioSignature = async (file) => {
    const handle = await fs.promises.open(file.path, 'r');
    try {
        const buffer = Buffer.alloc(16);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        const bytes = buffer.subarray(0, bytesRead);

        if (['audio/webm', 'video/webm'].includes(file.mimetype)) {
            return bytes.length >= 4
                && bytes[0] === 0x1a && bytes[1] === 0x45
                && bytes[2] === 0xdf && bytes[3] === 0xa3;
        }
        if (file.mimetype === 'audio/ogg') {
            return bytes.subarray(0, 4).toString('ascii') === 'OggS';
        }
        if (['audio/wav', 'audio/x-wav'].includes(file.mimetype)) {
            return bytes.subarray(0, 4).toString('ascii') === 'RIFF'
                && bytes.subarray(8, 12).toString('ascii') === 'WAVE';
        }
        if (file.mimetype === 'audio/mpeg') {
            return bytes.subarray(0, 3).toString('ascii') === 'ID3'
                || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
        }
        if (file.mimetype === 'audio/mp4') {
            return bytes.subarray(4, 8).toString('ascii') === 'ftyp';
        }
        return false;
    } finally {
        await handle.close();
    }
};

const ensureConversationUploadAccess = async (req, res, next) => {
    try {
        const conversationId = Number(req.params.id);
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.status(400).json({ success: false, message: 'Cuộc trò chuyện không hợp lệ.' });
        }

        const conv = await chatController.getConversationAccess(
            conversationId,
            req.user.id,
            req.user.role
        );
        const isParticipant = conv
            && (conv.user1_id === req.user.id || conv.user2_id === req.user.id);

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền gửi file vào cuộc trò chuyện này.' });
        }
        if (conv.is_locked) {
            return res.status(423).json({ success: false, message: 'Cuộc trò chuyện đã bị khóa.' });
        }
        req.chatConversation = conv;
        next();
    } catch (error) {
        next(error);
    }
};

router.get('/contacts', verifyToken, chatController.getContacts);
router.get('/conversations', verifyToken, chatController.getConversations);
router.post('/conversations', verifyToken, chatController.startConversation);
router.get('/conversations/:id/messages', verifyToken, chatController.getMessages);

router.patch(
    '/conversations/:id/lock',
    verifyToken,
    authorizeRoles('admin'),
    chatController.setConversationLock
);

router.post(
    '/conversations/:id/voice',
    verifyToken,
    uploadLimiter,
    ensureConversationUploadAccess,
    upload.single('voice'),
    async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file âm thanh.' });
        }

        try {
            if (!(await hasValidAudioSignature(req.file))) {
                await fs.promises.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ success: false, message: 'Nội dung file âm thanh không hợp lệ.' });
            }

            const voiceUrl = `/uploads/voice/${req.file.filename}`;
            return res.status(200).json({ success: true, data: { voice_url: voiceUrl } });
        } catch (error) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return next(error);
        }
    }
);

router.post(
    '/conversations/:id/attachments',
    verifyToken,
    uploadLimiter,
    ensureConversationUploadAccess,
    uploadChatAttachment,
    validateChatAttachment,
    async (req, res, next) => {
        try {
            const originalName = path.basename(req.file.originalname)
                .replace(/[\u0000-\u001f\u007f]/g, '')
                .slice(0, 255) || 'attachment';
            const isImage = req.file.mimetype.startsWith('image/');
            const conversationId = Number(req.params.id);
            const message = await chatController.saveMessage(conversationId, req.user.id, {
                messageType: isImage ? 'image' : 'file',
                fileUrl: `/uploads/chat/${req.file.filename}`,
                fileName: originalName,
                fileSize: req.file.size,
                fileMime: req.file.mimetype,
            });

            const io = req.app.get('io');
            io?.to(`conversation_${conversationId}`).emit('new_message', { conversationId, message });
            io?.to(`user_${req.chatConversation.user1_id}`).emit('conversation_updated', { conversationId });
            io?.to(`user_${req.chatConversation.user2_id}`).emit('conversation_updated', { conversationId });
            io?.to('admin_monitor').emit('conversation_updated', { conversationId });

            return res.status(201).json({ success: true, data: message });
        } catch (error) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return next(error);
        }
    }
);

module.exports = router;
