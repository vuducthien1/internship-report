const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const aws = require('./aws');

let keyCache = { expiresAt: 0, keys: new Map() };

const getKeys = async () => {
    if (Date.now() < keyCache.expiresAt && keyCache.keys.size) return keyCache.keys;
    const issuer = `https://cognito-idp.${aws.region}.amazonaws.com/${aws.cognitoUserPoolId}`;
    const response = await fetch(`${issuer}/.well-known/jwks.json`);
    if (!response.ok) throw new Error('Không thể tải Cognito JWKS.');
    const payload = await response.json();
    const keys = new Map((payload.keys || []).map((jwk) => [
        jwk.kid,
        crypto.createPublicKey({ key: jwk, format: 'jwk' }),
    ]));
    keyCache = { expiresAt: Date.now() + 60 * 60 * 1000, keys };
    return keys;
};

const verifyCognitoToken = async (token) => {
    if (!aws.cognitoEnabled) throw new Error('Cognito chưa được cấu hình.');
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader?.header?.kid) throw new Error('Cognito token không hợp lệ.');
    const keys = await getKeys();
    const publicKey = keys.get(decodedHeader.header.kid);
    if (!publicKey) throw new Error('Không tìm thấy Cognito signing key.');
    const issuer = `https://cognito-idp.${aws.region}.amazonaws.com/${aws.cognitoUserPoolId}`;
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer });
    if (!['id', 'access'].includes(payload.token_use)) throw new Error('Cognito token_use không hợp lệ.');
    const clientId = payload.aud || payload.client_id;
    if (clientId !== aws.cognitoClientId) throw new Error('Cognito client không hợp lệ.');
    return payload;
};

module.exports = verifyCognitoToken;
