const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');

exports.getNotifications = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const [rows] = await db.query(
            `SELECT id, title, message, type, link, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [req.user.id, limit]
        );
        const [[count]] = await db.query(
            'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );
        return res.json({ success: true, data: rows, unread: count.unread });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'Thông báo không hợp lệ.' });
        }
        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        return res.json({ success: true });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
        return res.json({ success: true });
    } catch (error) {
        return respondServerError(res, error);
    }
};
