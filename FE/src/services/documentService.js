import { BASE_URL, apiGet, apiUpload, refreshAuthSession } from './apiClient';

export const getDocumentsApi = () => apiGet('/documents');
export const uploadDocumentApi = (payload, document) => {
    const form = new FormData();
    form.append('project_id', payload.project_id);
    form.append('title', payload.title);
    form.append('document', document);
    return apiUpload('/documents', form);
};

export const downloadDocumentApi = async (document, retry = true) => {
    const response = await fetch(`${BASE_URL}/documents/${document.id}/download`, {
        credentials: 'include',
    });
    if (response.status === 401 && retry && await refreshAuthSession()) {
        return downloadDocumentApi(document, false);
    }
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể tải tài liệu.');
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = document.file_name;
    anchor.click();
    URL.revokeObjectURL(url);
};
