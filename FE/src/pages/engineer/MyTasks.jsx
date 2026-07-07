import { useCallback, useRef, useState, useEffect } from 'react';
import { addTaskUpdateApi, getMyTasksApi, getTaskChecklistApi, getTaskDetailsApi, updateTaskChecklistApi } from '../../services/taskService';
import { createReportApi } from '../../services/reportService';
import { useLanguage } from '../../context/LanguageContext';
import VoiceInput from '../../components/common/VoiceInput';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import {
    getQueuedReports,
    queueOfflineReport,
    syncQueuedReports,
} from '../../services/offlineReportService';

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const { t } = useLanguage();
    const { user } = useAuth();
    const [queuedReports, setQueuedReports] = useState([]);
    const [syncingReports, setSyncingReports] = useState(false);
    const syncingReportsRef = useRef(false);

    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [reportData, setReportData] = useState({
        content: '',
        status: 'in_progress',
        work_quantity: '',
        blockers: '',
        safety_notes: '',
        next_plan: '',
        report_type: 'manual',
    });
    const [submitting, setSubmitting] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [checklistTask, setChecklistTask] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [checklistLoading, setChecklistLoading] = useState(false);
    const [checklistSaving, setChecklistSaving] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [timelineNote, setTimelineNote] = useState('');
    const [draftRestored, setDraftRestored] = useState(false);

    const loadOfflineQueue = useCallback(async () => {
        if (!user?.id) return;
        try {
            setQueuedReports(await getQueuedReports(user.id));
        } catch {
            setQueuedReports([]);
        }
    }, [user]);

    const syncOfflineQueue = useCallback(async () => {
        if (!user?.id || !navigator.onLine || syncingReportsRef.current) return;
        syncingReportsRef.current = true;
        setSyncingReports(true);
        const result = await syncQueuedReports(user.id).catch(() => ({ synced: 0, failed: 1 }));
        await loadOfflineQueue();
        if (result.synced) {
            setNotice(t('offlineReportsSynced').replace('{count}', result.synced));
            setRefreshKey((key) => key + 1);
        }
        syncingReportsRef.current = false;
        setSyncingReports(false);
    }, [loadOfflineQueue, t, user]);

    useEffect(() => {
        const initialLoad = setTimeout(() => {
            loadOfflineQueue();
            if (navigator.onLine) syncOfflineQueue();
        }, 0);
        const handleChanged = () => loadOfflineQueue();
        const handleOnline = () => syncOfflineQueue();
        window.addEventListener('offline-reports:changed', handleChanged);
        window.addEventListener('online', handleOnline);
        return () => {
            clearTimeout(initialLoad);
            window.removeEventListener('offline-reports:changed', handleChanged);
            window.removeEventListener('online', handleOnline);
        };
    }, [loadOfflineQueue, syncOfflineQueue]);

    useEffect(() => {
        if (!showModal || !selectedTask) return;
        localStorage.setItem(`vdcm_report_draft_${selectedTask.id}`, JSON.stringify(reportData));
    }, [reportData, selectedTask, showModal]);

    useEffect(() => {
        const fetchMyTasks = async () => {
            const data = await getMyTasksApi();
            if (data.success) {
                setTasks(data.data);
                setError('');
            } else {
                setError(data.message);
            }
        };
        fetchMyTasks();
    }, [refreshKey]);

    const openReportModal = (task) => {
        setSelectedTask(task);
        const initialData = {
            content: '',
            status: task.status === 'pending' ? 'in_progress' : task.status,
            work_quantity: '',
            blockers: '',
            safety_notes: '',
            next_plan: '',
            report_type: 'manual',
        };
        const saved = localStorage.getItem(`vdcm_report_draft_${task.id}`);
        try {
            setReportData(saved ? { ...initialData, ...JSON.parse(saved) } : initialData);
            setDraftRestored(Boolean(saved));
        } catch {
            setReportData(initialData);
            setDraftRestored(false);
        }
        setShowModal(true);
        setAttachment(null);
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setNotice('');

        const payload = {
            task_id: selectedTask.id,
            content: reportData.content,
            status: reportData.status,
            work_quantity: reportData.work_quantity,
            blockers: reportData.blockers,
            safety_notes: reportData.safety_notes,
            next_plan: reportData.next_plan,
            report_type: reportData.report_type,
        };
        const data = navigator.onLine
            ? await createReportApi(payload, attachment)
            : { success: false, status: 0 };

        if (data.success) {
            localStorage.removeItem(`vdcm_report_draft_${selectedTask.id}`);
            setShowModal(false);
            setDraftRestored(false);
            setRefreshKey((k) => k + 1);
        } else if (data.status === 0) {
            try {
                await queueOfflineReport({
                    userId: user.id,
                    task: selectedTask,
                    payload,
                    attachment,
                });
                localStorage.removeItem(`vdcm_report_draft_${selectedTask.id}`);
                setShowModal(false);
                setDraftRestored(false);
                setAttachment(null);
                setNotice(t('offlineReportQueued'));
                await loadOfflineQueue();
            } catch (queueError) {
                setError(queueError.message || t('offlineReportQueueFailed'));
            }
        } else {
            setError(data.message);
        }
        setSubmitting(false);
    };

    const openTaskDetail = async (task) => {
        setDetailLoading(true);
        setTimelineNote('');
        const result = await getTaskDetailsApi(task.id);
        if (result.success) setDetail(result.data);
        else setError(result.message);
        setDetailLoading(false);
    };

    const addTimelineNote = async (event) => {
        event.preventDefault();
        const result = await addTaskUpdateApi(detail.task.id, timelineNote);
        if (!result.success) { setError(result.message); return; }
        const refreshed = await getTaskDetailsApi(detail.task.id);
        if (refreshed.success) setDetail(refreshed.data);
        setTimelineNote('');
    };

    const openChecklist = async (task) => {
        setChecklistTask(task);
        setChecklistLoading(true);
        const result = await getTaskChecklistApi(task.id);
        if (result.success) setChecklistItems(result.data);
        else setError(result.message);
        setChecklistLoading(false);
    };

    const toggleChecklistItem = (item) => {
        setChecklistItems((current) => current.map((entry) => (
            entry.id === item.id ? { ...entry, is_completed: entry.is_completed ? 0 : 1 } : entry
        )));
    };

    const closeChecklist = () => {
        if (checklistSaving) return;
        setChecklistTask(null);
        setChecklistItems([]);
    };

    const saveChecklist = async () => {
        if (!checklistTask || !checklistItems.length) return;
        setChecklistSaving(true);
        const result = await updateTaskChecklistApi(
            checklistTask.id,
            checklistItems.map((item) => ({ id: item.id, completed: Boolean(item.is_completed) }))
        );
        if (result.success) {
            setChecklistTask(null);
            setChecklistItems([]);
            setRefreshKey((key) => key + 1);
        } else {
            setError(result.message);
        }
        setChecklistSaving(false);
    };

    const getStatusBadge = (status) => {
        if (status === 'pending') return { class: 'badge-warning', label: t('pending') };
        if (status === 'in_progress') return { class: 'badge-info', label: t('inProgress') };
        if (status === 'completed') return { class: 'badge-success', label: t('completed') };
        if (status === 'on_hold') return { class: 'badge-warning', label: t('onHold') };
        return { class: 'badge-danger', label: t('cancelled') };
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            low: t('priorityLow'),
            medium: t('priorityMedium'),
            high: t('priorityHigh'),
            urgent: t('priorityUrgent'),
            critical: t('priorityCritical'),
        };
        return labels[priority] || priority;
    };

    const pendingCount = tasks.filter((t) => t.status === 'pending').length;
    const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const queuedTaskIds = new Set(queuedReports.map((report) => Number(report.taskId)));

    const columns = [
        { key: 'project_name', label: t('project'), cellClassName: 'font-semibold text-slate-900' },
        { key: 'title', label: t('taskTitle'), cellClassName: 'font-semibold text-slate-900' },
        { key: 'description', label: t('description') },
        {
            key: 'due_date',
            label: t('dueDate'),
            sortValue: (row) => row.due_date ? new Date(row.due_date).getTime() : 0,
            render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString() : '—',
        },
        {
            key: 'priority',
            label: t('priority'),
            value: (row) => getPriorityLabel(row.priority),
            render: (row) => getPriorityLabel(row.priority),
        },
        {
            key: 'status',
            label: t('status'),
            value: (row) => getStatusBadge(row.status).label,
            render: (row) => {
                const badge = getStatusBadge(row.status);
                return <span className={`badge ${badge.class}`}>{badge.label}</span>;
            },
        },
        {
            id: 'actions',
            label: t('actions'),
            sortable: false,
            searchable: false,
            render: (row) => (
                <div className="flex min-w-max flex-wrap gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => openTaskDetail(row)}>
                        {t('viewDetails')}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openChecklist(row)}>
                        ☑ {t('taskChecklist')}
                    </button>
                    {queuedTaskIds.has(Number(row.id)) ? (
                        <span className="badge badge-warning">{t('offlineWaitingSync')}</span>
                    ) : row.has_pending_report ? (
                        <span className="badge badge-warning">{t('approvalPending')}</span>
                    ) : ['pending', 'in_progress'].includes(row.status) ? (
                        <button className="btn btn-accent btn-sm" onClick={() => openReportModal(row)}>
                            🎤 {t('voiceReport')}
                        </button>
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8">
            <PageHeader title={t('taskList')} subtitle={t('featureTaskDesc')} icon="📋" />

            {error && <div className="alert alert-error">{t('error')}: {error}</div>}
            {notice && <div className="alert alert-success">{notice}</div>}
            {queuedReports.length > 0 && (
                <div className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold">{t('offlineQueueTitle')}</p>
                        <p className="mt-1 text-sm">{t('offlineQueueCount').replace('{count}', queuedReports.length)}</p>
                    </div>
                    <button type="button" className="btn btn-outline" disabled={!navigator.onLine || syncingReports} onClick={syncOfflineQueue}>
                        {syncingReports ? t('processing') : t('syncNow')}
                    </button>
                </div>
            )}

            {tasks.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.75rem] bg-white/95 p-6 shadow-sm shadow-slate-200/40">
                        <p className="text-sm text-slate-500">{t('pending')}</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{pendingCount}</p>
                    </div>
                    <div className="rounded-[1.75rem] bg-white/95 p-6 shadow-sm shadow-slate-200/40">
                        <p className="text-sm text-slate-500">{t('inProgress')}</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{inProgressCount}</p>
                    </div>
                    <div className="rounded-[1.75rem] bg-white/95 p-6 shadow-sm shadow-slate-200/40">
                        <p className="text-sm text-slate-500">{t('completed')}</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{completedCount}</p>
                    </div>
                </div>
            )}

            <DataTable columns={columns} data={tasks} emptyText={t('noTasks')} />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content report-editor-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header report-dialog-header">
                            <div>
                                <span className="report-dialog-eyebrow">{t('report')}</span>
                                <h3>{selectedTask?.title}</h3>
                                <p>{selectedTask?.project_name}</p>
                            </div>
                            <button type="button" className="modal-close-button" onClick={() => setShowModal(false)} aria-label={t('cancel')}>×</button>
                        </div>
                        <form onSubmit={handleReportSubmit} className="space-y-5">
                            <div className={`report-draft-notice ${draftRestored ? 'report-draft-notice--restored' : ''}`}>
                                {draftRestored
                                    ? (t('draftRestored') || 'Đã khôi phục bản nháp trên thiết bị. File đính kèm cần chọn lại.')
                                    : (t('draftAutosave') || 'Nội dung được tự động lưu trên thiết bị.')}
                            </div>
                            <section className="report-form-section report-form-section--primary">
                                <div className="report-form-section-heading">
                                    <span>01</span>
                                    <div><h4>{t('reportContent')}</h4><p>{t('reportPlaceholder')}</p></div>
                                </div>
                                <VoiceInput
                                    value={reportData.content}
                                    onChange={(content) => setReportData({ ...reportData, content })}
                                    onVoiceUsed={() => setReportData((current) => ({
                                        ...current,
                                        report_type: current.report_type === 'manual' ? 'voice' : current.report_type,
                                    }))}
                                />
                            </section>
                            <section className="report-form-section">
                                <div className="report-form-section-heading">
                                    <span>02</span>
                                    <div><h4>{t('reportDetails')}</h4><p>{t('featureTaskDesc')}</p></div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                <label className="report-field-card">
                                    <span>{t('workQuantity')}</span>
                                    <input className="form-input" value={reportData.work_quantity} onChange={(e) => setReportData({ ...reportData, work_quantity: e.target.value })} placeholder={t('workQuantityHint')} />
                                </label>
                                <label className="report-field-card">
                                    <span>{t('nextPlan')}</span>
                                    <input className="form-input" value={reportData.next_plan} onChange={(e) => setReportData({ ...reportData, next_plan: e.target.value })} placeholder={t('nextPlanHint')} />
                                </label>
                                <label className="report-field-card">
                                    <span>{t('blockers')}</span>
                                    <textarea className="form-textarea" rows={2} value={reportData.blockers} onChange={(e) => setReportData({ ...reportData, blockers: e.target.value })} />
                                </label>
                                <label className="report-field-card">
                                    <span>{t('safetyNotes')}</span>
                                    <textarea className="form-textarea" rows={2} value={reportData.safety_notes} onChange={(e) => setReportData({ ...reportData, safety_notes: e.target.value })} />
                                </label>
                                </div>
                            </section>
                            <section className="report-form-section">
                                <div className="report-form-section-heading">
                                    <span>03</span>
                                    <div><h4>{t('fieldEvidence')}</h4><p>{t('fieldEvidenceHint')}</p></div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                            <label className="report-field-card">
                                <span>{t('fieldEvidence')}</span>
                                <input
                                    className="form-input"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                                />
                            </label>
                            <label className="report-field-card">
                                <span>{t('updateStatus')}</span>
                                <select className="form-select" value={reportData.status} onChange={(e) => setReportData({ ...reportData, status: e.target.value })}>
                                    <option value="in_progress">{t('inProgress')}</option>
                                    <option value="completed">{t('completed')}</option>
                                </select>
                            </label>
                                </div>
                            </section>
                            <div className="modal-actions report-dialog-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('processing') : t('submitReport')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {checklistTask && (
                <div className="modal-overlay" onClick={closeChecklist}>
                    <div className="modal-content checklist-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header report-dialog-header">
                            <div>
                                <span className="report-dialog-eyebrow">{t('taskChecklist')}</span>
                                <h3>{t('taskChecklist')}</h3>
                                <p>{checklistTask.title}</p>
                            </div>
                            <button type="button" className="modal-close-button" onClick={closeChecklist} aria-label={t('cancel')}>×</button>
                        </div>
                        {checklistLoading ? (
                            <p className="py-8 text-center text-slate-500">{t('loading')}</p>
                        ) : checklistItems.length ? (
                            <div>
                                <div className="checklist-summary">
                                    <div><strong>{checklistItems.filter((item) => item.is_completed).length}/{checklistItems.length}</strong><span>{t('checklistProgress')}</span></div>
                                    <div className="checklist-progress-track"><span style={{ width: `${(checklistItems.filter((item) => item.is_completed).length / checklistItems.length) * 100}%` }} /></div>
                                </div>
                                <p className="checklist-help">{t('checklistSaveHint')}</p>
                                <div className="checklist-list">
                                {checklistItems.map((item) => (
                                    <label key={item.id} className={`checklist-item-row ${item.is_completed ? 'is-completed' : ''}`}>
                                        <input type="checkbox" checked={Boolean(item.is_completed)} onChange={() => toggleChecklistItem(item)} />
                                        <span className="checklist-item-box">✓</span>
                                        <span className="checklist-item-title">{item.title}</span>
                                    </label>
                                ))}
                                </div>
                            </div>
                        ) : <p className="py-8 text-center text-slate-500">{t('noChecklistItems')}</p>}
                        <div className="modal-actions report-dialog-actions">
                            <button type="button" className="btn btn-outline" disabled={checklistSaving} onClick={closeChecklist}>{t('cancel')}</button>
                            <button type="button" className="btn btn-success" disabled={checklistLoading || checklistSaving || !checklistItems.length} onClick={saveChecklist}>
                                {checklistSaving ? t('processing') : t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(detail || detailLoading) && (
                <div className="modal-overlay" onClick={() => setDetail(null)}>
                    <div className="modal-content max-w-3xl" onClick={(event) => event.stopPropagation()}>
                        {detailLoading && !detail ? <p className="py-10 text-center text-slate-500">{t('loading')}</p> : detail && (
                            <>
                                <div className="modal-header"><div><h3>{t('viewDetails')}: {detail.task.title}</h3><p className="mt-1 text-sm text-slate-500">{detail.task.project_name} · {detail.task.manager_name}</p></div></div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{t('status')}</p><p className="mt-2 font-semibold text-slate-900">{getStatusBadge(detail.task.status).label}</p></div>
                                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{t('priority')}</p><p className="mt-2 font-semibold text-slate-900">{getPriorityLabel(detail.task.priority)}</p></div>
                                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{t('dueDate')}</p><p className="mt-2 font-semibold text-slate-900">{detail.task.due_date ? new Date(detail.task.due_date).toLocaleDateString() : '—'}</p></div>
                                </div>
                                {detail.task.description && <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 p-4 text-slate-700">{detail.task.description}</p>}
                                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                                    <section><h4 className="mb-3 font-semibold text-slate-900">{t('taskChecklist')}</h4><div className="space-y-2">{detail.checklist.length ? detail.checklist.map((item) => <div key={item.id} className="flex gap-2 rounded-xl bg-slate-50 p-3 text-sm"><span>{item.is_completed ? '✓' : '○'}</span><span className={item.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.title}</span></div>) : <p className="text-sm text-slate-500">{t('noChecklistItems')}</p>}</div></section>
                                    <section><h4 className="mb-3 font-semibold text-slate-900">{t('taskTimeline')}</h4><div className="max-h-64 space-y-3 overflow-y-auto pr-1">{detail.updates.length ? detail.updates.map((update) => <div key={update.id} className="border-l-2 border-indigo-200 pl-3"><p className="text-sm font-medium text-slate-800">{update.message}</p><p className="mt-1 text-xs text-slate-500">{update.user_name || 'Hệ thống'} · {new Date(update.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-slate-500">{t('noTimelineUpdates')}</p>}</div></section>
                                </div>
                                <form className="mt-6 flex gap-2" onSubmit={addTimelineNote}><input required minLength={2} maxLength={1000} className="form-input" value={timelineNote} onChange={(event) => setTimelineNote(event.target.value)} placeholder={t('timelineNotePlaceholder')} /><button className="btn btn-primary" type="submit">{t('addUpdate')}</button></form>
                                <div className="modal-actions mt-5"><button type="button" className="btn btn-outline" onClick={() => setDetail(null)}>{t('cancel')}</button></div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyTasks;
