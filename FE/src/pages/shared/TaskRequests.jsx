import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { createTaskRequestApi, getTaskRequestsApi, reviewTaskRequestApi } from '../../services/requestService';
import { getMyTasksApi } from '../../services/taskService';

const TaskRequests = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const vi = language === 'vi';
    const isEngineer = user?.role === 'engineer';
    const [requests, setRequests] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [review, setReview] = useState({ decision: 'approved', review_note: '' });
    const [form, setForm] = useState({ task_id: '', request_type: 'extension', requested_due_date: '', reason: '' });

    const load = useCallback(async () => {
        setLoading(true);
        const [requestResult, taskResult] = await Promise.all([
            getTaskRequestsApi(),
            isEngineer ? getMyTasksApi() : Promise.resolve({ success: true, data: [] }),
        ]);
        if (requestResult.success) setRequests(requestResult.data); else setError(requestResult.message);
        if (taskResult.success) setTasks(taskResult.data.filter((task) => !['completed', 'cancelled'].includes(task.status)));
        setLoading(false);
    }, [isEngineer]);

    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const submit = async (event) => {
        event.preventDefault(); setError(''); setSuccess('');
        const result = await createTaskRequestApi({ ...form, task_id: Number(form.task_id), requested_due_date: form.request_type === 'extension' ? form.requested_due_date : null });
        if (result.success) { setSuccess(result.message); setForm({ task_id: '', request_type: 'extension', requested_due_date: '', reason: '' }); await load(); }
        else setError(result.message);
    };

    const submitReview = async () => {
        const result = await reviewTaskRequestApi(selected.id, review);
        if (result.success) { setSuccess(result.message); setSelected(null); await load(); }
        else setError(result.message);
    };

    const statusLabel = (status) => ({ pending: vi ? 'Chờ xử lý' : 'Pending', approved: vi ? 'Đã duyệt' : 'Approved', rejected: vi ? 'Từ chối' : 'Rejected' })[status] || status;
    const statusClass = (status) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' })[status] || 'badge-info';
    const summary = useMemo(() => requests.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {}), [requests]);
    const columns = [
        { key: 'task_title', label: vi ? 'Công việc' : 'Task', cellClassName: 'font-semibold text-slate-900' },
        { key: 'project_name', label: vi ? 'Dự án' : 'Project' },
        ...(!isEngineer ? [{ key: 'engineer_name', label: vi ? 'Kỹ sư' : 'Engineer' }] : []),
        { key: 'request_type', label: vi ? 'Loại yêu cầu' : 'Type', value: (r) => r.request_type === 'extension' ? (vi ? 'Gia hạn' : 'Extension') : (vi ? 'Vướng mắc' : 'Blocker'), render: (r) => r.request_type === 'extension' ? (vi ? 'Gia hạn' : 'Extension') : (vi ? 'Vướng mắc' : 'Blocker') },
        { key: 'reason', label: vi ? 'Lý do' : 'Reason', render: (r) => <p className="min-w-52 max-w-sm whitespace-pre-wrap">{r.reason}</p> },
        { key: 'requested_due_date', label: vi ? 'Hạn đề xuất' : 'Requested due', render: (r) => r.requested_due_date ? new Date(r.requested_due_date).toLocaleDateString(vi ? 'vi-VN' : 'en-US') : '—' },
        { key: 'status', label: vi ? 'Trạng thái' : 'Status', value: (r) => statusLabel(r.status), render: (r) => <span className={`badge ${statusClass(r.status)}`}>{statusLabel(r.status)}</span> },
        ...(!isEngineer ? [{ id: 'actions', label: vi ? 'Thao tác' : 'Actions', sortable: false, searchable: false, render: (r) => r.status === 'pending' ? <button className="btn btn-primary btn-sm" onClick={() => { setSelected(r); setReview({ decision: 'approved', review_note: '' }); }}>{vi ? 'Xử lý' : 'Review'}</button> : '—' }] : []),
    ];

    return (
        <div className="space-y-6">
            <PageHeader title={vi ? 'Yêu cầu công việc' : 'Task requests'} subtitle={isEngineer ? (vi ? 'Gửi đề nghị gia hạn hoặc báo vướng mắc đến quản lý.' : 'Request an extension or report a blocker.') : (vi ? 'Xem xét đề nghị từ kỹ sư hiện trường.' : 'Review requests from field engineers.')} icon="requests" />
            {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
            <div className="grid gap-4 sm:grid-cols-3">{[['pending', vi ? 'Chờ xử lý' : 'Pending'], ['approved', vi ? 'Đã duyệt' : 'Approved'], ['rejected', vi ? 'Từ chối' : 'Rejected']].map(([key,label]) => <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{summary[key] || 0}</p></div>)}</div>
            {isEngineer && (
                <form onSubmit={submit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-semibold text-slate-900">{vi ? 'Tạo yêu cầu mới' : 'New request'}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Công việc' : 'Task'}</span><select required className="form-select" value={form.task_id} onChange={(e) => setForm({ ...form, task_id: e.target.value })}><option value="">{vi ? 'Chọn công việc' : 'Select task'}</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title} — {task.project_name}</option>)}</select></label>
                        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Loại yêu cầu' : 'Request type'}</span><select className="form-select" value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}><option value="extension">{vi ? 'Đề nghị gia hạn' : 'Extension'}</option><option value="blocker">{vi ? 'Báo vướng mắc' : 'Blocker'}</option></select></label>
                        {form.request_type === 'extension' && <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Hạn hoàn thành đề xuất' : 'Requested due date'}</span><input required type="date" className="form-input" value={form.requested_due_date} onChange={(e) => setForm({ ...form, requested_due_date: e.target.value })} /></label>}
                        <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Lý do / vướng mắc cụ thể' : 'Reason / blocker details'}</span><textarea required minLength={10} maxLength={2000} rows={4} className="form-textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
                    </div><button className="btn btn-primary mt-5" type="submit">{vi ? 'Gửi đến quản lý' : 'Send to manager'}</button>
                </form>
            )}
            <DataTable columns={columns} data={requests} loading={loading} emptyText={vi ? 'Chưa có yêu cầu nào.' : 'No requests yet.'} />
            {selected && <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}><div className="modal-header"><div><h3>{vi ? 'Xử lý yêu cầu' : 'Review request'}</h3><p className="mt-1 text-sm text-slate-500">{selected.engineer_name} · {selected.task_title}</p></div></div><p className="rounded-2xl bg-slate-50 p-4 text-slate-700">{selected.reason}</p><label className="mt-4 block space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Quyết định' : 'Decision'}</span><select className="form-select" value={review.decision} onChange={(e) => setReview({ ...review, decision: e.target.value })}><option value="approved">{vi ? 'Phê duyệt' : 'Approve'}</option><option value="rejected">{vi ? 'Từ chối' : 'Reject'}</option></select></label><label className="mt-4 block space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Ghi chú phản hồi' : 'Review note'}</span><textarea className="form-textarea" rows={3} maxLength={500} value={review.review_note} onChange={(e) => setReview({ ...review, review_note: e.target.value })} /></label><div className="modal-actions mt-5"><button className="btn btn-primary" onClick={submitReview}>{vi ? 'Xác nhận' : 'Confirm'}</button><button className="btn btn-outline" onClick={() => setSelected(null)}>{vi ? 'Hủy' : 'Cancel'}</button></div></div></div>}
        </div>
    );
};

export default TaskRequests;
