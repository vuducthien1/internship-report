import { useEffect, useState } from 'react';
import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    changeMyPasswordApi,
    getMyProfileApi,
    updateMyProfileApi,
} from '../../services/userService';

const Account = () => {
    const { t } = useLanguage();
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({ phone: '', bio: '', avatar_url: '' });
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const result = await getMyProfileApi();
            if (result.success) {
                setProfile(result.data);
                setForm({
                    phone: result.data.phone || '',
                    bio: result.data.bio || '',
                    avatar_url: result.data.avatar_url || '',
                });
            } else {
                setError(result.message);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const saveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        const result = await updateMyProfileApi(form);
        if (result.success) {
            setProfile(result.data);
            updateUser({
                phone: result.data.phone,
                avatar_url: result.data.avatar_url,
            });
            setMessage(result.message);
        } else {
            setError(result.message);
        }
        setSaving(false);
    };

    const changePassword = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        const result = await changeMyPasswordApi(passwords);
        if (result.success) {
            setPasswords({ current_password: '', new_password: '', confirm_password: '' });
            setMessage(result.message);
        } else {
            setError(result.message);
        }
        setSaving(false);
    };

    const roleLabel = ({
        admin: t('roleAdmin'),
        manager: t('roleManager'),
        engineer: t('roleEngineer'),
    })[profile?.role] || profile?.role;

    return (
        <div className="space-y-6">
            <PageHeader title={t('accountManagement')} subtitle={t('accountSubtitle')} icon="👤" />
            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <form onSubmit={saveProfile} className="card space-y-6 p-6">
                    <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
                        {form.avatar_url ? (
                            <img src={form.avatar_url} alt="" className="h-20 w-20 rounded-3xl object-cover" />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-700">
                                <UserRound size={32} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">{t('personalInformation')}</h2>
                            <p className="mt-1 text-sm text-slate-500">{t('personalInformationHint')}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 sm:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">{t('phone')}</span>
                            <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">{t('avatarUrl')}</span>
                            <input className="form-input" type="url" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">{t('bio')}</span>
                            <textarea className="form-textarea" rows={4} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                        </label>
                    </div>
                    <button className="btn btn-primary" disabled={saving}>{saving ? t('processing') : t('saveChanges')}</button>
                </form>

                <div className="space-y-6">
                    <section className="card p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <ShieldCheck className="text-indigo-600" />
                            <div>
                                <h2 className="font-semibold text-slate-900">{t('officialInformation')}</h2>
                                <p className="text-sm text-slate-500">{t('officialInformationHint')}</p>
                            </div>
                        </div>
                        <dl className="space-y-3 text-sm">
                            {[
                                [t('fullname'), profile?.fullname],
                                [t('username'), profile?.username],
                                [t('email'), profile?.email],
                                [t('employeeCode'), profile?.employee_code],
                                [t('department'), profile?.department],
                                [t('jobTitle'), profile?.job_title],
                                [t('role'), roleLabel],
                                [t('status'), profile?.status],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                                    <dt className="flex items-center gap-2 text-slate-500"><LockKeyhole size={14} />{label}</dt>
                                    <dd className="text-right font-medium text-slate-900">{value || '—'}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <form onSubmit={changePassword} className="card space-y-4 p-6">
                        <h2 className="font-semibold text-slate-900">{t('changePassword')}</h2>
                        <input className="form-input" type="password" placeholder={t('currentPassword')} value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required />
                        <input className="form-input" type="password" placeholder={t('newPassword')} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} required />
                        <input className="form-input" type="password" placeholder={t('confirmPassword')} value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} required />
                        <p className="text-xs text-slate-500">{t('passwordPolicy')}</p>
                        <button className="btn btn-outline" disabled={saving}>{t('changePassword')}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Account;
