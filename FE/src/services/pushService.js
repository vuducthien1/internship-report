import { apiClient, apiGet, apiPost } from './apiClient';

const toUint8Array = (value) => {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
};

export const isPushSupported = () => (
    'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
);

export const getPushSubscription = async () => {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.pushManager.getSubscription() || null;
};

export const enablePushNotifications = async () => {
    if (!isPushSupported()) {
        return { success: false, reason: 'unsupported' };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
        return { success: false, reason: 'unsupported' };
    }

    const config = await apiGet('/notifications/push/config');
    if (!config.success || !config.enabled || !config.publicKey) {
        return { success: false, reason: 'not-configured', message: config.message };
    }

    const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
    if (permission !== 'granted') {
        return { success: false, reason: 'permission-denied' };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: toUint8Array(config.publicKey),
        });
    }

    const result = await apiPost('/notifications/push/subscribe', subscription.toJSON());
    if (!result.success) await subscription.unsubscribe().catch(() => {});
    return result;
};

export const disablePushNotifications = async () => {
    const subscription = await getPushSubscription();
    if (!subscription) return { success: true };
    const result = await apiClient('/notifications/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    if (result.success) await subscription.unsubscribe();
    return result;
};
