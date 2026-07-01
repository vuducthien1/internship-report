const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');
const { contactValidator, contactStatusValidator } = require('../validations/publicValidation');

exports.getPublicStats = async (_req, res) => {
    try {
        const [[projects], [engineers], [reports], [completedTasks]] = await Promise.all([
            db.query('SELECT COUNT(*) AS total FROM projects'),
            db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'engineer' AND status = 'active' AND deleted_at IS NULL"),
            db.query("SELECT COUNT(*) AS total FROM reports WHERE approval_status = 'approved'"),
            db.query("SELECT COUNT(*) AS total FROM tasks WHERE status = 'completed'"),
        ]);
        return res.json({
            success: true,
            data: {
                projects: Number(projects[0].total),
                engineers: Number(engineers[0].total),
                reports: Number(reports[0].total),
                completed_tasks: Number(completedTasks[0].total),
            },
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.submitContact = async (req, res) => {
    try {
        const { error, value } = contactValidator(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        await db.query(
            `INSERT INTO contact_requests (fullname, email, phone, company, message)
             VALUES (?, ?, ?, ?, ?)`,
            [value.fullname, value.email, value.phone || null, value.company || null, value.message]
        );
        return res.status(201).json({ success: true, message: 'Đã gửi yêu cầu liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getContactRequests = async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contact_requests ORDER BY created_at DESC');
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.updateContactStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { error, value } = contactStatusValidator(req.body);
        if (!Number.isInteger(id) || id <= 0 || error) {
            return res.status(400).json({ success: false, message: 'Yêu cầu hoặc trạng thái không hợp lệ.' });
        }
        const [result] = await db.query('UPDATE contact_requests SET status = ? WHERE id = ?', [value.status, id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu liên hệ.' });
        return res.json({ success: true, message: 'Đã cập nhật yêu cầu liên hệ.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};
