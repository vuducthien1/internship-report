import { apiGet, apiUpload } from './apiClient';

export const getAwsStatusApi = () => apiGet('/aws/status');
export const checkAwsHealthApi = () => apiGet('/aws/health');
export const transcribeWithAwsApi = (blob, language) => {
    const form = new FormData();
    form.append('audio', blob, `voice-${Date.now()}.webm`);
    form.append('language', language);
    return apiUpload('/aws/transcribe', form);
};

export const getAwsTranscriptionJobApi = (jobId) => apiGet(`/aws/transcribe/${jobId}`);

export const waitForAwsTranscriptionApi = async (jobId, options = {}) => {
    const attempts = options.attempts || 90;
    const intervalMs = options.intervalMs || 2000;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        const result = await getAwsTranscriptionJobApi(jobId);
        if (!result.success) return result;
        if (result.data.status === 'completed') {
            return { success: true, data: { transcript: result.data.transcript || '', provider: 'amazon-sqs-transcribe' } };
        }
        if (result.data.status === 'failed') {
            return { success: false, message: result.data.error_message || 'Amazon Transcribe không thể xử lý file.' };
        }
    }
    return { success: false, message: 'Amazon Transcribe đang xử lý lâu hơn dự kiến. Vui lòng thử lại sau.' };
};
