import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, CheckCheck, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useLanguage } from '../../context/LanguageContext';
import { getSocketUrl } from '../../services/chatService';
import { refreshAuthSession } from '../../services/apiClient';
import {
    getNotificationsApi,
    markAllNotificationsReadApi,
    markNotificationReadApi,
} from '../../services/notificationService';
import {
    disablePushNotifications,
    enablePushNotifications,
    getPushSubscription,
    isPushSupported,
} from '../../services/pushService';

const NotificationBell = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushBusy, setPushBusy] = useState(false);
    const [pushError, setPushError] = useState('');
    const pushSupported = isPushSupported();

    const load = useCallback(async () => {
        const result = await getNotificationsApi();
        if (result.success) {
            setItems(result.data);
            setUnread(Number(result.unread) || 0);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(load, 0);
        const interval = setInterval(load, 60000);
        const socket = io(getSocketUrl(), { withCredentials: true });
        let refreshingSocket = false;
        socket.on('connect_error', async (connectError) => {
            if (connectError.message !== 'Unauthorized' || refreshingSocket) return;
            refreshingSocket = true;
            const refreshed = await refreshAuthSession();
            refreshingSocket = false;
            if (refreshed) socket.connect();
        });
        socket.on('notification:new', (notification) => {
            setItems((current) => [notification, ...current].slice(0, 30));
            setUnread((current) => current + 1);
        });
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            socket.disconnect();
        };
    }, [load]);

    useEffect(() => {
        if (!pushSupported) return undefined;
        let mounted = true;
        getPushSubscription().then((subscription) => {
            if (mounted) setPushEnabled(Boolean(subscription));
        }).catch(() => {});
        return () => {
            mounted = false;
        };
    }, [pushSupported]);

    const togglePush = async () => {
        setPushBusy(true);
        setPushError('');
        try {
            const result = pushEnabled
                ? await disablePushNotifications()
                : await enablePushNotifications();
            if (result.success) {
                setPushEnabled(!pushEnabled);
                return;
            }
            setPushError(result.reason === 'permission-denied'
                ? t('pushPermissionDenied')
                : (result.message || t('pushUnsupported')));
        } catch {
            setPushError(t('pushUnsupported'));
        } finally {
            setPushBusy(false);
        }
    };

    const openNotification = async (item) => {
        if (!item.is_read) {
            await markNotificationReadApi(item.id);
            setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: 1 } : entry));
            setUnread((current) => Math.max(0, current - 1));
        }
        setOpen(false);
        if (item.link) navigate(item.link);
    };

    const readAll = async () => {
        const result = await markAllNotificationsReadApi();
        if (result.success) {
            setItems((current) => current.map((item) => ({ ...item, is_read: 1 })));
            setUnread(0);
        }
    };

    return (
        <div className="relative">
            <button type="button" className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm" onClick={() => setOpen(!open)} aria-label={t('notifications')}>
                <Bell size={18} />
                {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-center text-xs font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
            </button>
            {open && (
                <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <h3 className="font-semibold text-slate-900">{t('notifications')}</h3>
                        <button type="button" className="flex items-center gap-1 text-xs font-semibold text-indigo-600" onClick={readAll}><CheckCheck size={15} />{t('markAllRead')}</button>
                    </div>
                    <div className="border-b border-slate-200 px-5 py-3">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={togglePush}
                            disabled={!pushSupported || pushBusy}
                        >
                            <span className="flex items-center gap-2">
                                {pushBusy
                                    ? <LoaderCircle className="animate-spin" size={17} />
                                    : pushEnabled ? <BellRing size={17} /> : <BellOff size={17} />}
                                {pushEnabled ? t('disablePush') : t('enablePush')}
                            </span>
                            <span className={`h-5 w-9 rounded-full p-0.5 transition ${pushEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <span className={`block h-4 w-4 rounded-full bg-white transition ${pushEnabled ? 'translate-x-4' : ''}`} />
                            </span>
                        </button>
                        {(!pushSupported || pushError) && (
                            <p className="mt-2 text-xs text-rose-600">{pushError || t('pushUnsupported')}</p>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {items.length ? items.map((item) => (
                            <button key={item.id} type="button" className={`block w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${item.is_read ? '' : 'bg-indigo-50/70'}`} onClick={() => openNotification(item)}>
                                <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                                <span className="mt-1 block text-sm text-slate-600">{item.message}</span>
                                <span className="mt-2 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</span>
                            </button>
                        )) : <p className="px-5 py-10 text-center text-sm text-slate-500">{t('noNotifications')}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
