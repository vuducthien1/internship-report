const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');
const pushService = require('../utils/pushService');

const isSafePushValue = (value, maxLength) => (
    typeof value === 'string' && value.length >= 16 && value.length <= maxLength
);

exports.getPushConfig = (_req, res) => res.json({
    success: true,
    enabled: pushService.enabled,
    publicKey: pushService.enabled ? pushService.publicKey : null,
});

exports.subscribePush = async (req, res) => {
    try {
        if (!pushService.enabled) {
            return res.status(503).json({ success: false, message: 'Web Push chưa được cấu hình trên máy chủ.' });
        }
        const { endpoint, keys } = req.body || {};
        if (!endpoint?.startsWith('https://') || endpoint.length > 1000
            || !isSafePushValue(keys?.p256dh, 255) || !isSafePushValue(keys?.auth, 255)) {
            return res.status(400).json({ success: false, message: 'Push subscription không hợp lệ.' });
        }
        await db.query(
            `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth), updated_at = NOW()`,
            [req.user.id, endpoint, keys.p256dh, keys.auth]
        );
        return res.status(201).json({ success: true, message: 'Đã bật thông báo đẩy.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.unsubscribePush = async (req, res) => {
    try {
        const endpoint = req.body?.endpoint;
        if (typeof endpoint !== 'string' || endpoint.length > 1000) {
            return res.status(400).json({ success: false, message: 'Push subscription không hợp lệ.' });
        }
        await db.query(
            'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?',
            [endpoint, req.user.id]
        );
        return res.json({ success: true, message: 'Đã tắt thông báo đẩy.' });
    } catch (error) {
        return respondServerError(res, error);
    }
};

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
