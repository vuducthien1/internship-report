const webPush = require('web-push');
const db = require('../config/db');

const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY || '';
const subject = process.env.WEB_PUSH_VAPID_SUBJECT || 'mailto:admin@example.com';
const enabled = Boolean(publicKey && privateKey);

if (enabled) webPush.setVapidDetails(subject, publicKey, privateKey);

const removeSubscription = (endpoint) => db.query(
    'DELETE FROM push_subscriptions WHERE endpoint = ?',
    [endpoint]
);

const sendPushToUser = async (userId, payload) => {
    if (!enabled) return { sent: 0, configured: false };
    const [subscriptions] = await db.query(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
        [userId]
    );
    let sent = 0;
    await Promise.all(subscriptions.map(async (subscription) => {
        try {
            await webPush.sendNotification({
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            }, JSON.stringify(payload), { TTL: 3600, urgency: payload.urgent ? 'high' : 'normal' });
            sent += 1;
        } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
                await removeSubscription(subscription.endpoint);
                return;
            }
            console.error('Không thể gửi Web Push:', error.message);
        }
    }));
    return { sent, configured: true };
};

module.exports = { enabled, publicKey, sendPushToUser };
