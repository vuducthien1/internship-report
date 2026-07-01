const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');

exports.getActivityLogs = async (_req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.id, a.action, a.description, a.created_at,
                    u.fullname, u.username
             FROM activity_logs a
             LEFT JOIN users u ON u.id = a.user_id
             ORDER BY a.created_at DESC
             LIMIT 500`
        );
        return res.json({ success: true, data: rows });
    } catch (error) {
        return respondServerError(res, error);
    }
};
