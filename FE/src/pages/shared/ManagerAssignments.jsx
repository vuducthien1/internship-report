import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    cancelManagerAssignmentApi,
    createManagerAssignmentApi,
    getManagerAssignmentsApi,
    updateManagerAssignmentApi,
} from '../../services/managerAssignmentService';
import { getProjectsApi } from '../../services/projectService';
import { getManagersApi } from '../../services/userService';

const emptyForm = {
    manager_id: '', project_id: '', title: '', description: '', due_date: '', priority: 'medium',
};

const ManagerAssignments = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const vi = language === 'vi';
    const isAdmin = user?.role === 'admin';
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = isAdmin && searchParams.get('view') === 'create' ? 'create' : 'manage';
    const [assignments, setAssignments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [progressForm, setProgressForm] = useState({ status: 'accepted', progress_percent: 0, manager_note: '' });
    const [cancelling, setCancelling] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        const requests = [getManagerAssignmentsApi()];
        if (isAdmin) requests.push(getManagersApi(), getProjectsApi());
        const [assignmentResult, managerResult, projectResult] = await Promise.all(requests);
        if (assignmentResult.success) setAssignments(assignmentResult.data);
        else setError(assignmentResult.message);
        if (managerResult?.success) setManagers(managerResult.data.filter((item) => item.role === 'manager'));
        if (projectResult?.success) setProjects(projectResult.data);
        setLoading(false);
    }, [isAdmin]);

    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const availableProjects = useMemo(() => form.manager_id
        ? projects.filter((project) => Number(project.manager_id) === Number(form.manager_id))
        : [], [form.manager_id, projects]);

    const createAssignment = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        const result = await createManagerAssignmentApi({ ...form, project_id: form.project_id || null });
        if (result.success) { setSuccess(result.message); setForm(emptyForm); setSearchParams({ view: 'manage' }); await load(); }
        else setError(result.message);
        setSaving(false);
    };

    const openProgress = (row) => {
        setEditing(row);
        setProgressForm({
            status: row.status === 'assigned' ? 'accepted' : row.status,
            progress_percent: Number(row.progress_percent || 0),
            manager_note: row.manager_note || '',
        });
    };

    const saveProgress = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        const result = await updateManagerAssignmentApi(editing.id, progressForm);
        if (result.success) { setSuccess(result.message); setEditing(null); await load(); }
        else setError(result.message);
        setSaving(false);
    };

    const cancelAssignment = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        const result = await cancelManagerAssignmentApi(cancelling.id, cancelReason);
        if (result.success) { setSuccess(result.message); setCancelling(null); setCancelReason(''); await load(); }
        else setError(result.message);
        setSaving(false);
    };

    const statusLabel = (status) => ({
        assigned: vi ? 'Đã giao' : 'Assigned', accepted: vi ? 'Đã nhận' : 'Accepted',
        in_progress: vi ? 'Đang thực hiện' : 'In progress', completed: vi ? 'Hoàn thành' : 'Completed',
        cancelled: vi ? 'Đã hủy' : 'Cancelled',
    })[status] || status;
    const priorityLabel = (priority) => ({
        low: vi ? 'Thấp' : 'Low', medium: vi ? 'Trung bình' : 'Medium',
        high: vi ? 'Cao' : 'High', urgent: vi ? 'Khẩn cấp' : 'Urgent',
    })[priority] || priority;
    const badge = (status) => status === 'completed' ? 'badge-success' : status === 'cancelled' ? 'badge-danger' : status === 'in_progress' ? 'badge-info' : 'badge-warning';

    const columns = [
        { key: 'title', label: vi ? 'Nhiệm vụ' : 'Assignment', cellClassName: 'font-semibold text-slate-900' },
        ...(isAdmin ? [{ key: 'manager_name', label: vi ? 'Manager phụ trách' : 'Manager' }] : []),
        { key: 'project_name', label: vi ? 'Dự án' : 'Project', render: (row) => row.project_name || (vi ? 'Toàn hệ thống' : 'Organization-wide') },
        { key: 'priority', label: vi ? 'Ưu tiên' : 'Priority', value: (row) => priorityLabel(row.priority), render: (row) => <span className={`badge ${row.priority === 'urgent' ? 'badge-danger' : 'badge-warning'}`}>{priorityLabel(row.priority)}</span> },
        { key: 'due_date', label: vi ? 'Hạn hoàn thành' : 'Due date', render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString(vi ? 'vi-VN' : 'en-US') : '—' },
        { key: 'progress_percent', label: vi ? 'Tiến độ' : 'Progress', render: (row) => <div className="min-w-28"><div className="mb-1 text-xs font-semibold text-slate-700">{row.progress_percent}%</div><div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${row.progress_percent}%` }} /></div></div> },
        { key: 'status', label: vi ? 'Trạng thái' : 'Status', value: (row) => statusLabel(row.status), render: (row) => <span className={`badge ${badge(row.status)}`}>{statusLabel(row.status)}</span> },
        { id: 'actions', label: vi ? 'Thao tác' : 'Actions', sortable: false, searchable: false, render: (row) => (
            <div className="flex gap-2">
                {!isAdmin && !['completed', 'cancelled'].includes(row.status) && <button className="btn btn-sm btn-primary" onClick={() => openProgress(row)}>{vi ? 'Cập nhật' : 'Update'}</button>}
                {isAdmin && !['completed', 'cancelled'].includes(row.status) && <button className="btn btn-sm btn-danger" onClick={() => { setCancelling(row); setCancelReason(''); }}>{vi ? 'Hủy' : 'Cancel'}</button>}
            </div>
        ) },
    ];

    const activeCount = assignments.filter((item) => ['assigned', 'accepted', 'in_progress'].includes(item.status)).length;
    const completedCount = assignments.filter((item) => item.status === 'completed').length;

    return <div className="space-y-8">
        <PageHeader
            title={isAdmin
                ? viewMode === 'create' ? (vi ? 'Giao nhiệm vụ cho Manager' : 'Assign work to managers') : (vi ? 'Quản lý nhiệm vụ Manager' : 'Manage manager assignments')
                : (vi ? 'Nhiệm vụ từ Admin' : 'Assignments from Admin')}
            subtitle={isAdmin ? (vi ? 'Giao mục tiêu cấp quản lý và theo dõi tiến độ thực hiện.' : 'Assign management objectives and monitor delivery.') : (vi ? 'Tiếp nhận, cập nhật tiến độ và báo cáo kết quả cho Admin.' : 'Accept assignments and report progress to Admin.')}
            useLogo
            action={isAdmin ? (
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm shadow-sm">
                    <button type="button" className={`rounded-full px-4 py-2 font-medium transition ${viewMode === 'create' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => { setSearchParams({ view: 'create' }); setError(''); }}>
                        + {vi ? 'Giao nhiệm vụ' : 'New assignment'}
                    </button>
                    <button type="button" className={`rounded-full px-4 py-2 font-medium transition ${viewMode === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => { setSearchParams({ view: 'manage' }); setError(''); }}>
                        {vi ? 'Danh sách nhiệm vụ' : 'Assignment list'}
                    </button>
                </div>
            ) : undefined}
        />
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {isAdmin && viewMode === 'create' ? <div className="rounded-[2rem] bg-white/95 p-6 shadow-lg shadow-slate-200/40">
            <div className="mb-6 rounded-3xl bg-slate-50 p-5 text-slate-600">
                <p>{vi ? 'Tạo mục tiêu cấp quản lý, chọn Manager phụ trách và theo dõi tiến độ trong một luồng thống nhất.' : 'Create a management objective, choose an owner and track progress in one workflow.'}</p>
            </div>
            <form onSubmit={createAssignment} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Manager</span><select className="form-select" required value={form.manager_id} onChange={(event) => setForm({ ...form, manager_id: event.target.value, project_id: '' })}><option value="">{vi ? 'Chọn Manager' : 'Select manager'}</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.fullname}</option>)}</select></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Dự án liên quan (không bắt buộc)' : 'Related project (optional)'}</span><select className="form-select" value={form.project_id} disabled={!form.manager_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })}><option value="">{vi ? 'Nhiệm vụ toàn hệ thống' : 'Organization-wide assignment'}</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Tên nhiệm vụ' : 'Assignment title'}</span><input className="form-input" required minLength={5} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Mục tiêu và yêu cầu' : 'Objective and requirements'}</span><textarea className="form-textarea" rows={4} required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Hạn hoàn thành' : 'Due date'}</span><input className="form-input" type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Mức ưu tiên' : 'Priority'}</span><select className="form-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{['low', 'medium', 'high', 'urgent'].map((item) => <option key={item} value={item}>{priorityLabel(item)}</option>)}</select></label>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
                <button className="btn btn-primary" disabled={saving}>{saving ? (vi ? 'Đang giao...' : 'Assigning...') : (vi ? 'Giao nhiệm vụ' : 'Assign')}</button>
                <button type="button" className="btn btn-outline" onClick={() => setSearchParams({ view: 'manage' })}>{vi ? 'Hủy' : 'Cancel'}</button>
            </div>
            </form>
        </div> : <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40"><p className="text-sm text-slate-500">{vi ? 'Tổng nhiệm vụ' : 'Total assignments'}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{assignments.length}</p></div>
                <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40"><p className="text-sm text-slate-500">{vi ? 'Đang thực hiện' : 'Active'}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{activeCount}</p></div>
                <div className="rounded-[1.5rem] bg-white/95 p-5 shadow-sm shadow-slate-200/40"><p className="text-sm text-slate-500">{vi ? 'Đã hoàn thành' : 'Completed'}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{completedCount}</p></div>
            </div>
            <DataTable columns={columns} data={assignments} loading={loading} emptyText={vi ? 'Chưa có nhiệm vụ quản lý.' : 'No management assignments.'} />
        </div>}

        {editing && <div className="modal-overlay" onClick={() => setEditing(null)}><div className="modal-content max-w-2xl" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h3>{editing.title}</h3><p className="mt-1 text-sm text-slate-500">{editing.description}</p></div></div><form onSubmit={saveProgress} className="space-y-4"><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Trạng thái' : 'Status'}</span><select className="form-select" value={progressForm.status} onChange={(event) => setProgressForm({ ...progressForm, status: event.target.value, progress_percent: event.target.value === 'completed' ? 100 : progressForm.progress_percent })}>{['accepted', 'in_progress', 'completed'].map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Tiến độ (%)' : 'Progress (%)'}</span><input className="form-input" type="number" min="0" max="100" value={progressForm.progress_percent} disabled={progressForm.status === 'completed'} onChange={(event) => setProgressForm({ ...progressForm, progress_percent: Number(event.target.value) })} /></label><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Báo cáo/Ghi chú cho Admin' : 'Progress note for Admin'}</span><textarea className="form-textarea" rows={4} value={progressForm.manager_note} onChange={(event) => setProgressForm({ ...progressForm, manager_note: event.target.value })} /></label><div className="modal-actions"><button className="btn btn-primary" disabled={saving}>{vi ? 'Lưu tiến độ' : 'Save progress'}</button><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{vi ? 'Đóng' : 'Close'}</button></div></form></div></div>}

        {cancelling && <div className="modal-overlay" onClick={() => setCancelling(null)}><div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h3>{vi ? 'Hủy nhiệm vụ' : 'Cancel assignment'}</h3><p className="mt-1 text-sm text-slate-500">{cancelling.title}</p></div></div><form onSubmit={cancelAssignment} className="space-y-4"><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Lý do hủy' : 'Cancellation reason'}</span><textarea className="form-textarea" rows={4} minLength={5} required value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></label><div className="modal-actions"><button className="btn btn-danger" disabled={saving}>{vi ? 'Xác nhận hủy' : 'Confirm cancellation'}</button><button type="button" className="btn btn-outline" onClick={() => setCancelling(null)}>{vi ? 'Đóng' : 'Close'}</button></div></form></div></div>}
    </div>;
};

export default ManagerAssignments;
