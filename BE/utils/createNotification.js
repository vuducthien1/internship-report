const db = require('../config/db');

const createNotification = async (app, notification, connection = db) => {
    const { userId, title, message, type = 'info', link = null } = notification;
    const [result] = await connection.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, title, message, type, link]
    );

    const data = {
        id: result.insertId,
        user_id: userId,
        title,
        message,
        type,
        link,
        is_read: 0,
        created_at: new Date().toISOString(),
    };
    app?.get('io')?.to(`user_${userId}`).emit('notification:new', data);
    return data;
};

module.exports = createNotification;
