import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, BriefcaseBusiness, CalendarDays, ClipboardList, Cloud, FileText, FolderKanban, LayoutDashboard, LogOut, Mail, Menu, MessageSquareWarning, ScrollText, Settings, Sparkles, UserMinus, UserRound, UsersRound, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../common/ThemeToggle';
import LanguageToggle from '../common/LanguageToggle';
import Logo from '../common/Logo';
import ChatWidget from '../chat/ChatWidget';
import NotificationBell from '../common/NotificationBell';

const AppShell = ({ panelTitle, navItems }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [online, setOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.fullname
        ? user.fullname
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
        : user?.username?.slice(0, 2).toUpperCase() || 'U';

    const renderNavIcon = (item) => {
        if (item.icon === 'logo') {
            return <Logo size={18} />;
        }

        const iconKey = typeof item.icon === 'string' ? item.icon.toLowerCase() : '';
        const iconMap = {
            '📊': <LayoutDashboard size={18} />,
            '📋': <ClipboardList size={18} />,
            '📄': <FileText size={18} />,
            '👥': <UsersRound size={18} />,
            '⚙️': <Settings size={18} />,
            dashboard: <LayoutDashboard size={18} />,
            projects: <FolderKanban size={18} />,
            tasks: <ClipboardList size={18} />,
            reports: <FileText size={18} />,
            users: <UsersRound size={18} />,
            settings: <Settings size={18} />,
            account: <UserRound size={18} />,
            activity: <ScrollText size={18} />,
            contact: <Mail size={18} />,
            calendar: <CalendarDays size={18} />,
            requests: <MessageSquareWarning size={18} />,
            incidents: <AlertTriangle size={18} />,
            documents: <FolderKanban size={18} />,
            cloud: <Cloud size={18} />,
            briefcase: <BriefcaseBusiness size={18} />,
            'user-minus': <UserMinus size={18} />,
        };

        return iconMap[iconKey] || <span className="text-base">{item.icon}</span>;
    };

    return (
        <div className="app-theme-shell min-h-screen">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
                <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col overflow-hidden border-r border-slate-200/70 bg-white/85 px-4 py-5 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="shrink-0 flex items-center justify-between lg:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                                <Logo size={24} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-900">{t('appName')}</p>
                                <p className="text-sm text-slate-500">{panelTitle}</p>
                            </div>
                        </div>
                        <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                            ✕
                        </button>
                    </div>

                    <nav className="mt-6 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                                }
                                onClick={() => setSidebarOpen(false)}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.icon === 'logo' ? 'bg-slate-100 text-slate-700' : isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {renderNavIcon(item)}
                                        </span>
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-4 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{user?.fullname || user?.username}</p>
                                <p className="truncate text-sm text-slate-500">{user?.role}</p>
                            </div>
                        </div>
                        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={handleLogout}>
                            <LogOut size={16} />
                            {t('logout')}
                        </button>
                    </div>
                </aside>

                {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close overlay" />}

                <div className="min-w-0 flex-1 lg:ml-0">
                    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <button className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                                    <Menu size={18} />
                                </button>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{t('welcomeBack')}</p>
                                    <p className="text-sm text-slate-500">{user?.fullname}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 sm:flex">
                                    <Sparkles size={16} />
                                    {t('tagline')}
                                </div>
                                <LanguageToggle compact />
                                <ThemeToggle compact />
                                <NotificationBell />
                            </div>
                        </div>
                    </header>

                    {!online && (
                        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                            <WifiOff size={16} /> {t('offlineMode')}
                        </div>
                    )}
                    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
                        <Outlet />
                    </main>
                </div>
            </div>
            <ChatWidget />
        </div>
    );
};

export default AppShell;
