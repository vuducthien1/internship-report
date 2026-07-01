import AppShell from './AppShell';
import { useLanguage } from '../../context/LanguageContext';

const EngineerLayout = () => {
    const { t } = useLanguage();
    const navItems = [
        { to: '/engineer/dashboard', label: t('dashboard'), icon: 'dashboard', end: true },
        { to: '/engineer/tasks', label: t('myTasks'), icon: 'tasks' },
        { to: '/engineer/calendar', label: t('taskCalendar'), icon: 'calendar' },
        { to: '/engineer/requests', label: t('taskRequests'), icon: 'requests' },
        { to: '/engineer/incidents', label: t('safetyIncidents'), icon: 'incidents' },
        { to: '/engineer/documents', label: t('projectDocuments'), icon: 'documents' },
        { to: '/engineer/reports', label: t('reports'), icon: 'reports' },
        { to: '/engineer/account', label: t('accountManagement'), icon: 'account' },
        { to: '/engineer/settings', label: t('settings'), icon: 'settings' },
    ];
    return <AppShell panelTitle={t('engineerPanel')} navItems={navItems} />;
};

export default EngineerLayout;
