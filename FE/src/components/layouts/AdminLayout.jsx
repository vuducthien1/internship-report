import AppShell from './AppShell';
import { useLanguage } from '../../context/LanguageContext';

const AdminLayout = () => {
    const { t, language } = useLanguage();
    const vi = language === 'vi';
    const navItems = [
        { to: '/admin/dashboard', label: t('dashboard'), icon: 'dashboard', end: true },
        { to: '/admin/projects', label: t('projects'), icon: 'projects' },
        { to: '/admin/tasks', label: t('assignTasks'), icon: 'tasks' },
        { to: '/admin/manager-assignments', label: vi ? 'Giao việc Manager' : 'Manager assignments', icon: 'briefcase' },
        { to: '/admin/reports', label: t('reports'), icon: 'reports' },
        { to: '/admin/requests', label: t('taskRequests'), icon: 'requests' },
        { to: '/admin/incidents', label: t('safetyIncidents'), icon: 'incidents' },
        { to: '/admin/documents', label: t('projectDocuments'), icon: 'documents' },
        { to: '/admin/users', label: t('userManagement'), icon: 'users' },
        { to: '/admin/deleted-users', label: vi ? 'Tài khoản đã xóa' : 'Deleted accounts', icon: 'user-minus' },
        { to: '/admin/activity', label: t('activityLogs'), icon: 'activity' },
        { to: '/admin/contacts', label: t('contactRequests'), icon: 'contact' },
        { to: '/admin/aws', label: t('awsServices'), icon: 'cloud' },
        { to: '/admin/account', label: t('accountManagement'), icon: 'account' },
        { to: '/admin/settings', label: t('settings'), icon: 'settings' },
    ];
    return <AppShell panelTitle={t('adminPanel')} navItems={navItems} />;
};

export default AdminLayout;
