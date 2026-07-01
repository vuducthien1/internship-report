const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'transcribe');
fs.mkdirSync(uploadDir, { recursive: true });
const allowed = new Set(['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a']);
const upload = multer({
    storage: multer.diskStorage({ destination: (_req, _file, callback) => callback(null, uploadDir), filename: (_req, file, callback) => callback(null, `transcribe_${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase() || '.webm'}`) }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => allowed.has(file.mimetype) ? callback(null, true) : callback(new Error('Định dạng âm thanh Transcribe không được hỗ trợ.')),
});

const validateAudio = async (req, res, next) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file âm thanh.' });
    try {
        const handle = await fs.promises.open(req.file.path, 'r'); const bytes = Buffer.alloc(12); const { bytesRead } = await handle.read(bytes, 0, 12, 0); await handle.close();
        const header = bytes.subarray(0, bytesRead); const ascii = header.toString('ascii');
        const valid = header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) || ascii.startsWith('OggS') || ascii.startsWith('RIFF') || ascii.startsWith('ID3') || header[0] === 0xff || ascii.includes('ftyp');
        if (!valid) { await fs.promises.unlink(req.file.path).catch(() => {}); return res.status(400).json({ success: false, message: 'Nội dung file âm thanh không hợp lệ.' }); }
        return next();
    } catch (error) { await fs.promises.unlink(req.file.path).catch(() => {}); return next(error); }
};

module.exports = { uploadTranscribeAudio: upload.single('audio'), validateTranscribeAudio: validateAudio };
