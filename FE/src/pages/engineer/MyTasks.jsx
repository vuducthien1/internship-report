import { useState, useEffect } from 'react';
import { addTaskUpdateApi, getMyTasksApi, getTaskChecklistApi, getTaskDetailsApi, updateChecklistItemApi } from '../../services/taskService';
import { createReportApi } from '../../services/reportService';
import { useLanguage } from '../../context/LanguageContext';
import VoiceInput from '../../components/common/VoiceInput';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const { t } = useLanguage();

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
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [timelineNote, setTimelineNote] = useState('');
    const [draftRestored, setDraftRestored] = useState(false);

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

        const data = await createReportApi({
            task_id: selectedTask.id,
            content: reportData.content,
            status: reportData.status,
            work_quantity: reportData.work_quantity,
            blockers: reportData.blockers,
            safety_notes: reportData.safety_notes,
            next_plan: reportData.next_plan,
            report_type: reportData.report_type,
        }, attachment);

        if (data.success) {
            localStorage.removeItem(`vdcm_report_draft_${selectedTask.id}`);
            setShowModal(false);
            setDraftRestored(false);
            setRefreshKey((k) => k + 1);
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

    const toggleChecklistItem = async (item) => {
        const completed = !item.is_completed;
        const result = await updateChecklistItemApi(checklistTask.id, item.id, completed);
        if (result.success) {
            setChecklistItems((current) => current.map((entry) => (
                entry.id === item.id ? { ...entry, is_completed: completed ? 1 : 0 } : entry
            )));
        } else {
            setError(result.message);
        }
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
                    {row.has_pending_report ? (
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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🎤 {t('voiceReport')}: {selectedTask?.title}</h3>
                        </div>
                        <form onSubmit={handleReportSubmit} className="space-y-5">
                            <div className={`rounded-2xl px-4 py-3 text-sm ${draftRestored ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-700'}`}>
                                {draftRestored
                                    ? (t('draftRestored') || 'Đã khôi phục bản nháp trên thiết bị. File đính kèm cần chọn lại.')
                                    : (t('draftAutosave') || 'Nội dung được tự động lưu trên thiết bị.')}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">{t('reportContent')}</label>
                                <VoiceInput
                                    value={reportData.content}
                                    onChange={(content) => setReportData({ ...reportData, content })}
                                    onVoiceUsed={() => setReportData((current) => ({
                                        ...current,
                                        report_type: current.report_type === 'manual' ? 'voice' : current.report_type,
                                    }))}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('workQuantity')}</span>
                                    <input className="form-input" value={reportData.work_quantity} onChange={(e) => setReportData({ ...reportData, work_quantity: e.target.value })} placeholder={t('workQuantityHint')} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('nextPlan')}</span>
                                    <input className="form-input" value={reportData.next_plan} onChange={(e) => setReportData({ ...reportData, next_plan: e.target.value })} placeholder={t('nextPlanHint')} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('blockers')}</span>
                                    <textarea className="form-textarea" rows={2} value={reportData.blockers} onChange={(e) => setReportData({ ...reportData, blockers: e.target.value })} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('safetyNotes')}</span>
                                    <textarea className="form-textarea" rows={2} value={reportData.safety_notes} onChange={(e) => setReportData({ ...reportData, safety_notes: e.target.value })} />
                                </label>
                            </div>
                            <label className="block space-y-2">
                                <span className="text-sm font-semibold text-slate-700">{t('fieldEvidence')}</span>
                                <input
                                    className="form-input"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                                />
                                <span className="block text-xs text-slate-500">{t('fieldEvidenceHint')}</span>
                            </label>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">{t('updateStatus')}</label>
                                <select className="form-select" value={reportData.status} onChange={(e) => setReportData({ ...reportData, status: e.target.value })}>
                                    <option value="in_progress">{t('inProgress')}</option>
                                    <option value="completed">{t('completed')}</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('processing') : t('submitReport')}</button>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {checklistTask && (
                <div className="modal-overlay" onClick={() => setChecklistTask(null)}>
                    <div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{t('taskChecklist')}</h3>
                                <p className="mt-1 text-sm text-slate-500">{checklistTask.title}</p>
                            </div>
                        </div>
                        {checklistLoading ? (
                            <p className="py-8 text-center text-slate-500">{t('loading')}</p>
                        ) : checklistItems.length ? (
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-slate-700">
                                    {t('checklistProgress')}: {checklistItems.filter((item) => item.is_completed).length}/{checklistItems.length}
                                </p>
                                {checklistItems.map((item) => (
                                    <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <input type="checkbox" className="mt-1 h-4 w-4" checked={Boolean(item.is_completed)} onChange={() => toggleChecklistItem(item)} />
                                        <span className={item.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}>{item.title}</span>
                                    </label>
                                ))}
                            </div>
                        ) : <p className="py-8 text-center text-slate-500">{t('noChecklistItems')}</p>}
                        <div className="modal-actions mt-5">
                            <button type="button" className="btn btn-outline" onClick={() => setChecklistTask(null)}>{t('cancel')}</button>
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
