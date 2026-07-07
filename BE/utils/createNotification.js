const db = require('../config/db');
const { sendPushToUser } = require('./pushService');

const createNotification = async (app, notification, connection = db) => {
    const {
        userId,
        title,
        message,
        type = 'info',
        link = null,
        push = false,
        urgent = false,
    } = notification;
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
    if (push) {
        sendPushToUser(userId, {
            title,
            message,
            type,
            link,
            urgent,
            requireInteraction: urgent,
            renotify: urgent,
            tag: `${type}-${data.id}`,
        }).catch((error) => console.error('Không thể gửi thông báo đẩy:', error.message));
    }
    return data;
};

module.exports = createNotification;
