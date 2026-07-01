import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { resetPasswordApi } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ password: '', confirm_password: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();
    const token = searchParams.get('token') || '';

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        const data = await resetPasswordApi({ token, ...form });
        if (data.success) setMessage(data.message);
        else setError(data.message);
        setLoading(false);
    };

    return (
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/50 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><KeyRound size={22} /></div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">{t('resetPasswordTitle')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('passwordPolicy')}</p>
            <form className="mt-6 space-y-4" onSubmit={submit}>
                <input className="form-input" type="password" placeholder={t('newPassword')} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                <input className="form-input" type="password" placeholder={t('confirmPassword')} value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} required />
                <button className="btn btn-primary w-full" disabled={loading || !token}>{loading ? t('processing') : t('resetPassword')}</button>
            </form>
            {message && <><div className="alert alert-success mt-4">{message}</div><Link className="btn btn-outline mt-4 w-full" to="/login">{t('login')}</Link></>}
            {error && <div className="alert alert-error mt-4">{error}</div>}
        </div>
    );
};

export default ResetPassword;
