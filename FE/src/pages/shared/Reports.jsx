import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getReportMediaUrl, getReportsApi, reviewReportApi } from '../../services/reportService';

function Reports() {
    const [reports, setReports] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [reviewNote, setReviewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const isEngineer = user?.role === 'engineer';
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    const loadReports = useCallback(async () => {
        setLoading(true);
        const data = await getReportsApi();
        if (data.success) {
            setReports(data.data);
            setError('');
        } else {
            setError(data.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadReports, 0);
        return () => clearTimeout(timer);
    }, [loadReports]);

    const formatDate = (dateStr) => new Date(dateStr).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const approvalLabel = (status) => ({
        pending: t('approvalPending'),
        approved: t('approvalApproved'),
        rejected: t('approvalRejected'),
    })[status] || status;

    const approvalClass = (status) => ({
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-danger',
    })[status] || 'badge-info';

    const taskStatusLabel = (status) => ({
        pending: t('pending'),
        in_progress: t('inProgress'),
        completed: t('completed'),
        on_hold: t('onHold'),
        cancelled: t('cancelled'),
    })[status] || status || '—';

    const reportTypeLabel = (type) => ({
        manual: t('reportTypeManual'),
        voice: t('reportTypeVoice'),
        mixed: t('reportTypeMixed'),
    })[type || 'manual'] || type || t('reportTypeManual');

    const reportCounts = useMemo(() => ({
        all: reports.length,
        pending: reports.filter((report) => report.approval_status === 'pending').length,
        approved: reports.filter((report) => report.approval_status === 'approved').length,
        rejected: reports.filter((report) => report.approval_status === 'rejected').length,
    }), [reports]);

    const filteredReports = useMemo(() => (
        statusFilter === 'all'
            ? reports
            : reports.filter((report) => report.approval_status === statusFilter)
    ), [reports, statusFilter]);

    const openReport = (report) => {
        setSelected(report);
        setReviewNote(report.review_note || '');
        setError('');
    };

    const submitReview = async (decision) => {
        if (decision === 'rejected' && reviewNote.trim().length < 5) {
            setError(t('reviewNoteRequired'));
            return;
        }
        setSubmitting(true);
        const result = await reviewReportApi(selected.id, { decision, review_note: reviewNote });
        if (result.success) {
            setSelected(null);
            setReviewNote('');
            await loadReports();
        } else {
            setError(result.message);
        }
        setSubmitting(false);
    };

    const exportCsv = () => {
        const fields = [
            ['task_title', t('taskTitle')],
            ['project_name', t('project')],
            ['engineer_name', t('engineer')],
            ['content', t('reportContent')],
            ['work_quantity', t('workQuantity')],
            ['blockers', t('blockers')],
            ['safety_notes', t('safetyNotes')],
            ['next_plan', t('nextPlan')],
            ['approval_status', t('approvalStatus')],
            ['created_at', t('createdAt')],
        ];
        const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const csv = '\uFEFF' + [
            fields.map(([, label]) => quote(label)).join(','),
            ...reports.map((report) => fields.map(([key]) => quote(report[key])).join(',')),
        ].join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const columns = [
        { key: 'task_title', label: t('taskTitle'), cellClassName: 'font-semibold text-slate-900' },
        { key: 'project_name', label: t('project') },
        ...(!isEngineer ? [{ key: 'engineer_name', label: t('engineer') }] : []),
        {
            id: 'summary',
            label: t('reportDetails'),
            value: (row) => [row.content, row.work_quantity, row.blockers, row.safety_notes, row.next_plan].join(' '),
            render: (row) => (
                <div className={isEngineer ? 'min-w-48 max-w-sm' : 'min-w-64 max-w-md'}>
                    <p className="line-clamp-3 whitespace-pre-wrap font-medium text-slate-700">{row.content}</p>
                </div>
            ),
        },
        {
            key: 'task_status',
            label: t('status'),
            value: (row) => taskStatusLabel(row.task_status),
            render: (row) => <span className="badge badge-info">{taskStatusLabel(row.task_status)}</span>,
        },
        ...(!isEngineer ? [{
            key: 'report_type',
            label: t('reportType'),
            value: (row) => reportTypeLabel(row.report_type),
            render: (row) => <span className="badge badge-planning">{reportTypeLabel(row.report_type)}</span>,
        }, {
            key: 'media_url',
            label: t('fieldEvidence'),
            sortable: false,
            searchable: false,
            render: (row) => row.media_url ? (
                <a className="font-semibold text-indigo-600 hover:underline" href={getReportMediaUrl(row.media_url)} target="_blank" rel="noreferrer">{t('viewAttachment')}</a>
            ) : '—',
        }] : []),
        {
            key: 'approval_status',
            label: t('approvalStatus'),
            value: (row) => approvalLabel(row.approval_status),
            render: (row) => <span className={`badge ${approvalClass(row.approval_status)}`}>{approvalLabel(row.approval_status)}</span>,
        },
        {
            key: 'created_at',
            label: t('createdAt'),
            sortValue: (row) => new Date(row.created_at).getTime(),
            render: (row) => formatDate(row.created_at),
        },
        {
            id: 'actions',
            label: t('actions'),
            sortable: false,
            searchable: false,
            render: (row) => (
                <button
                    type="button"
                    className={`btn btn-sm ${row.approval_status === 'pending' && user?.role !== 'engineer' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => openReport(row)}
                >
                    {row.approval_status === 'pending' && user?.role !== 'engineer' ? t('reviewReport') : t('viewDetails')}
                </button>
            ),
        },
    ];

    const summaryCards = [
        { key: 'all', label: t('allReports'), value: reportCounts.all, tone: 'text-slate-900' },
        { key: 'pending', label: t('reportsAwaitingReview'), value: reportCounts.pending, tone: 'text-amber-600' },
        { key: 'approved', label: t('reportsApproved'), value: reportCounts.approved, tone: 'text-emerald-600' },
        { key: 'rejected', label: t('reportsRejected'), value: reportCounts.rejected, tone: 'text-rose-600' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('reports')}
                subtitle={t('reportsSubtitle')}
                icon="📄"
                action={<button type="button" className="btn btn-outline" onClick={exportCsv} disabled={!reports.length}>{t('exportCsv')}</button>}
            />
            {error && <div className="alert alert-error">{t('error')}: {error}</div>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <button
                        key={card.key}
                        type="button"
                        className={`rounded-[1.5rem] border bg-white/95 p-5 text-left shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md ${statusFilter === card.key ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-transparent'}`}
                        onClick={() => setStatusFilter(card.key)}
                        aria-pressed={statusFilter === card.key}
                    >
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className={`mt-2 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
                    </button>
                ))}
            </div>
            <DataTable
                columns={columns}
                data={filteredReports}
                loading={loading}
                emptyText={t('noReports')}
            />

            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal-content report-review-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header report-dialog-header">
                            <div>
                                <span className="report-dialog-eyebrow">{selected.approval_status === 'pending' && user?.role !== 'engineer' ? t('reviewReport') : t('reportDetails')}</span>
                                <h3>{selected.task_title}</h3>
                                <p>{selected.engineer_name} · {selected.project_name}</p>
                            </div>
                            <button type="button" className="modal-close-button" onClick={() => setSelected(null)} aria-label={t('cancel')}>×</button>
                        </div>
                        <div className="report-overview-grid">
                            <div><span>{t('approvalStatus')}</span><strong className={`badge ${approvalClass(selected.approval_status)}`}>{approvalLabel(selected.approval_status)}</strong></div>
                            <div><span>{t('proposedStatus')}</span><strong>{taskStatusLabel(selected.proposed_status)}</strong></div>
                            <div><span>{t('createdAt')}</span><strong>{formatDate(selected.created_at)}</strong></div>
                        </div>
                        <section className="report-content-panel">
                            <span>{t('reportContent')}</span>
                            <p>{selected.content}</p>
                        </section>
                        <div className="report-detail-grid">
                            <div><span>{t('workQuantity')}</span><p>{selected.work_quantity || '—'}</p></div>
                            <div><span>{t('nextPlan')}</span><p>{selected.next_plan || '—'}</p></div>
                            <div><span>{t('blockers')}</span><p>{selected.blockers || '—'}</p></div>
                            <div><span>{t('safetyNotes')}</span><p>{selected.safety_notes || '—'}</p></div>
                        </div>
                        <div className="report-meta-row">
                            <div><span>{t('reportType')}</span><strong>{reportTypeLabel(selected.report_type)}</strong></div>
                            {selected.media_url && (
                                <div><span>{t('fieldEvidence')}</span><a href={getReportMediaUrl(selected.media_url)} target="_blank" rel="noreferrer">{t('viewAttachment')} ↗</a></div>
                            )}
                        </div>
                        {error && <div className="alert alert-error mt-4">{error}</div>}
                        {selected.approval_status === 'pending' && user?.role !== 'engineer' ? (
                            <section className="report-review-panel">
                                <div className="report-form-section-heading">
                                    <span>✓</span>
                                    <div><h4>{t('reviewReport')}</h4><p>{t('reviewNoteHint')}</p></div>
                                </div>
                                <label className="report-field-card">
                                    <span>{t('reviewNote')}</span>
                                    <textarea className="form-textarea" rows={3} maxLength={500} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={t('reviewNoteHint')} />
                                </label>
                                <div className="modal-actions report-dialog-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>{t('cancel')}</button>
                                    <button type="button" className="btn btn-danger" disabled={submitting} onClick={() => submitReview('rejected')}>{t('reject')}</button>
                                    <button type="button" className="btn btn-success" disabled={submitting} onClick={() => submitReview('approved')}>{t('approve')}</button>
                                </div>
                            </section>
                        ) : (
                            <>
                                <section className="report-history-panel">
                                    <h4>{t('reviewHistory')}</h4>
                                    <div className="report-history-grid">
                                        <div><span>{t('approvalStatus')}</span><strong className={`badge ${approvalClass(selected.approval_status)}`}>{approvalLabel(selected.approval_status)}</strong></div>
                                        {selected.reviewed_by && <div><span>{t('reviewedBy')}</span><strong>{selected.reviewer_name || `#${selected.reviewed_by}`}</strong></div>}
                                        {selected.reviewed_at && <div><span>{t('reviewedAt')}</span><strong>{formatDate(selected.reviewed_at)}</strong></div>}
                                        <div className="report-history-note"><span>{t('reviewNote')}</span><p>{selected.review_note || t('noReviewNote')}</p></div>
                                    </div>
                                </section>
                                <div className="modal-actions report-dialog-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>{t('cancel')}</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;
