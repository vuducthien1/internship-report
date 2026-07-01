import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { resendVerificationApi, verifyEmailApi } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [result, setResult] = useState({ loading: true, success: false, message: '' });
    const [email, setEmail] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const started = useRef(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const token = searchParams.get('token') || '';
        verifyEmailApi(token).then((data) => setResult({ loading: false, success: data.success, message: data.message }));
    }, [searchParams]);

    const resend = async (event) => {
        event.preventDefault();
        const data = await resendVerificationApi(email);
        setResendMessage(data.message);
        if (data.dev_verification_token) {
            window.location.assign(`/verify-email?token=${data.dev_verification_token}`);
        }
    };

    return (
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><BadgeCheck size={28} /></div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">{t('emailVerification')}</h1>
            <p className={`mt-4 text-sm leading-6 ${result.success ? 'text-emerald-600' : 'text-slate-600'}`}>
                {result.loading ? t('verifyingEmail') : result.message}
            </p>
            {!result.loading && !result.success && (
                <form className="mt-5 space-y-3" onSubmit={resend}>
                    <input className="form-input" type="email" placeholder={t('email')} value={email} onChange={(event) => setEmail(event.target.value)} required />
                    <button className="btn btn-outline w-full">{t('resendVerification')}</button>
                    {resendMessage && <p className="text-sm text-slate-600">{resendMessage}</p>}
                </form>
            )}
            {!result.loading && <Link className="btn btn-primary mt-6" to="/login">{t('login')}</Link>}
        </div>
    );
};

export default VerifyEmail;
