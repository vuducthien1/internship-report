const { SendEmailCommand } = require('@aws-sdk/client-sesv2');
const db = require('../config/db');
const aws = require('../config/aws');

const queueEmail = async ({ to, subject, text }, provider, status = 'queued', errorMessage = null) => {
    await db.query(
        `INSERT INTO email_outbox (recipient, subject, text_content, provider, status, error_message, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ${status === 'sent' ? 'NOW()' : 'NULL'})`,
        [to, subject, text, provider, status, errorMessage]
    );
};

const sendWithSes = async ({ to, subject, text, html }) => {
    const result = await aws.ses.send(new SendEmailCommand({
        FromEmailAddress: aws.sesFromEmail,
        Destination: { ToAddresses: [to] },
        Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' }, ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}) } } },
    }));
    return result.MessageId;
};

const sendWithResend = async ({ to, subject, text, html }) => {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM || 'VDCMS <onboarding@resend.dev>', to: [to], subject, text, html }),
    });
    if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
};

const sendEmail = async (email) => {
    const provider = aws.sesEnabled ? 'amazon-ses' : process.env.RESEND_API_KEY ? 'resend' : 'local';
    if (provider === 'local') { await queueEmail(email, provider); return { success: true, queued: true, provider }; }
    try {
        const messageId = provider === 'amazon-ses' ? await sendWithSes(email) : await sendWithResend(email);
        await queueEmail(email, provider, 'sent');
        return { success: true, queued: false, provider, messageId };
    } catch (error) {
        await queueEmail(email, provider, 'failed', error.message.slice(0, 500));
        return { success: false, provider, message: error.message };
    }
};

module.exports = sendEmail;
