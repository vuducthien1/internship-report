import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    adminUpdateUserProfileApi,
    getAllUsersApi,
    updateUserRoleApi,
    updateUserStatusApi,
} from '../../services/userService';
import { directDeleteUserApi } from '../../services/userDeletionService';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);
    const [deletionReason, setDeletionReason] = useState('');
    const [editForm, setEditForm] = useState({
        fullname: '', email: '', phone: '', employee_code: '', department: '', job_title: '',
    });
    const { t, language } = useLanguage();
    const vi = language === 'vi';
    const { user: currentUser, updateUser } = useAuth();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const data = await getAllUsersApi();
        if (data.success) {
            setUsers(data.data);
            setError('');
        } else {
            setError(data.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 0);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleToggleLock = async (targetUser) => {
        const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
        if (!window.confirm(newStatus === 'suspended' ? t('lockUserConfirm') : t('unlockUserConfirm'))) return;
        setUpdatingId(targetUser.id);
        setSuccess('');
        setError('');
        const data = await updateUserStatusApi(targetUser.id, newStatus);
        if (data.success) {
            setSuccess(data.message);
            await fetchUsers();
        } else {
            setError(data.message);
        }
        setUpdatingId(null);
    };

    const handleRegistrationDecision = async (targetUser, approved) => {
        if (!window.confirm(approved ? t('approveRegistrationConfirm') : t('rejectRegistrationConfirm'))) return;
        setUpdatingId(targetUser.id);
        setSuccess('');
        setError('');
        const data = await updateUserStatusApi(targetUser.id, approved ? 'active' : 'suspended');
        if (data.success) {
            setSuccess(data.message);
            await fetchUsers();
        } else {
            setError(data.message);
        }
        setUpdatingId(null);
    };

    const handleToggleRole = async (targetUser) => {
        const newRole = targetUser.role === 'engineer' ? 'manager' : 'engineer';
        if (!window.confirm(newRole === 'manager' ? t('promoteRoleConfirm') : t('demoteRoleConfirm'))) return;
        setUpdatingId(targetUser.id);
        setSuccess('');
        setError('');
        const data = await updateUserRoleApi(targetUser.id, newRole);
        if (data.success) {
            setSuccess(data.message);
            await fetchUsers();
        } else {
            setError(data.message);
        }
        setUpdatingId(null);
    };

    const openEditUser = (targetUser) => {
        setEditingUser(targetUser);
        setEditForm({
            fullname: targetUser.fullname || '',
            email: targetUser.email || '',
            phone: targetUser.phone || '',
            employee_code: targetUser.employee_code || '',
            department: targetUser.department || '',
            job_title: targetUser.job_title || '',
        });
        setError('');
        setSuccess('');
    };

    const saveOfficialProfile = async (event) => {
        event.preventDefault();
        setUpdatingId(editingUser.id);
        const data = await adminUpdateUserProfileApi(editingUser.id, editForm);
        if (data.success) {
            if (editingUser.id === currentUser?.id) {
                updateUser({
                    fullname: editForm.fullname,
                    email: editForm.email,
                    phone: editForm.phone,
                });
            }
            setSuccess(data.message);
            setEditingUser(null);
            await fetchUsers();
        } else {
            setError(data.message);
        }
        setUpdatingId(null);
    };

    const softDeleteUser = async (event) => {
        event.preventDefault();
        setUpdatingId(deletingUser.id);
        setError('');
        setSuccess('');
        const data = await directDeleteUserApi(deletingUser.id, deletionReason);
        if (data.success) {
            setSuccess(data.message);
            setDeletingUser(null);
            setDeletionReason('');
            await fetchUsers();
        } else {
            setError(data.message);
        }
        setUpdatingId(null);
    };

    const getRoleLabel = (role) => ({
        admin: t('roleAdmin'),
        manager: t('roleManager'),
        engineer: t('roleEngineer'),
    })[role] || role;

    const getStatusLabel = (status) => ({
        active: t('statusActive'),
        pending: t('statusPendingApproval'),
        suspended: t('statusLocked'),
        inactive: t('statusInactive'),
    })[status] || status;

    const columns = [
        { key: 'username', label: t('username'), cellClassName: 'font-semibold text-slate-900' },
        { key: 'fullname', label: t('fullname') },
        { key: 'employee_code', label: t('employeeCode'), render: (row) => row.employee_code || '—' },
        { key: 'department', label: t('department'), render: (row) => row.department || '—' },
        { key: 'email', label: t('email') },
        { key: 'phone', label: t('phone') },
        {
            key: 'email_verified_at',
            label: t('emailVerification'),
            value: (row) => row.email_verified_at ? t('emailVerified') : t('emailUnverified'),
            render: (row) => <span className={`badge ${row.email_verified_at ? 'badge-success' : 'badge-warning'}`}>{row.email_verified_at ? t('emailVerified') : t('emailUnverified')}</span>,
        },
        {
            key: 'role',
            label: t('role'),
            value: (row) => getRoleLabel(row.role),
            render: (row) => getRoleLabel(row.role),
        },
        {
            key: 'status',
            label: t('status'),
            value: (row) => getStatusLabel(row.status),
            render: (row) => (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    row.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : row.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                        : row.status === 'suspended'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                }`}>
                    {getStatusLabel(row.status)}
                </span>
            ),
        },
        {
            id: 'actions',
            label: t('actions'),
            sortable: false,
            searchable: false,
            render: (row) => (
                <div className="flex min-w-max flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditUser(row)}
                        disabled={updatingId === row.id}
                    >
                        {t('editProfile')}
                    </button>
                    {row.id !== currentUser?.id && row.status !== 'inactive' ? (
                        <>
                            {row.status === 'pending' && (
                                <>
                                    <button type="button" className="btn btn-sm btn-success" onClick={() => handleRegistrationDecision(row, true)} disabled={updatingId === row.id}>{t('approveAccount')}</button>
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRegistrationDecision(row, false)} disabled={updatingId === row.id}>{t('rejectRegistration')}</button>
                                </>
                            )}
                            {row.status === 'active' && ['engineer', 'manager'].includes(row.role) && (
                                <button
                                    type="button"
                                    className={`btn btn-sm ${row.role === 'engineer' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => handleToggleRole(row)}
                                    disabled={updatingId === row.id}
                                >
                                    {row.role === 'engineer' ? t('promoteRole') : t('demoteRole')}
                                </button>
                            )}
                            {row.status !== 'pending' && <button
                                type="button"
                                className={`btn btn-sm ${row.status === 'suspended' ? 'btn-success' : 'btn-danger'}`}
                                onClick={() => handleToggleLock(row)}
                                disabled={updatingId === row.id}
                            >
                                {row.status === 'suspended' ? t('unlockAccount') : t('lockAccount')}
                            </button>}
                            {row.role === 'engineer' && row.status !== 'pending' && <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => { setDeletingUser(row); setDeletionReason(''); setError(''); setSuccess(''); }}
                                disabled={updatingId === row.id}
                            >
                                {vi ? 'Xóa mềm' : 'Soft delete'}
                            </button>}
                        </>
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title={t('userManagement')} subtitle={t('userManagementDesc')} useLogo />
            {error && <div className="alert alert-error">{t('error')}: {error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <DataTable columns={columns} data={users} loading={loading} emptyText={t('noUsers')} />

            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal-content max-w-3xl" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{t('employeeProfile')}</h3>
                                <p className="mt-1 text-sm text-slate-500">{t('officialInformationHint')}</p>
                            </div>
                        </div>
                        <form onSubmit={saveOfficialProfile} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('username')} · {t('notEditable')}</span>
                                    <input className="form-input" value={editingUser.username} disabled />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('role')} · {t('managedSeparately')}</span>
                                    <input className="form-input" value={getRoleLabel(editingUser.role)} disabled />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('fullname')}</span>
                                    <input className="form-input" value={editForm.fullname} onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })} required />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('email')}</span>
                                    <input className="form-input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('phone')}</span>
                                    <input className="form-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('employeeCode')}</span>
                                    <input className="form-input" value={editForm.employee_code} onChange={(e) => setEditForm({ ...editForm, employee_code: e.target.value })} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('department')}</span>
                                    <input className="form-input" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">{t('jobTitle')}</span>
                                    <input className="form-input" value={editForm.job_title} onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })} />
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-primary" disabled={updatingId === editingUser.id}>{t('saveChanges')}</button>
                                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>{t('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deletingUser && (
                <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
                    <div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{vi ? 'Xóa mềm tài khoản Engineer' : 'Soft delete engineer account'}</h3>
                                <p className="mt-1 text-sm text-slate-500">{deletingUser.fullname} · {deletingUser.username}</p>
                            </div>
                        </div>
                        <form onSubmit={softDeleteUser} className="space-y-4">
                            <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                                {vi
                                    ? 'Tài khoản sẽ biến mất khỏi danh sách người dùng và không thể đăng nhập. Công việc, báo cáo, sự cố và toàn bộ lịch sử vẫn được giữ trong database.'
                                    : 'The account disappears from active users and cannot sign in. Tasks, reports, incidents and all history remain in the database.'}
                            </div>
                            <label className="space-y-2">
                                <span className="text-sm font-semibold text-slate-700">{vi ? 'Lý do xóa tài khoản' : 'Deletion reason'}</span>
                                <textarea className="form-textarea" rows={5} required minLength={10} maxLength={1000} value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} />
                            </label>
                            <div className="modal-actions">
                                <button className="btn btn-danger" disabled={updatingId === deletingUser.id}>{vi ? 'Xác nhận xóa mềm' : 'Confirm soft deletion'}</button>
                                <button type="button" className="btn btn-outline" onClick={() => setDeletingUser(null)}>{vi ? 'Đóng' : 'Close'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;
