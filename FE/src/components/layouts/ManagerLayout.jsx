import AppShell from './AppShell';
import { useLanguage } from '../../context/LanguageContext';

const ManagerLayout = () => {
    const { t, language } = useLanguage();
    const vi = language === 'vi';
    const navItems = [
        { to: '/manager/dashboard', label: t('dashboard'), icon: 'dashboard', end: true },
        { to: '/manager/projects', label: t('projects'), icon: 'projects' },
        { to: '/manager/tasks', label: t('assignTasks'), icon: 'tasks' },
        { to: '/manager/assignments', label: vi ? 'Nhiệm vụ từ Admin' : 'Admin assignments', icon: 'briefcase' },
        { to: '/manager/schedule', label: t('managerSchedule'), icon: 'calendar' },
        { to: '/manager/reports', label: t('reports'), icon: 'reports' },
        { to: '/manager/requests', label: t('taskRequests'), icon: 'requests' },
        { to: '/manager/incidents', label: t('safetyIncidents'), icon: 'incidents' },
        { to: '/manager/documents', label: t('projectDocuments'), icon: 'documents' },
        { to: '/manager/analytics', label: t('managerAnalytics'), icon: 'activity' },
        { to: '/manager/user-deletions', label: vi ? 'Yêu cầu xóa nhân sự' : 'Deletion requests', icon: 'user-minus' },
        { to: '/manager/account', label: t('accountManagement'), icon: 'account' },
        { to: '/manager/settings', label: t('settings'), icon: 'settings' },
    ];
    return <AppShell panelTitle={t('managerPanel')} navItems={navItems} />;
};

export default ManagerLayout;
