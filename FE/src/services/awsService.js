import { apiGet, apiUpload } from './apiClient';

export const getAwsStatusApi = () => apiGet('/aws/status');
export const checkAwsHealthApi = () => apiGet('/aws/health');
export const transcribeWithAwsApi = (blob, language) => {
    const form = new FormData();
    form.append('audio', blob, `voice-${Date.now()}.webm`);
    form.append('language', language);
    return apiUpload('/aws/transcribe', form);
};
