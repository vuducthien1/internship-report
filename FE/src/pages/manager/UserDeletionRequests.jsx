import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
    getDeletionCandidatesApi,
    getDeletionRequestsApi,
    requestUserDeletionApi,
} from '../../services/userDeletionService';

const UserDeletionRequests = () => {
    const { language } = useLanguage();
    const vi = language === 'vi';
    const [candidates, setCandidates] = useState([]);
    const [requests, setRequests] = useState([]);
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        const [candidateResult, requestResult] = await Promise.all([getDeletionCandidatesApi(), getDeletionRequestsApi()]);
        if (candidateResult.success) setCandidates(candidateResult.data); else setError(candidateResult.message);
        if (requestResult.success) setRequests(requestResult.data); else setError(requestResult.message);
        setLoading(false);
    }, []);
    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const submit = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        const result = await requestUserDeletionApi(selected.id, reason);
        if (result.success) { setSuccess(result.message); setSelected(null); setReason(''); await load(); }
        else setError(result.message);
        setSaving(false);
    };
    const pendingTargets = new Set(requests.filter((item) => item.status === 'pending').map((item) => Number(item.target_user_id)));
    const statusLabel = (status) => ({ pending: vi ? 'Chờ Admin duyệt' : 'Pending Admin review', approved: vi ? 'Đã duyệt' : 'Approved', rejected: vi ? 'Từ chối' : 'Rejected' })[status] || status;
    const statusBadge = (status) => status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-danger' : 'badge-warning';

    const candidateColumns = [
        { key: 'fullname', label: vi ? 'Engineer' : 'Engineer', cellClassName: 'font-semibold text-slate-900' },
        { key: 'employee_code', label: vi ? 'Mã nhân viên' : 'Employee code', render: (row) => row.employee_code || '—' },
        { key: 'project_names', label: vi ? 'Dự án đang tham gia' : 'Managed projects' },
        { key: 'total_tasks', label: vi ? 'Tổng việc' : 'Tasks' },
        { key: 'open_tasks', label: vi ? 'Việc đang mở' : 'Open tasks' },
        { id: 'actions', label: vi ? 'Thao tác' : 'Actions', sortable: false, searchable: false, render: (row) => pendingTargets.has(Number(row.id)) ? <span className="badge badge-warning">{vi ? 'Đang chờ duyệt' : 'Pending'}</span> : <button className="btn btn-sm btn-danger" onClick={() => { setSelected(row); setReason(''); }}>{vi ? 'Yêu cầu xóa' : 'Request deletion'}</button> },
    ];
    const requestColumns = [
        { key: 'fullname', label: vi ? 'Engineer' : 'Engineer', cellClassName: 'font-semibold text-slate-900' },
        { key: 'reason', label: vi ? 'Lý do đã gửi' : 'Submitted reason' },
        { key: 'created_at', label: vi ? 'Ngày gửi' : 'Requested at', render: (row) => new Date(row.created_at).toLocaleString(vi ? 'vi-VN' : 'en-US') },
        { key: 'status', label: vi ? 'Trạng thái' : 'Status', value: (row) => statusLabel(row.status), render: (row) => <span className={`badge ${statusBadge(row.status)}`}>{statusLabel(row.status)}</span> },
        { key: 'review_note', label: vi ? 'Phản hồi của Admin' : 'Admin response', render: (row) => row.review_note || '—' },
    ];

    return <div className="space-y-6">
        <PageHeader title={vi ? 'Yêu cầu xóa tài khoản Engineer' : 'Engineer deletion requests'} subtitle={vi ? 'Manager chỉ gửi yêu cầu kèm lý do; Admin là người quyết định xóa mềm tài khoản.' : 'Managers submit a reason; only Admin can approve soft deletion.'} icon="users" />
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <section className="space-y-3"><h2 className="text-lg font-semibold text-slate-900">{vi ? 'Engineer thuộc dự án của tôi' : 'Engineers in my projects'}</h2><DataTable columns={candidateColumns} data={candidates} loading={loading} emptyText={vi ? 'Chưa có Engineer nào trong dự án bạn quản lý.' : 'No engineers in your managed projects.'} /></section>
        <section className="space-y-3"><h2 className="text-lg font-semibold text-slate-900">{vi ? 'Lịch sử yêu cầu' : 'Request history'}</h2><DataTable columns={requestColumns} data={requests} loading={loading} emptyText={vi ? 'Bạn chưa gửi yêu cầu nào.' : 'You have not submitted any requests.'} /></section>

        {selected && <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h3>{vi ? 'Gửi yêu cầu xóa mềm' : 'Request soft deletion'}</h3><p className="mt-1 text-sm text-slate-500">{selected.fullname} · {selected.project_names}</p></div></div><form onSubmit={submit} className="space-y-4"><div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{vi ? 'Yêu cầu này không xóa dữ liệu. Admin sẽ kiểm tra lý do trước khi vô hiệu hóa tài khoản.' : 'This request never removes historical data. Admin reviews the reason before disabling access.'}</div><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Lý do đề nghị xóa tài khoản' : 'Reason for requesting deletion'}</span><textarea className="form-textarea" rows={5} required minLength={10} maxLength={1000} placeholder={vi ? 'Ví dụ: Nhân sự đã chấm dứt hợp đồng từ ngày...' : 'Example: Employment ended on...'} value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className="modal-actions"><button className="btn btn-danger" disabled={saving}>{saving ? (vi ? 'Đang gửi...' : 'Submitting...') : (vi ? 'Gửi cho Admin duyệt' : 'Submit to Admin')}</button><button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>{vi ? 'Đóng' : 'Close'}</button></div></form></div></div>}
    </div>;
};

export default UserDeletionRequests;
