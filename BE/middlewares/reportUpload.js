const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'reports');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['application/pdf', '.pdf'],
]);

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, uploadDir),
        filename: (_req, file, callback) => callback(
            null,
            `report_${crypto.randomUUID()}${allowedTypes.get(file.mimetype) || '.bin'}`
        ),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (allowedTypes.has(file.mimetype)) callback(null, true);
        else callback(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc tài liệu PDF.'));
    },
});

const hasValidSignature = async (file) => {
    const handle = await fs.promises.open(file.path, 'r');
    try {
        const bytes = Buffer.alloc(16);
        const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
        const header = bytes.subarray(0, bytesRead);
        if (file.mimetype === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
        if (file.mimetype === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        if (file.mimetype === 'image/webp') return header.subarray(0, 4).toString('ascii') === 'RIFF'
            && header.subarray(8, 12).toString('ascii') === 'WEBP';
        if (file.mimetype === 'application/pdf') return header.subarray(0, 5).toString('ascii') === '%PDF-';
        return false;
    } finally {
        await handle.close();
    }
};

const validateReportAttachment = async (req, res, next) => {
    if (!req.file) return next();
    try {
        if (!(await hasValidSignature(req.file))) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ success: false, message: 'Nội dung file đính kèm không hợp lệ.' });
        }
        return next();
    } catch (error) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return next(error);
    }
};

module.exports = {
    uploadReportAttachment: upload.single('attachment'),
    validateReportAttachment,
};
