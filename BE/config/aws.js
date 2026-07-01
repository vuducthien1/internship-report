const { S3Client } = require('@aws-sdk/client-s3');
const { SESv2Client } = require('@aws-sdk/client-sesv2');
const { TranscribeClient } = require('@aws-sdk/client-transcribe');

const region = process.env.AWS_REGION || 'ap-southeast-1';
const s3Bucket = process.env.AWS_S3_BUCKET || '';
const sesFromEmail = process.env.AWS_SES_FROM_EMAIL || '';
const transcribeEnabled = process.env.AWS_TRANSCRIBE_ENABLED === 'true' && Boolean(s3Bucket);
const transcribeRoleArn = process.env.AWS_TRANSCRIBE_ROLE_ARN || '';

const clientConfig = { region };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    };
}

module.exports = {
    region,
    s3Bucket,
    sesFromEmail,
    transcribeEnabled,
    transcribeRoleArn,
    s3Enabled: Boolean(s3Bucket),
    sesEnabled: Boolean(sesFromEmail),
    s3: new S3Client(clientConfig),
    ses: new SESv2Client(clientConfig),
    transcribe: new TranscribeClient(clientConfig),
};
