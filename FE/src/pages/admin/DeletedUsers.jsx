import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
    getDeletedUsersApi,
    getDeletionRequestsApi,
    restoreDeletedUserApi,
    reviewDeletionRequestApi,
} from '../../services/userDeletionService';

const DeletedUsers = () => {
    const { language } = useLanguage();
    const vi = language === 'vi';
    const [tab, setTab] = useState('requests');
    const [requests, setRequests] = useState([]);
    const [deletedUsers, setDeletedUsers] = useState([]);
    const [reviewing, setReviewing] = useState(null);
    const [decision, setDecision] = useState('approved');
    const [reviewNote, setReviewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        const [requestResult, deletedResult] = await Promise.all([getDeletionRequestsApi(), getDeletedUsersApi()]);
        if (requestResult.success) setRequests(requestResult.data); else setError(requestResult.message);
        if (deletedResult.success) setDeletedUsers(deletedResult.data); else setError(deletedResult.message);
        setLoading(false);
    }, []);
    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const openReview = (row, nextDecision) => {
        setReviewing(row); setDecision(nextDecision); setReviewNote(''); setError(''); setSuccess('');
    };
    const submitReview = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        const result = await reviewDeletionRequestApi(reviewing.id, decision, reviewNote);
        if (result.success) { setSuccess(result.message); setReviewing(null); await load(); }
        else setError(result.message);
        setSaving(false);
    };
    const restore = async (row) => {
        if (!window.confirm(vi ? `Khôi phục tài khoản ${row.fullname} ở trạng thái khóa?` : `Restore ${row.fullname} as suspended?`)) return;
        setSaving(true); setError(''); setSuccess('');
        const result = await restoreDeletedUserApi(row.id);
        if (result.success) { setSuccess(result.message); await load(); } else setError(result.message);
        setSaving(false);
    };

    const requestStatus = (status) => ({ pending: vi ? 'Chờ duyệt' : 'Pending', approved: vi ? 'Đã duyệt' : 'Approved', rejected: vi ? 'Từ chối' : 'Rejected' })[status] || status;
    const statusBadge = (status) => status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-danger' : 'badge-warning';
    const date = (value) => value ? new Date(value).toLocaleString(vi ? 'vi-VN' : 'en-US') : '—';

    const requestColumns = [
        { key: 'fullname', label: vi ? 'Nhân sự' : 'Employee', cellClassName: 'font-semibold text-slate-900' },
        { key: 'employee_code', label: vi ? 'Mã nhân viên' : 'Employee code', render: (row) => row.employee_code || '—' },
        { key: 'requested_by_name', label: vi ? 'Người yêu cầu' : 'Requested by', render: (row) => row.requested_by_name || '—' },
        { key: 'reason', label: vi ? 'Lý do' : 'Reason' },
        { key: 'created_at', label: vi ? 'Ngày gửi' : 'Requested at', render: (row) => date(row.created_at) },
        { key: 'status', label: vi ? 'Trạng thái' : 'Status', value: (row) => requestStatus(row.status), render: (row) => <span className={`badge ${statusBadge(row.status)}`}>{requestStatus(row.status)}</span> },
        { key: 'review_note', label: vi ? 'Phản hồi Admin' : 'Admin note', render: (row) => row.review_note || '—' },
        { id: 'actions', label: vi ? 'Thao tác' : 'Actions', sortable: false, searchable: false, render: (row) => row.status === 'pending' ? <div className="flex gap-2"><button className="btn btn-sm btn-success" onClick={() => openReview(row, 'approved')}>{vi ? 'Duyệt xóa' : 'Approve'}</button><button className="btn btn-sm btn-danger" onClick={() => openReview(row, 'rejected')}>{vi ? 'Từ chối' : 'Reject'}</button></div> : '—' },
    ];
    const deletedColumns = [
        { key: 'fullname', label: vi ? 'Nhân sự đã xóa' : 'Deleted employee', cellClassName: 'font-semibold text-slate-900' },
        { key: 'username', label: vi ? 'Tài khoản' : 'Username' },
        { key: 'employee_code', label: vi ? 'Mã nhân viên' : 'Employee code', render: (row) => row.employee_code || '—' },
        { key: 'deletion_reason', label: vi ? 'Lý do xóa' : 'Deletion reason' },
        { key: 'deleted_by_name', label: vi ? 'Xử lý bởi' : 'Deleted by', render: (row) => row.deleted_by_name || '—' },
        { key: 'deleted_at', label: vi ? 'Thời gian xóa' : 'Deleted at', render: (row) => date(row.deleted_at) },
        { key: 'total_tasks', label: vi ? 'Công việc lưu giữ' : 'Retained tasks' },
        { key: 'total_reports', label: vi ? 'Báo cáo lưu giữ' : 'Retained reports' },
        { id: 'actions', label: vi ? 'Thao tác' : 'Actions', sortable: false, searchable: false, render: (row) => <button className="btn btn-sm btn-outline" disabled={saving} onClick={() => restore(row)}>{vi ? 'Khôi phục' : 'Restore'}</button> },
    ];

    const pendingCount = requests.filter((item) => item.status === 'pending').length;
    return <div className="space-y-6">
        <PageHeader title={vi ? 'Quản lý tài khoản đã xóa' : 'Deleted user management'} subtitle={vi ? 'Duyệt yêu cầu từ Manager, lưu lịch sử và khôi phục tài khoản khi cần.' : 'Review manager requests, retain history and restore accounts when necessary.'} icon="users" />
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
            <button className={`btn ${tab === 'requests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('requests')}>{vi ? `Yêu cầu xóa (${pendingCount})` : `Deletion requests (${pendingCount})`}</button>
            <button className={`btn ${tab === 'deleted' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('deleted')}>{vi ? `Tài khoản đã xóa (${deletedUsers.length})` : `Deleted accounts (${deletedUsers.length})`}</button>
        </div>
        {tab === 'requests'
            ? <DataTable columns={requestColumns} data={requests} loading={loading} emptyText={vi ? 'Chưa có yêu cầu xóa tài khoản.' : 'No deletion requests.'} />
            : <DataTable columns={deletedColumns} data={deletedUsers} loading={loading} emptyText={vi ? 'Chưa có tài khoản nào bị xóa mềm.' : 'No soft-deleted accounts.'} />}

        {reviewing && <div className="modal-overlay" onClick={() => setReviewing(null)}><div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h3>{decision === 'approved' ? (vi ? 'Duyệt xóa mềm tài khoản' : 'Approve soft deletion') : (vi ? 'Từ chối yêu cầu' : 'Reject request')}</h3><p className="mt-1 text-sm text-slate-500">{reviewing.fullname} · {reviewing.reason}</p></div></div><form onSubmit={submitReview} className="space-y-4"><div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{decision === 'approved' ? (vi ? 'Tài khoản sẽ không thể đăng nhập nhưng toàn bộ công việc, báo cáo và lịch sử vẫn được giữ trong database.' : 'The account will lose access while all tasks, reports and history remain in the database.') : (vi ? 'Manager sẽ nhận được thông báo kèm lý do từ chối.' : 'The manager will receive your rejection note.')}</div><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">{vi ? 'Ghi chú của Admin' : 'Admin note'}</span><textarea className="form-textarea" rows={4} required={decision === 'rejected'} minLength={decision === 'rejected' ? 5 : 0} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} /></label><div className="modal-actions"><button className={`btn ${decision === 'approved' ? 'btn-danger' : 'btn-primary'}`} disabled={saving}>{decision === 'approved' ? (vi ? 'Xác nhận xóa mềm' : 'Confirm deletion') : (vi ? 'Gửi từ chối' : 'Reject')}</button><button type="button" className="btn btn-outline" onClick={() => setReviewing(null)}>{vi ? 'Đóng' : 'Close'}</button></div></form></div></div>}
    </div>;
};

export default DeletedUsers;
