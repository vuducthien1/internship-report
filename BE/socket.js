const { Server } = require('socket.io');
const chatController = require('./controllers/chatController');
const db = require('./config/db');
const aws = require('./config/aws');
const { allowedOrigins } = require('./config/security');
const resolveAuthUser = require('./utils/resolveAuthUser');

const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
        },
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Unauthorized'));
        }
        try {
            const user = await resolveAuthUser(token);
            if (!user || user.status !== 'active') {
                return next(new Error('Unauthorized'));
            }
            socket.user = { id: user.id, role: user.role };
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        socket.data.messageTimestamps = [];
        socket.join(`user_${socket.user.id}`);

        if (socket.user.role === 'admin') {
            socket.join('admin_monitor');
        }

        socket.on('join_conversation', async ({ conversationId }) => {
            try {
                const conv = await chatController.getConversationAccess(
                    Number(conversationId),
                    socket.user.id,
                    socket.user.role
                );
                if (conv) {
                    socket.join(`conversation_${conversationId}`);
                }
            } catch {
                socket.emit('chat_error', { message: 'Không thể mở cuộc trò chuyện.' });
            }
        });

        socket.on('leave_conversation', ({ conversationId }) => {
            socket.leave(`conversation_${conversationId}`);
        });

        socket.on('send_message', async (payload, callback) => {
            try {
                const now = Date.now();
                socket.data.messageTimestamps = socket.data.messageTimestamps
                    .filter((timestamp) => now - timestamp < 10_000);
                if (socket.data.messageTimestamps.length >= 10) {
                    return callback?.({
                        success: false,
                        message: 'Bạn gửi tin nhắn quá nhanh. Vui lòng chờ một chút.',
                    });
                }
                socket.data.messageTimestamps.push(now);

                const conversationId = Number(payload.conversationId);
                if (!Number.isInteger(conversationId) || conversationId <= 0) {
                    return callback?.({ success: false, message: 'Cuộc trò chuyện không hợp lệ.' });
                }
                const conv = await chatController.getConversationAccess(
                    conversationId,
                    socket.user.id,
                    socket.user.role
                );

                if (!conv) {
                    return callback?.({ success: false, message: 'Cuộc trò chuyện không tồn tại.' });
                }

                if (conv.is_locked && socket.user.role !== 'admin') {
                    return callback?.({ success: false, message: 'Cuộc trò chuyện đã bị khóa.' });
                }

                const isParticipant =
                    conv.user1_id === socket.user.id || conv.user2_id === socket.user.id;

                if (!isParticipant) {
                    return callback?.({ success: false, message: 'Admin chỉ có thể xem, không gửi tin nhắn.' });
                }

                const messageType = payload.messageType || 'text';
                if (!['text', 'voice'].includes(messageType)) {
                    return callback?.({ success: false, message: 'Loại tin nhắn không hợp lệ.' });
                }
                if (messageType === 'text' && !payload.content?.trim()) {
                    return callback?.({ success: false, message: 'Nội dung tin nhắn trống.' });
                }
                if (messageType === 'text' && payload.content.trim().length > 4000) {
                    return callback?.({ success: false, message: 'Tin nhắn không được vượt quá 4000 ký tự.' });
                }
                if (messageType === 'voice' && !payload.voiceUrl) {
                    return callback?.({ success: false, message: 'Thiếu file âm thanh.' });
                }
                const localVoiceUrl = /^\/uploads\/voice\/voice_[a-f0-9-]+\.(webm|ogg|wav|mp3|m4a)$/i
                    .test(payload.voiceUrl || '');
                const expectedS3Prefix = `s3://${aws.s3Bucket}/chat/${conversationId}/voice/`;
                const s3VoiceUrl = aws.s3Enabled && String(payload.voiceUrl || '').startsWith(expectedS3Prefix);
                if (messageType === 'voice' && !localVoiceUrl && !s3VoiceUrl) {
                    return callback?.({ success: false, message: 'Đường dẫn âm thanh không hợp lệ.' });
                }

                const message = await chatController.saveMessage(conversationId, socket.user.id, {
                    content: payload.content?.trim() || null,
                    messageType,
                    voiceUrl: payload.voiceUrl || null,
                });

                io.to(`conversation_${conversationId}`).emit('new_message', {
                    conversationId,
                    message,
                });

                io.to(`user_${conv.user1_id}`).emit('conversation_updated', { conversationId });
                io.to(`user_${conv.user2_id}`).emit('conversation_updated', { conversationId });
                io.to('admin_monitor').emit('conversation_updated', { conversationId });

                callback?.({ success: true, data: message });
            } catch (error) {
                console.error('Socket message error:', error);
                callback?.({ success: false, message: 'Không thể gửi tin nhắn.' });
            }
        });
    });

    return io;
};

module.exports = initSocket;
