import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    getChatContactsApi,
    getConversationsApi,
    startConversationApi,
    getMessagesApi,
    lockConversationApi,
    uploadVoiceApi,
    uploadChatAttachmentApi,
    getSocketUrl,
    getVoiceFullUrl,
    getChatFileFullUrl,
} from '../../services/chatService';
import { refreshAuthSession } from '../../services/apiClient';

function ChatWidget() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';

    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('chats');
    const [conversations, setConversations] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [convMeta, setConvMeta] = useState(null);
    const [inputText, setInputText] = useState('');
    const [contactSearch, setContactSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [error, setError] = useState('');

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const activeConvIdRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = useCallback(async () => {
        const data = await getConversationsApi();
        if (data.success) setConversations(data.data);
    }, []);

    const loadContacts = useCallback(async () => {
        const data = await getChatContactsApi(contactSearch);
        if (data.success) setContacts(data.data);
    }, [contactSearch]);

    useEffect(() => {
        if (!user) return undefined;

        const socket = io(getSocketUrl(), { withCredentials: true });
        let refreshingSocket = false;
        socketRef.current = socket;

        socket.on('connect_error', async (connectError) => {
            if (connectError.message !== 'Unauthorized' || refreshingSocket) return;
            refreshingSocket = true;
            const refreshed = await refreshAuthSession();
            refreshingSocket = false;
            if (refreshed) socket.connect();
        });

        socket.on('new_message', ({ conversationId, message }) => {
            if (conversationId === activeConvIdRef.current) {
                setMessages((prev) => prev.some((item) => item.id === message.id)
                    ? prev
                    : [...prev, message]);
                setTimeout(scrollToBottom, 100);
            }
            loadConversations();
        });

        socket.on('conversation_updated', () => {
            loadConversations();
        });

        socket.on('conversation_lock_changed', ({ conversationId, is_locked }) => {
            if (conversationId === activeConvIdRef.current) {
                setConvMeta((prev) => (prev ? { ...prev, is_locked } : prev));
            }
            loadConversations();
        });

        socket.on('chat_error', ({ message }) => {
            setError(message);
        });

        return () => {
            socket.disconnect();
        };
    }, [user, loadConversations]);

    useEffect(() => {
        if (open && tab === 'new') {
            const timer = setTimeout(loadContacts, 300);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [open, tab, loadContacts]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const openConversation = async (convId) => {
        setLoading(true);
        setError('');
        setActiveConvId(convId);
        activeConvIdRef.current = convId;
        setTab('chats');

        socketRef.current?.emit('join_conversation', { conversationId: convId });

        const data = await getMessagesApi(convId);
        if (data.success) {
            setMessages(data.data.messages);
            setConvMeta(data.data.conversation);
        } else {
            setError(data.message);
        }
        setLoading(false);
    };

    const startChat = async (contactId) => {
        setLoading(true);
        const data = await startConversationApi(contactId);
        if (data.success) {
            await loadConversations();
            await openConversation(data.data.id);
        } else {
            setError(data.message);
        }
        setLoading(false);
    };

    const sendTextMessage = () => {
        if (!inputText.trim() || !activeConvId || convMeta?.is_locked) return;

        socketRef.current?.emit(
            'send_message',
            { conversationId: activeConvId, content: inputText.trim(), messageType: 'text' },
            (res) => {
                if (res?.success) {
                    setInputText('');
                    loadConversations();
                } else if (res?.message) {
                    setError(res.message);
                }
            }
        );
    };

    const startVoiceRecord = async () => {
        if (convMeta?.is_locked || recording || !activeConvId) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';
            const mediaRecorder = new MediaRecorder(
                stream,
                preferredType ? { mimeType: preferredType } : undefined
            );
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                const blob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm',
                });
                if (blob.size < 100) {
                    setError(t('voiceTooShort'));
                    return;
                }
                const upload = await uploadVoiceApi(activeConvId, blob);
                if (upload.success) {
                    socketRef.current?.emit(
                        'send_message',
                        {
                            conversationId: activeConvId,
                            messageType: 'voice',
                            voiceUrl: upload.data.voice_url,
                        },
                        (res) => {
                            if (res?.success) {
                                loadConversations();
                            } else if (res?.message) {
                                setError(res.message);
                            }
                        }
                    );
                } else {
                    setError(upload.message);
                }
            };

            mediaRecorder.start();
            setRecording(true);
        } catch {
            setError(t('micPermissionDenied'));
        }
    };

    const stopVoiceRecord = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
    };

    const sendAttachment = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !activeConvId || convMeta?.is_locked) return;
        if (file.size > 15 * 1024 * 1024) {
            setError(t('chatFileTooLarge'));
            return;
        }

        const conversationId = activeConvId;
        setUploadingAttachment(true);
        setError('');
        const result = await uploadChatAttachmentApi(conversationId, file);
        if (result.success) {
            if (activeConvIdRef.current === conversationId) {
                setMessages((current) => current.some((item) => item.id === result.data.id)
                    ? current
                    : [...current, result.data]);
            }
            await loadConversations();
            setTimeout(scrollToBottom, 100);
        } else {
            setError(result.message);
        }
        setUploadingAttachment(false);
    };

    const handleToggleLock = async () => {
        if (!activeConvId || !convMeta) return;
        const locked = !convMeta.is_locked;
        const data = await lockConversationApi(activeConvId, locked);
        if (data.success) {
            setConvMeta({ ...convMeta, is_locked: locked });
            loadConversations();
        } else {
            setError(data.message);
        }
    };

    const getConvTitle = (conv) => {
        if (isAdmin && !conv.other_user_name.includes('↔')) {
            return `${conv.user1_name} ↔ ${conv.user2_name}`;
        }
        return conv.other_user_name;
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatFileSize = (bytes) => {
        const size = Number(bytes) || 0;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleToggleOpen = () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (nextOpen) loadConversations();
    };

    if (!user) return null;

    return (
        <>
            <button
                type="button"
                className="chat-fab"
                onClick={handleToggleOpen}
                aria-label={t('chat')}
            >
                💬
            </button>

            {open && (
                <div className="chat-widget">
                    <div className="chat-header">
                        <h3>{t('chat')}</h3>
                        <button type="button" className="chat-close-btn" onClick={() => setOpen(false)}>
                            ✕
                        </button>
                    </div>

                    {error && <div className="chat-error">{error}</div>}

                    <div className="chat-body">
                        <div className="chat-sidebar">
                            <div className="chat-tabs">
                                <button
                                    type="button"
                                    className={`chat-tab ${tab === 'chats' ? 'active' : ''}`}
                                    onClick={() => setTab('chats')}
                                >
                                    {isAdmin ? t('allChats') : t('myChats')}
                                </button>
                                {!isAdmin && (
                                    <button
                                        type="button"
                                        className={`chat-tab ${tab === 'new' ? 'active' : ''}`}
                                        onClick={() => setTab('new')}
                                    >
                                        +
                                    </button>
                                )}
                            </div>

                            {tab === 'chats' ? (
                                <div className="chat-conv-list">
                                    {conversations.length > 0 ? (
                                        conversations.map((conv) => (
                                            <button
                                                key={conv.id}
                                                type="button"
                                                className={`chat-conv-item ${activeConvId === conv.id ? 'active' : ''}`}
                                                onClick={() => openConversation(conv.id)}
                                            >
                                                <div className="chat-conv-name">
                                                    {getConvTitle(conv)}
                                                    {conv.is_locked && <span className="chat-lock-badge">🔒</span>}
                                                </div>
                                                <div className="chat-conv-preview">
                                                    {conv.last_message_type === 'voice'
                                                        ? `🎤 ${t('voiceMessage')}`
                                                        : conv.last_message_type === 'image'
                                                            ? `🖼️ ${t('imageMessage')}`
                                                            : conv.last_message_type === 'file'
                                                                ? `📎 ${t('fileMessage')}`
                                                                : conv.last_message || t('noMessages')}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="chat-empty">{t('noConversations')}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="chat-conv-list">
                                    <input
                                        type="text"
                                        className="form-input chat-search"
                                        placeholder={t('searchPlaceholder')}
                                        value={contactSearch}
                                        onChange={(e) => setContactSearch(e.target.value)}
                                    />
                                    {contacts.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="chat-conv-item"
                                            onClick={() => startChat(c.id)}
                                        >
                                            <div className="chat-conv-name">{c.fullname}</div>
                                            <div className="chat-conv-preview">{c.role}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="chat-main">
                            {activeConvId ? (
                                <>
                                    <div className="chat-main-header">
                                        <span>
                                            {convMeta
                                                ? `${convMeta.user1_name} ↔ ${convMeta.user2_name}`
                                                : t('loading')}
                                        </span>
                                        {isAdmin && convMeta && (
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${convMeta.is_locked ? 'btn-success' : 'btn-danger'}`}
                                                onClick={handleToggleLock}
                                            >
                                                {convMeta.is_locked ? t('unlockChat') : t('lockChat')}
                                            </button>
                                        )}
                                    </div>

                                    {convMeta?.is_locked && (
                                        <div className="chat-locked-banner">{t('chatLockedNotice')}</div>
                                    )}

                                    <div className="chat-messages">
                                        {loading ? (
                                            <div className="chat-empty">{t('loading')}</div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isRightAligned = isAdmin
                                                    ? msg.sender_id === convMeta?.user2_id
                                                    : msg.sender_id === user.id;
                                                const showSenderName = isAdmin || !isRightAligned;
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`chat-message ${isRightAligned ? 'mine' : 'theirs'}`}
                                                    >
                                                        {showSenderName && (
                                                            <div className="chat-msg-sender">{msg.sender_name}</div>
                                                        )}
                                                        {msg.message_type === 'voice' ? (
                                                            <audio
                                                                controls
                                                                src={getVoiceFullUrl(msg.voice_url)}
                                                                className="chat-voice-player"
                                                            />
                                                        ) : msg.message_type === 'image' ? (
                                                            <a
                                                                href={getChatFileFullUrl(msg.file_url)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="chat-image-link"
                                                            >
                                                                <img
                                                                    src={getChatFileFullUrl(msg.file_url)}
                                                                    alt={msg.file_name || t('imageMessage')}
                                                                    className="chat-image-preview"
                                                                />
                                                                <span className="chat-attachment-name">{msg.file_name}</span>
                                                            </a>
                                                        ) : msg.message_type === 'file' ? (
                                                            <a
                                                                href={getChatFileFullUrl(msg.file_url)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="chat-file-card"
                                                            >
                                                                <span className="chat-file-icon">📄</span>
                                                                <span className="min-w-0">
                                                                    <span className="chat-file-name">{msg.file_name || t('fileMessage')}</span>
                                                                    <span className="chat-file-size">{formatFileSize(msg.file_size)}</span>
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <div className="chat-msg-bubble">{msg.content}</div>
                                                        )}
                                                        <div className="chat-msg-time">{formatTime(msg.created_at)}</div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {!isAdmin && (
                                        <div className="chat-input-bar">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
                                                onChange={sendAttachment}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={t('typeMessage')}
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                                                disabled={convMeta?.is_locked}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={convMeta?.is_locked || uploadingAttachment}
                                                title={t('sendAttachment')}
                                                aria-label={t('sendAttachment')}
                                            >
                                                {uploadingAttachment ? '…' : '📎'}
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${recording ? 'btn-danger' : 'btn-outline'}`}
                                                onPointerDown={startVoiceRecord}
                                                onPointerUp={stopVoiceRecord}
                                                onPointerLeave={recording ? stopVoiceRecord : undefined}
                                                disabled={convMeta?.is_locked}
                                                title={t('holdToRecord')}
                                            >
                                                {recording ? '⏹' : '🎤'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={sendTextMessage}
                                                disabled={convMeta?.is_locked || !inputText.trim()}
                                            >
                                                ➤
                                            </button>
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <div className="chat-admin-notice">{t('adminChatViewOnly')}</div>
                                    )}
                                </>
                            ) : (
                                <div className="chat-empty-main">{t('selectConversation')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatWidget;
