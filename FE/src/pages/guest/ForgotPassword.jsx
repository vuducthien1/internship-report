import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { forgotPasswordApi } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [devToken, setDevToken] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        const data = await forgotPasswordApi(email);
        if (data.success) {
            setMessage(data.message);
            setDevToken(data.dev_reset_token || '');
        } else {
            setError(data.message);
        }
        setLoading(false);
    };

    return (
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/50 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Mail size={22} /></div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">{t('forgotPasswordTitle')}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('forgotPasswordSubtitle')}</p>
            <form className="mt-6 space-y-4" onSubmit={submit}>
                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{t('email')}</span>
                    <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <button className="btn btn-primary w-full" disabled={loading}>{loading ? t('processing') : t('sendResetLink')}</button>
            </form>
            {message && <div className="alert alert-success mt-4">{message}</div>}
            {error && <div className="alert alert-error mt-4">{error}</div>}
            {devToken && (
                <Link className="btn btn-outline mt-4 w-full" to={`/reset-password?token=${devToken}`}>{t('resetPassword')}</Link>
            )}
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><ArrowLeft size={16} /> {t('login')}</Link>
        </div>
    );
};

export default ForgotPassword;
