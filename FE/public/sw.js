const CACHE = 'vdcms-shell-v2';
const SHELL = ['/', '/logo.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
    )));
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match('/')));
        return;
    }
    if (['style', 'script', 'image', 'font'].includes(request.destination)) {
        event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
        })));
    }
});

self.addEventListener('push', (event) => {
    let payload;
    try {
        payload = event.data?.json() || {};
    } catch {
        payload = { title: 'VDCMS', message: event.data?.text() || '' };
    }
    event.waitUntil(self.registration.showNotification(payload.title || 'VDCMS', {
        body: payload.message || '',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: payload.tag || `vdcms-${Date.now()}`,
        renotify: Boolean(payload.renotify),
        requireInteraction: Boolean(payload.requireInteraction),
        data: { link: payload.link || '/' },
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.link || '/', self.location.origin).href;
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        const existing = clients.find((client) => client.url.startsWith(self.location.origin));
        if (existing) {
            existing.navigate(target);
            return existing.focus();
        }
        return self.clients.openWindow(target);
    }));
});
