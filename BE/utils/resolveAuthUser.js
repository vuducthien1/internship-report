const jwt = require('jsonwebtoken');
const db = require('../config/db');
const aws = require('../config/aws');
const verifyCognitoToken = require('../config/cognitoVerifier');

const resolveAuthUser = async (token) => {
    let localUserId;
    let cognitoPayload;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        localUserId = decoded.id;
    } catch (legacyError) {
        if (!aws.cognitoEnabled) throw legacyError;
        cognitoPayload = await verifyCognitoToken(token);
    }

    if (localUserId) {
        const [users] = await db.query(
            `SELECT id, role, status FROM users
             WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
            [localUserId]
        );
        return users[0] || null;
    }

    const subject = cognitoPayload.sub;
    const email = cognitoPayload.email || null;
    const [users] = email
        ? await db.query(
            `SELECT id, role, status, cognito_sub FROM users
             WHERE deleted_at IS NULL AND (cognito_sub = ? OR (cognito_sub IS NULL AND email = ?))
             LIMIT 1`,
            [subject, email]
        )
        : await db.query(
            `SELECT id, role, status, cognito_sub FROM users
             WHERE deleted_at IS NULL AND cognito_sub = ? LIMIT 1`,
            [subject]
        );
    if (!users.length) return null;
    if (!users[0].cognito_sub) {
        await db.query('UPDATE users SET cognito_sub = ? WHERE id = ? AND cognito_sub IS NULL', [subject, users[0].id]);
    }
    return users[0];
};

module.exports = resolveAuthUser;
