import { apiGet, apiPost, apiPatch, apiUpload } from './apiClient';

const SOCKET_URL = (
    import.meta.env.VITE_SOCKET_URL
    || (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
).replace(/\/$/, '');

export const getChatContactsApi = (search = '') =>
    apiGet(`/chat/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getConversationsApi = () => apiGet('/chat/conversations');

export const startConversationApi = (otherUserId) =>
    apiPost('/chat/conversations', { other_user_id: otherUserId });

export const getMessagesApi = (conversationId) =>
    apiGet(`/chat/conversations/${conversationId}/messages`);

export const lockConversationApi = (conversationId, locked) =>
    apiPatch(`/chat/conversations/${conversationId}/lock`, { locked });

export const uploadVoiceApi = (conversationId, blob) => {
    const formData = new FormData();
    formData.append('voice', blob, `voice_${Date.now()}.webm`);
    return apiUpload(`/chat/conversations/${conversationId}/voice`, formData);
};

export const uploadChatAttachmentApi = (conversationId, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return apiUpload(`/chat/conversations/${conversationId}/attachments`, formData);
};

export const getSocketUrl = () => SOCKET_URL;

export const getVoiceFullUrl = (voiceUrl) => {
    if (!voiceUrl) return '';
    if (voiceUrl.startsWith('http')) return voiceUrl;
    return `${SOCKET_URL}${voiceUrl}`;
};

export const getChatFileFullUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${SOCKET_URL}${fileUrl}`;
};
