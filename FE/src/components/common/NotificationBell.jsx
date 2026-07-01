import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useLanguage } from '../../context/LanguageContext';
import { getSocketUrl } from '../../services/chatService';
import {
    getNotificationsApi,
    markAllNotificationsReadApi,
    markNotificationReadApi,
} from '../../services/notificationService';

const NotificationBell = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);

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
        const socket = io(getSocketUrl(), { auth: { token: localStorage.getItem('accessToken') } });
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
