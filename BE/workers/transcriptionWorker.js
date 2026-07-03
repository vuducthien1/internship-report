const {
    DeleteMessageCommand,
    ReceiveMessageCommand,
} = require('@aws-sdk/client-sqs');
const {
    GetTranscriptionJobCommand,
    StartTranscriptionJobCommand,
} = require('@aws-sdk/client-transcribe');
const db = require('../config/db');
const aws = require('../config/aws');
const { deleteStoredFile } = require('../utils/storageService');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let stopping = false;

const finishMessage = (receiptHandle) => aws.sqs.send(new DeleteMessageCommand({
    QueueUrl: aws.transcribeQueueUrl,
    ReceiptHandle: receiptHandle,
}));

const processMessage = async (message) => {
    let payload;
    try {
        payload = JSON.parse(message.Body || '{}');
    } catch {
        await finishMessage(message.ReceiptHandle);
        return;
    }

    const jobId = Number(payload.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0 || !payload.inputLocation) {
        await finishMessage(message.ReceiptHandle);
        return;
    }

    const providerJobName = `vdcms-${jobId}-${Date.now()}`;
    try {
        const [jobs] = await db.query('SELECT status FROM transcription_jobs WHERE id = ?', [jobId]);
        if (!jobs.length || jobs[0].status === 'completed') {
            await finishMessage(message.ReceiptHandle);
            return;
        }

        await db.query(
            `UPDATE transcription_jobs
             SET status = 'processing', provider_job_name = ?, error_message = NULL,
                 started_at = COALESCE(started_at, NOW())
             WHERE id = ?`,
            [providerJobName, jobId]
        );

        await aws.transcribe.send(new StartTranscriptionJobCommand({
            TranscriptionJobName: providerJobName,
            LanguageCode: payload.languageCode === 'en-US' ? 'en-US' : 'vi-VN',
            MediaFormat: payload.mediaFormat || 'webm',
            Media: { MediaFileUri: payload.inputLocation },
            ...(aws.transcribeRoleArn ? {
                JobExecutionSettings: {
                    AllowDeferredExecution: true,
                    DataAccessRoleArn: aws.transcribeRoleArn,
                },
            } : {}),
        }));

        const timeoutMs = Math.max(60_000, Number(process.env.AWS_TRANSCRIBE_WORKER_TIMEOUT_SECONDS || 840) * 1000);
        const startedAt = Date.now();
        while (!stopping && Date.now() - startedAt < timeoutMs) {
            await wait(3000);
            const response = await aws.transcribe.send(new GetTranscriptionJobCommand({
                TranscriptionJobName: providerJobName,
            }));
            const providerJob = response.TranscriptionJob;
            if (providerJob.TranscriptionJobStatus === 'FAILED') {
                throw new Error(providerJob.FailureReason || 'Amazon Transcribe không thể xử lý file.');
            }
            if (providerJob.TranscriptionJobStatus === 'COMPLETED') {
                const transcriptResponse = await fetch(providerJob.Transcript.TranscriptFileUri);
                if (!transcriptResponse.ok) throw new Error('Không thể tải kết quả Amazon Transcribe.');
                const transcriptPayload = await transcriptResponse.json();
                const transcript = transcriptPayload.results?.transcripts?.[0]?.transcript?.trim() || '';
                await db.query(
                    `UPDATE transcription_jobs
                     SET status = 'completed', transcript = ?, error_message = NULL, completed_at = NOW()
                     WHERE id = ?`,
                    [transcript, jobId]
                );
                await deleteStoredFile(payload.inputLocation).catch(() => {});
                await finishMessage(message.ReceiptHandle);
                return;
            }
        }
        if (stopping) return;
        throw new Error('Tác vụ Amazon Transcribe vượt quá thời gian xử lý của worker.');
    } catch (error) {
        await db.query(
            `UPDATE transcription_jobs
             SET status = 'failed', error_message = ?
             WHERE id = ?`,
            [String(error.message || 'Worker không thể xử lý tác vụ').slice(0, 1000), jobId]
        ).catch(() => {});
        throw error;
    }
};

const poll = async () => {
    if (!aws.sqsEnabled || !aws.transcribeEnabled) {
        throw new Error('Worker yêu cầu AWS_TRANSCRIBE_QUEUE_URL, AWS_S3_BUCKET và AWS_TRANSCRIBE_ENABLED=true.');
    }
    console.log('✅ SQS Transcribe worker đã khởi động.');
    while (!stopping) {
        try {
            const response = await aws.sqs.send(new ReceiveMessageCommand({
                QueueUrl: aws.transcribeQueueUrl,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
                VisibilityTimeout: 900,
                MessageAttributeNames: ['All'],
                AttributeNames: ['ApproximateReceiveCount'],
            }));
            for (const message of response.Messages || []) {
                try {
                    await processMessage(message);
                } catch (error) {
                    console.error('Transcribe worker error:', error.message);
                }
            }
        } catch (error) {
            console.error('SQS polling error:', error.message);
            if (!stopping) await wait(5000);
        }
    }
};

process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });

if (require.main === module) {
    poll()
        .then(async () => {
            await db.end().catch(() => {});
            process.exit(0);
        })
        .catch(async (error) => {
            console.error('Không thể khởi động SQS worker:', error.message);
            await db.end().catch(() => {});
            process.exit(1);
        });
}

module.exports = { processMessage, poll };
