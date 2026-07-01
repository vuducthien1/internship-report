import { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { getActivityLogsApi } from '../../services/activityService';

const ActivityLogs = () => {
    const { t, language } = useLanguage();
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const result = await getActivityLogsApi();
            if (result.success) setRows(result.data);
            else setError(result.message);
            setLoading(false);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const columns = [
        { key: 'action', label: t('activityAction'), cellClassName: 'font-semibold text-slate-900' },
        { key: 'fullname', label: t('performedBy'), render: (row) => row.fullname || t('system') },
        { key: 'description', label: t('description') },
        {
            key: 'created_at',
            label: t('createdAt'),
            sortValue: (row) => new Date(row.created_at).getTime(),
            render: (row) => new Date(row.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US'),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title={t('activityLogs')} subtitle={t('activityLogsSubtitle')} icon="🛡️" />
            {error && <div className="alert alert-error">{error}</div>}
            <DataTable columns={columns} data={rows} loading={loading} emptyText={t('noActivityLogs')} />
        </div>
    );
};

export default ActivityLogs;
