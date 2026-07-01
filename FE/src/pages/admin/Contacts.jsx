import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { getContactRequestsApi, updateContactRequestApi } from '../../services/contactService';
import { useLanguage } from '../../context/LanguageContext';

const Contacts = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t, language } = useLanguage();
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getContactRequestsApi();
        if (data.success) { setRows(data.data); setError(''); } else setError(data.message);
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(load, 0);
        return () => clearTimeout(timer);
    }, [load]);

    const updateStatus = async (id, status) => {
        const data = await updateContactRequestApi(id, status);
        if (data.success) await load(); else setError(data.message);
    };

    const statusLabel = (status) => ({
        new: t('contactStatusNew'), processing: t('contactStatusProcessing'), resolved: t('contactStatusResolved'),
    })[status] || status;

    const columns = [
        { key: 'fullname', label: t('fullname'), cellClassName: 'font-semibold text-slate-900' },
        { key: 'email', label: t('email') },
        { key: 'phone', label: t('phone'), render: (row) => row.phone || '—' },
        { key: 'company', label: t('company'), render: (row) => row.company || '—' },
        { key: 'message', label: t('contactMessage'), cellClassName: 'min-w-64' },
        { key: 'status', label: t('status'), value: (row) => statusLabel(row.status), render: (row) => <span className="badge badge-info">{statusLabel(row.status)}</span> },
        { key: 'created_at', label: t('createdAt'), render: (row) => new Date(row.created_at).toLocaleString(locale) },
        { id: 'actions', label: t('actions'), sortable: false, searchable: false, render: (row) => (
            <div className="flex gap-2">
                {row.status === 'new' && <button className="btn btn-sm btn-outline" onClick={() => updateStatus(row.id, 'processing')}>{t('markProcessing')}</button>}
                {row.status !== 'resolved' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(row.id, 'resolved')}>{t('markResolved')}</button>}
            </div>
        ) },
    ];

    return <div className="space-y-6"><PageHeader title={t('contactRequests')} subtitle={t('contactRequestsSubtitle')} icon="✉️" />{error && <div className="alert alert-error">{error}</div>}<DataTable columns={columns} data={rows} loading={loading} emptyText={t('noContactRequests')} /></div>;
};

export default Contacts;
