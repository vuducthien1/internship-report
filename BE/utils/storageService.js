const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const aws = require('../config/aws');

const sanitizeSegment = (value) => String(value || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
const sanitizePrefix = (value) => String(value || 'files')
    .split('/')
    .map((segment) => sanitizeSegment(segment))
    .filter(Boolean)
    .join('/');
const isS3Location = (value) => typeof value === 'string' && value.startsWith('s3://');
const parseS3Location = (value) => {
    const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(value || '');
    return match ? { bucket: match[1], key: match[2] } : null;
};

const uploadStoredFile = async (file, prefix) => {
    if (!file?.path) throw new Error('Missing uploaded file.');
    if (!aws.s3Enabled) return { provider: 'local', location: file.path };
    const key = `${sanitizePrefix(prefix)}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${sanitizeSegment(file.originalname)}`;
    await aws.s3.send(new PutObjectCommand({
        Bucket: aws.s3Bucket,
        Key: key,
        Body: await fs.promises.readFile(file.path),
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: { originalname: encodeURIComponent(path.basename(file.originalname)).slice(0, 1000) },
    }));
    await fs.promises.unlink(file.path).catch(() => {});
    return { provider: 's3', location: `s3://${aws.s3Bucket}/${key}`, bucket: aws.s3Bucket, key };
};

const getStoredFile = async (location) => {
    if (!isS3Location(location)) return { provider: 'local', path: location };
    const parsed = parseS3Location(location);
    const object = await aws.s3.send(new GetObjectCommand({ Bucket: parsed.bucket, Key: parsed.key }));
    return { provider: 's3', body: object.Body, contentType: object.ContentType, contentLength: object.ContentLength };
};

const getStoredFileUrl = async (location, expiresIn = 3600) => {
    if (!isS3Location(location)) return location;
    const parsed = parseS3Location(location);
    if (!parsed || parsed.bucket !== aws.s3Bucket) throw new Error('Invalid S3 storage location.');
    return getSignedUrl(
        aws.s3,
        new GetObjectCommand({ Bucket: parsed.bucket, Key: parsed.key }),
        { expiresIn: Math.min(3600, Math.max(60, Number(expiresIn) || 3600)) }
    );
};

const deleteStoredFile = async (location) => {
    if (!location) return;
    if (isS3Location(location)) {
        const parsed = parseS3Location(location);
        await aws.s3.send(new DeleteObjectCommand({ Bucket: parsed.bucket, Key: parsed.key }));
    } else {
        await fs.promises.unlink(location).catch(() => {});
    }
};

module.exports = {
    uploadStoredFile,
    getStoredFile,
    getStoredFileUrl,
    deleteStoredFile,
    isS3Location,
};
