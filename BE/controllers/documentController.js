const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');
const { documentValidator } = require('../validations/operationValidation');
const { deleteStoredFile, getStoredFile, uploadStoredFile } = require('../utils/storageService');

const removeLocalUpload = async (file) => file?.path && fs.promises.unlink(file.path).catch(() => {});
const hasProjectAccess = async (projectId, user) => {
    let query = 'SELECT p.id FROM projects p WHERE p.id = ?'; const params = [projectId];
    if (user.role === 'manager') { query += ' AND p.manager_id = ?'; params.push(user.id); }
    if (user.role === 'engineer') { query += ' AND EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.engineer_id = ?)'; params.push(user.id); }
    const [rows] = await db.query(query, params); return Boolean(rows.length);
};

exports.getDocuments = async (req, res) => {
    try {
        let query = `SELECT d.id, d.project_id, d.group_id, d.title, d.version, d.file_name, d.mime_type, d.file_size, d.created_at,
                            CASE WHEN d.file_path LIKE 's3://%' THEN 'amazon-s3' ELSE 'local' END AS storage_provider,
                            p.name AS project_name, u.fullname AS uploaded_by_name
                     FROM project_documents d JOIN projects p ON p.id = d.project_id LEFT JOIN users u ON u.id = d.uploaded_by`;
        const params = [];
        if (req.user.role === 'manager') { query += ' WHERE p.manager_id = ?'; params.push(req.user.id); }
        if (req.user.role === 'engineer') { query += ' WHERE EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.engineer_id = ?)'; params.push(req.user.id); }
        query += ' ORDER BY p.name, d.title, d.version DESC';
        const [rows] = await db.query(query, params); return res.json({ success: true, data: rows });
    } catch (error) { return respondServerError(res, error); }
};

exports.uploadDocument = async (req, res) => {
    let storedLocation;
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn tài liệu.' });
        const { error, value } = documentValidator(req.body);
        if (error) { await removeLocalUpload(req.file); return res.status(400).json({ success: false, message: error.details[0].message }); }
        if (!(await hasProjectAccess(value.project_id, req.user))) { await removeLocalUpload(req.file); return res.status(403).json({ success: false, message: 'Bạn không có quyền tải tài liệu lên dự án này.' }); }
        const [versions] = await db.query(`SELECT COALESCE(group_id, id) AS group_id, version FROM project_documents WHERE project_id = ? AND title = ? ORDER BY version DESC LIMIT 1`, [value.project_id, value.title]);
        const version = versions.length ? versions[0].version + 1 : 1; const groupId = versions.length ? versions[0].group_id : null;
        const stored = await uploadStoredFile(req.file, `projects/${value.project_id}/documents`); storedLocation = stored.location;
        const [result] = await db.query(
            `INSERT INTO project_documents (project_id, group_id, title, version, file_path, file_name, mime_type, file_size, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [value.project_id, groupId, value.title, version, storedLocation, path.basename(req.file.originalname), req.file.mimetype, req.file.size, req.user.id]
        );
        if (!groupId) await db.query('UPDATE project_documents SET group_id = id WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, message: `Đã tải lên tài liệu phiên bản ${version} bằng ${stored.provider === 's3' ? 'Amazon S3' : 'lưu trữ local'}.`, data: { storage_provider: stored.provider } });
    } catch (error) {
        if (storedLocation) await deleteStoredFile(storedLocation).catch(() => {}); else await removeLocalUpload(req.file);
        return respondServerError(res, error);
    }
};

exports.downloadDocument = async (req, res) => {
    try {
        const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Tài liệu không hợp lệ.' });
        const [rows] = await db.query('SELECT id, project_id, file_path, file_name FROM project_documents WHERE id = ?', [id]);
        if (!rows.length || !(await hasProjectAccess(rows[0].project_id, req.user))) return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu.' });
        const stored = await getStoredFile(rows[0].file_path);
        if (stored.provider === 'local') {
            if (!fs.existsSync(stored.path)) return res.status(404).json({ success: false, message: 'File tài liệu không còn tồn tại.' });
            return res.download(stored.path, rows[0].file_name);
        }
        res.attachment(rows[0].file_name); if (stored.contentType) res.type(stored.contentType); if (stored.contentLength) res.setHeader('Content-Length', stored.contentLength);
        stored.body.on('error', (error) => { if (!res.headersSent) return respondServerError(res, error); res.destroy(error); });
        return stored.body.pipe(res);
    } catch (error) { return respondServerError(res, error); }
};
