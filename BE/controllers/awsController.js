const path = require('path');
const { GetAccountCommand } = require('@aws-sdk/client-sesv2');
const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const { GetTranscriptionJobCommand, ListTranscriptionJobsCommand, StartTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { GetQueueAttributesCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const aws = require('../config/aws');
const db = require('../config/db');
const { deleteStoredFile, uploadStoredFile } = require('../utils/storageService');
const respondServerError = require('../utils/respondServerError');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const mediaFormat = (file) => {
    const extension = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (extension === 'm4a') return 'm4a'; if (extension === 'mp4') return 'mp4'; if (extension === 'mp3') return 'mp3';
    if (extension === 'wav') return 'wav'; if (extension === 'ogg') return 'ogg'; return 'webm';
};

exports.getStatus = async (_req, res) => res.json({
    success: true,
    data: {
        region: aws.region,
        services: {
            s3: { configured: aws.s3Enabled, mode: aws.s3Enabled ? 'amazon-s3' : 'local-fallback' },
            ses: { configured: aws.sesEnabled, mode: aws.sesEnabled ? 'amazon-ses' : process.env.RESEND_API_KEY ? 'resend-fallback' : 'outbox-fallback' },
            transcribe: { configured: aws.transcribeEnabled, mode: aws.transcribeEnabled ? 'amazon-transcribe' : 'browser-fallback' },
            sqs: { configured: aws.sqsEnabled, mode: aws.sqsEnabled ? 'async-transcribe-queue' : 'synchronous-fallback' },
            rds: { configured: process.env.AWS_RDS_ENABLED === 'true', mode: process.env.AWS_RDS_ENABLED === 'true' ? 'amazon-rds-mysql' : 'mysql-local' },
            cognito: { configured: aws.cognitoEnabled, mode: aws.cognitoEnabled ? 'provisioned-dual-auth' : 'legacy-jwt' },
            cloudfront: { configured: Boolean(process.env.AWS_CLOUDFRONT_DOMAIN), mode: process.env.AWS_CLOUDFRONT_DOMAIN ? 'cloudfront' : 'vite-local' },
        },
    },
});

exports.checkHealth = async (_req, res) => {
    const checks = {};
    const run = async (name, configured, operation) => {
        if (!configured) { checks[name] = { configured: false, healthy: false, message: 'Chưa cấu hình' }; return; }
        try { await operation(); checks[name] = { configured: true, healthy: true, message: 'Kết nối thành công' }; }
        catch (error) { checks[name] = { configured: true, healthy: false, message: error.name || 'Không thể kết nối' }; }
    };
    await Promise.all([
        run('s3', aws.s3Enabled, () => aws.s3.send(new HeadBucketCommand({ Bucket: aws.s3Bucket }))),
        run('ses', aws.sesEnabled, () => aws.ses.send(new GetAccountCommand({}))),
        run('transcribe', aws.transcribeEnabled, () => aws.transcribe.send(new ListTranscriptionJobsCommand({ MaxResults: 1 }))),
        run('sqs', aws.sqsEnabled, () => aws.sqs.send(new GetQueueAttributesCommand({ QueueUrl: aws.transcribeQueueUrl, AttributeNames: ['QueueArn'] }))),
        run('rds', process.env.AWS_RDS_ENABLED === 'true', () => db.query('SELECT 1')),
    ]);
    return res.json({ success: true, data: checks });
};

exports.transcribeAudio = async (req, res) => {
    if (aws.sqsEnabled) {
        let storedLocation;
        let jobId;
        try {
            if (!aws.transcribeEnabled) {
                return res.status(503).json({ success: false, message: 'Amazon Transcribe chưa được cấu hình.' });
            }
            const languageCode = req.body.language === 'en-US' ? 'en-US' : 'vi-VN';
            const stored = await uploadStoredFile(req.file, 'transcribe/input');
            storedLocation = stored.location;
            if (stored.provider !== 's3') {
                throw new Error('SQS Transcribe yêu cầu file đầu vào được lưu trên Amazon S3.');
            }
            const format = mediaFormat(req.file);
            const [result] = await db.query(
                `INSERT INTO transcription_jobs
                 (user_id, input_location, language_code, media_format, status)
                 VALUES (?, ?, ?, ?, 'queued')`,
                [req.user.id, storedLocation, languageCode, format]
            );
            jobId = result.insertId;
            await aws.sqs.send(new SendMessageCommand({
                QueueUrl: aws.transcribeQueueUrl,
                MessageBody: JSON.stringify({
                    jobId,
                    userId: req.user.id,
                    inputLocation: storedLocation,
                    languageCode,
                    mediaFormat: format,
                }),
                MessageAttributes: {
                    jobType: { DataType: 'String', StringValue: 'transcription' },
                },
            }));
            return res.status(202).json({
                success: true,
                message: 'Đã đưa file vào hàng đợi Amazon SQS.',
                data: { job_id: jobId, status: 'queued', provider: 'amazon-sqs-transcribe' },
            });
        } catch (error) {
            if (jobId) {
                await db.query(
                    `UPDATE transcription_jobs SET status = 'failed', error_message = ? WHERE id = ?`,
                    [String(error.message || 'Không thể đưa tác vụ vào SQS').slice(0, 1000), jobId]
                ).catch(() => {});
            }
            if (storedLocation) await deleteStoredFile(storedLocation).catch(() => {});
            return respondServerError(res, error);
        }
    }

    let storedLocation;
    try {
        if (!aws.transcribeEnabled) return res.status(503).json({ success: false, message: 'Amazon Transcribe chưa được cấu hình. Hệ thống sẽ dùng nhận dạng giọng nói của trình duyệt.' });
        const languageCode = req.body.language === 'en-US' ? 'en-US' : 'vi-VN';
        const stored = await uploadStoredFile(req.file, 'transcribe/input'); storedLocation = stored.location;
        const jobName = `vdcms-${Date.now()}-${req.user.id}`;
        await aws.transcribe.send(new StartTranscriptionJobCommand({
            TranscriptionJobName: jobName, LanguageCode: languageCode, MediaFormat: mediaFormat(req.file), Media: { MediaFileUri: storedLocation },
            ...(aws.transcribeRoleArn ? { JobExecutionSettings: { AllowDeferredExecution: true, DataAccessRoleArn: aws.transcribeRoleArn } } : {}),
        }));
        const timeoutSeconds = Math.min(180, Math.max(30, Number(process.env.AWS_TRANSCRIBE_TIMEOUT_SECONDS || 90))); const started = Date.now();
        while ((Date.now() - started) / 1000 < timeoutSeconds) {
            await wait(2000);
            const result = await aws.transcribe.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
            const job = result.TranscriptionJob;
            if (job.TranscriptionJobStatus === 'FAILED') throw new Error(job.FailureReason || 'Amazon Transcribe không thể xử lý file.');
            if (job.TranscriptionJobStatus === 'COMPLETED') {
                const response = await fetch(job.Transcript.TranscriptFileUri); if (!response.ok) throw new Error('Không thể đọc kết quả Transcribe.');
                const transcript = await response.json(); const text = transcript.results?.transcripts?.[0]?.transcript?.trim() || '';
                return res.json({ success: true, data: { transcript: text, provider: 'amazon-transcribe', job_name: jobName } });
            }
        }
        return res.status(504).json({ success: false, message: 'Amazon Transcribe xử lý quá thời gian chờ. Vui lòng thử lại.' });
    } catch (error) { return respondServerError(res, error); }
    finally { if (storedLocation) await deleteStoredFile(storedLocation).catch(() => {}); }
};

exports.getTranscriptionJob = async (req, res) => {
    try {
        const jobId = Number(req.params.id);
        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({ success: false, message: 'Tác vụ Transcribe không hợp lệ.' });
        }
        const [rows] = await db.query(
            `SELECT id, status, transcript, error_message, language_code, created_at, started_at, completed_at
             FROM transcription_jobs
             WHERE id = ? AND user_id = ?`,
            [jobId, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tác vụ Transcribe.' });
        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        return respondServerError(res, error);
    }
};
