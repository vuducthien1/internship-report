const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const createStorage = (folder, prefix) => {
    const directory = path.join(__dirname, '..', 'uploads', folder);
    fs.mkdirSync(directory, { recursive: true });
    return multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, directory),
        filename: (_req, file, callback) => callback(null, `${prefix}_${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
    });
};

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const documentTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'text/plain',
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'image/vnd.dwg',
]);

const incidentUpload = multer({
    storage: createStorage('incidents', 'incident'),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => imageTypes.has(file.mimetype)
        ? callback(null, true)
        : callback(new Error('Minh chứng sự cố chỉ chấp nhận JPG, PNG hoặc WEBP.')),
});

const documentUpload = multer({
    storage: createStorage('documents', 'document'),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => (documentTypes.has(file.mimetype)
        || (file.mimetype === 'application/octet-stream' && path.extname(file.originalname).toLowerCase() === '.dwg'))
        ? callback(null, true)
        : callback(new Error('Định dạng tài liệu không được hỗ trợ.')),
});

const readHeader = async (file, size = 16) => {
    const handle = await fs.promises.open(file.path, 'r');
    try {
        const bytes = Buffer.alloc(size);
        const { bytesRead } = await handle.read(bytes, 0, size, 0);
        return bytes.subarray(0, bytesRead);
    } finally {
        await handle.close();
    }
};

const isImageHeader = (mime, header) => {
    if (mime === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (mime === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mime === 'image/webp') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
};

const validateIncidentImage = async (req, res, next) => {
    if (!req.file) return next();
    try {
        if (!isImageHeader(req.file.mimetype, await readHeader(req.file))) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ success: false, message: 'Nội dung ảnh sự cố không hợp lệ.' });
        }
        return next();
    } catch (error) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return next(error);
    }
};

const validateProjectDocument = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const header = await readHeader(req.file);
        const mime = req.file.mimetype;
        const extension = path.extname(req.file.originalname).toLowerCase();
        const valid = imageTypes.has(mime)
            ? isImageHeader(mime, header)
            : mime === 'application/pdf'
                ? header.subarray(0, 5).toString('ascii') === '%PDF-'
                : mime.includes('openxmlformats')
                    ? header[0] === 0x50 && header[1] === 0x4b
                    : mime.includes('msword') || mime.includes('ms-excel')
                        ? header.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
                        : mime.includes('acad') || mime.includes('dwg') || extension === '.dwg'
                            ? header.subarray(0, 4).toString('ascii') === 'AC10'
                            : mime === 'text/plain';
        if (!valid) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ success: false, message: 'Nội dung tài liệu không khớp định dạng file.' });
        }
        return next();
    } catch (error) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return next(error);
    }
};

module.exports = {
    uploadIncidentImage: incidentUpload.single('image'),
    uploadProjectDocument: documentUpload.single('document'),
    validateIncidentImage,
    validateProjectDocument,
};
