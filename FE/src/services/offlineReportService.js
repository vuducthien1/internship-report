import { createReportApi } from './reportService';

const DB_NAME = 'vdcms-offline';
const DB_VERSION = 1;
const STORE_NAME = 'reportQueue';

const openDb = () => new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
        reject(new Error('Trình duyệt không hỗ trợ lưu báo cáo offline.'));
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const runTransaction = async (mode, action) => {
    const db = await openDb();
    try {
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, mode);
            const store = transaction.objectStore(STORE_NAME);
            const request = action(store);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
};

export const queueOfflineReport = async ({ userId, task, payload, attachment }) => {
    const record = {
        userId: Number(userId),
        taskId: Number(task.id),
        taskTitle: task.title,
        projectName: task.project_name,
        payload,
        attachment: attachment || null,
        attachmentName: attachment?.name || null,
        attachmentType: attachment?.type || null,
        createdAt: new Date().toISOString(),
        lastError: null,
    };
    const id = await runTransaction('readwrite', (store) => store.add(record));
    window.dispatchEvent(new CustomEvent('offline-reports:changed'));
    return { ...record, id };
};

export const getQueuedReports = async (userId) => {
    const records = await runTransaction('readonly', (store) => store.getAll());
    return records
        .filter((record) => Number(record.userId) === Number(userId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const removeQueuedReport = async (id) => {
    await runTransaction('readwrite', (store) => store.delete(id));
    window.dispatchEvent(new CustomEvent('offline-reports:changed'));
};

export const syncQueuedReports = async (userId) => {
    if (!navigator.onLine) return { synced: 0, failed: 0, offline: true };
    const queue = await getQueuedReports(userId);
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        const attachment = item.attachment
            ? new File([item.attachment], item.attachmentName || 'evidence', {
                type: item.attachmentType || item.attachment.type || 'application/octet-stream',
            })
            : null;
        const result = await createReportApi(item.payload, attachment);
        if (result.success || result.status === 409) {
            await removeQueuedReport(item.id);
            synced += 1;
        } else {
            failed += 1;
            if (result.status === 0) break;
        }
    }

    window.dispatchEvent(new CustomEvent('offline-reports:synced', {
        detail: { synced, failed },
    }));
    return { synced, failed, offline: false };
};
