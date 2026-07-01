const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
    ['application/pdf', '.pdf'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
    ['text/plain', '.txt'],
    ['text/csv', '.csv'],
]);

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, uploadDir),
        filename: (_req, file, callback) => callback(
            null,
            `chat_${crypto.randomUUID()}${allowedTypes.get(file.mimetype) || '.bin'}`
        ),
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (allowedTypes.has(file.mimetype)) callback(null, true);
        else callback(new Error('Định dạng file chat không được hỗ trợ.'));
    },
});

const hasValidSignature = async (file) => {
    const handle = await fs.promises.open(file.path, 'r');
    try {
        const buffer = Buffer.alloc(32);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        const bytes = buffer.subarray(0, bytesRead);

        if (file.mimetype === 'image/jpeg') {
            return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        }
        if (file.mimetype === 'image/png') {
            return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        }
        if (file.mimetype === 'image/webp') {
            return bytes.subarray(0, 4).toString('ascii') === 'RIFF'
                && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
        }
        if (file.mimetype === 'image/gif') {
            return ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'));
        }
        if (file.mimetype === 'application/pdf') {
            return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
        }
        if (file.mimetype.includes('openxmlformats-officedocument')) {
            return bytes[0] === 0x50 && bytes[1] === 0x4b;
        }
        if (['text/plain', 'text/csv'].includes(file.mimetype)) {
            return !bytes.includes(0x00);
        }
        return false;
    } finally {
        await handle.close();
    }
};

const validateChatAttachment = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn file cần gửi.' });
    }

    try {
        if (req.file.size === 0) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ success: false, message: 'Không thể gửi file rỗng.' });
        }
        if (!(await hasValidSignature(req.file))) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ success: false, message: 'Nội dung file không đúng với định dạng khai báo.' });
        }
        return next();
    } catch (error) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return next(error);
    }
};

module.exports = {
    uploadChatAttachment: upload.single('attachment'),
    validateChatAttachment,
};
