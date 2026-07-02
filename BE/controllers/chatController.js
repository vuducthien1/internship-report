const db = require('../config/db');
const respondServerError = require('../utils/respondServerError');
const { getStoredFileUrl } = require('../utils/storageService');

const hydrateMessageMedia = async (message) => ({
    ...message,
    voice_url: message.voice_url ? await getStoredFileUrl(message.voice_url) : null,
    file_url: message.file_url ? await getStoredFileUrl(message.file_url) : null,
});

const normalizePair = (userId1, userId2) => {
    const a = Number(userId1);
    const b = Number(userId2);
    return a < b ? [a, b] : [b, a];
};

const canChatWith = (myRole, otherRole) => {
    if (myRole === 'admin') return true;
    if (myRole === 'manager') return ['engineer', 'manager', 'admin'].includes(otherRole);
    if (myRole === 'engineer') return ['engineer', 'manager', 'admin'].includes(otherRole);
    return false;
};

const getConversationAccess = async (conversationId, userId, role) => {
    const [rows] = await db.query(
        `SELECT c.*, u1.fullname AS user1_name, u2.fullname AS user2_name
         FROM chat_conversations c
         JOIN users u1 ON u1.id = c.user1_id
         JOIN users u2 ON u2.id = c.user2_id
         WHERE c.id = ?`,
        [conversationId]
    );
    if (!rows.length) return null;

    const conv = rows[0];
    const isParticipant = conv.user1_id === userId || conv.user2_id === userId;
    if (!isParticipant && role !== 'admin') return null;

    return conv;
};

exports.getContacts = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const search = (req.query.search || '').trim();

        let query = `
            SELECT id, fullname, username, email, role
            FROM users
            WHERE deleted_at IS NULL
              AND status = 'active'
              AND id != ?
        `;
        const params = [userId];

        if (role === 'manager') {
            query += ` AND role IN ('engineer', 'manager', 'admin')`;
        } else if (role === 'engineer') {
            query += ` AND role IN ('engineer', 'manager', 'admin')`;
        }

        if (search) {
            query += ` AND (fullname LIKE ? OR username LIKE ? OR email LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ` ORDER BY fullname ASC`;

        const [users] = await db.query(query, params);
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getConversations = async (req, res) => {
    try {
        const { id: userId, role } = req.user;

        let query = `
            SELECT c.*,
                   u1.fullname AS user1_name, u1.role AS user1_role,
                   u2.fullname AS user2_name, u2.role AS user2_role,
                   m.content AS last_message, m.message_type AS last_message_type,
                   m.created_at AS last_message_at, m.sender_id AS last_sender_id
            FROM chat_conversations c
            JOIN users u1 ON u1.id = c.user1_id
            JOIN users u2 ON u2.id = c.user2_id
            LEFT JOIN chat_messages m ON m.id = (
                SELECT id FROM chat_messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            )
        `;
        const params = [];

        if (role !== 'admin') {
            query += ` WHERE (c.user1_id = ? OR c.user2_id = ?)`;
            params.push(userId, userId);
        }

        query += ` ORDER BY COALESCE(m.created_at, c.updated_at) DESC`;

        const [conversations] = await db.query(query, params);

        const data = conversations.map((c) => {
            const isUser1 = c.user1_id === userId;
            const otherName = role === 'admin'
                ? `${c.user1_name} ↔ ${c.user2_name}`
                : (isUser1 ? c.user2_name : c.user1_name);
            const otherId = isUser1 ? c.user2_id : c.user1_id;
            const otherRole = isUser1 ? c.user2_role : c.user1_role;

            return {
                id: c.id,
                other_user_id: role === 'admin' ? null : otherId,
                other_user_name: otherName,
                other_user_role: role === 'admin' ? null : otherRole,
                user1_id: c.user1_id,
                user2_id: c.user2_id,
                user1_name: c.user1_name,
                user2_name: c.user2_name,
                is_locked: !!c.is_locked,
                last_message: c.last_message,
                last_message_type: c.last_message_type,
                last_message_at: c.last_message_at,
                last_sender_id: c.last_sender_id,
            };
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.startConversation = async (req, res) => {
    try {
        const { id: userId, role } = req.user;
        const otherUserId = Number(req.body.other_user_id);

        if (!otherUserId || otherUserId === userId) {
            return res.status(400).json({ success: false, message: 'Người nhận không hợp lệ.' });
        }

        const [others] = await db.query(
            `SELECT id, role, status FROM users WHERE id = ? AND deleted_at IS NULL`,
            [otherUserId]
        );
        if (!others.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        const other = others[0];
        if (other.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Tài khoản người nhận không khả dụng.' });
        }

        if (!canChatWith(role, other.role)) {
            return res.status(403).json({ success: false, message: 'Bạn không thể chat với người dùng này.' });
        }

        const [user1Id, user2Id] = normalizePair(userId, otherUserId);

        const [result] = await db.query(
            `INSERT INTO chat_conversations (user1_id, user2_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
            [user1Id, user2Id]
        );

        return res.status(200).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.getMessages = async (req, res) => {
    try {
        const conversationId = Number(req.params.id);
        const conv = await getConversationAccess(conversationId, req.user.id, req.user.role);

        if (!conv) {
            return res.status(404).json({ success: false, message: 'Cuộc trò chuyện không tồn tại.' });
        }

        const [messages] = await db.query(
            `SELECT m.*, u.fullname AS sender_name, u.role AS sender_role
             FROM chat_messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.conversation_id = ?
             ORDER BY m.created_at ASC`,
            [conversationId]
        );

        const hydratedMessages = await Promise.all(messages.map(hydrateMessageMedia));
        return res.status(200).json({
            success: true,
            data: {
                conversation: {
                    id: conv.id,
                    is_locked: !!conv.is_locked,
                    user1_id: conv.user1_id,
                    user2_id: conv.user2_id,
                    user1_name: conv.user1_name,
                    user2_name: conv.user2_name,
                },
                messages: hydratedMessages,
            },
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.setConversationLock = async (req, res) => {
    try {
        const conversationId = Number(req.params.id);
        const { locked } = req.body;

        const [rows] = await db.query(`SELECT id FROM chat_conversations WHERE id = ?`, [conversationId]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Cuộc trò chuyện không tồn tại.' });
        }

        if (locked) {
            await db.query(
                `UPDATE chat_conversations SET is_locked = 1, locked_by = ?, locked_at = NOW() WHERE id = ?`,
                [req.user.id, conversationId]
            );
        } else {
            await db.query(
                `UPDATE chat_conversations SET is_locked = 0, locked_by = NULL, locked_at = NULL WHERE id = ?`,
                [conversationId]
            );
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`conversation_${conversationId}`).emit('conversation_lock_changed', {
                conversationId,
                is_locked: !!locked,
            });
        }

        return res.status(200).json({
            success: true,
            message: locked ? 'Đã khóa cuộc trò chuyện.' : 'Đã mở khóa cuộc trò chuyện.',
            data: { id: conversationId, is_locked: !!locked },
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.saveMessage = async (
    conversationId,
    senderId,
    { content, messageType, voiceUrl, fileUrl, fileName, fileSize, fileMime }
) => {
    const [result] = await db.query(
        `INSERT INTO chat_messages
         (conversation_id, sender_id, message_type, content, voice_url,
          file_url, file_name, file_size, file_mime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conversationId,
            senderId,
            messageType || 'text',
            content || null,
            voiceUrl || null,
            fileUrl || null,
            fileName || null,
            fileSize || null,
            fileMime || null,
        ]
    );

    await db.query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?`, [conversationId]);

    const [rows] = await db.query(
        `SELECT m.*, u.fullname AS sender_name, u.role AS sender_role
         FROM chat_messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.id = ?`,
        [result.insertId]
    );

    return hydrateMessageMedia(rows[0]);
};

exports.getConversationAccess = getConversationAccess;
exports.canChatWith = canChatWith;
