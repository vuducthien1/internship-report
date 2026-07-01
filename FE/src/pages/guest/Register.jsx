import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { registerApi } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/common/Logo';
import { Button } from '../../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        fullname: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        role: 'engineer',
    });

    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: t('processing'), type: 'info' });

        const data = await registerApi(formData);

        if (data.success) {
            setMessage({ text: data.message, type: 'success' });
            if (data.dev_verification_token) {
                setTimeout(() => navigate(`/verify-email?token=${data.dev_verification_token}`), 1200);
            }
        } else {
            setMessage({ text: data.message, type: 'error' });
        }
        setIsLoading(false);
    };

    return (
        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:flex-row">
            <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 text-white sm:p-10 lg:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Logo size={32} />
                </div>
                <h2 className="mt-6 text-3xl font-semibold">{t('registerTitle')}</h2>
                <p className="mt-3 max-w-md text-base leading-8 text-slate-300">{t('ctaSubtitle')}</p>
                <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-slate-300">
                        <BadgeCheck size={18} className="text-emerald-300" />
                        {t('featureSecurityDesc')}
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-slate-300">
                        <ShieldCheck size={18} className="text-emerald-300" />
                        {t('featureProjectDesc')}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-10">
                <Card className="w-full max-w-xl border-0 bg-transparent p-0 shadow-none">
                    <CardHeader>
                        <CardTitle>{t('registerTitle')}</CardTitle>
                        <CardDescription>{t('tagline')}</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleRegister} className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('username')}</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                <UserRound size={18} className="text-slate-400" />
                                <input type="text" name="username" className="w-full border-0 bg-transparent text-sm outline-none" required onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('fullname')}</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                <UserRound size={18} className="text-slate-400" />
                                <input type="text" name="fullname" className="w-full border-0 bg-transparent text-sm outline-none" required onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('email')}</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                <Mail size={18} className="text-slate-400" />
                                <input type="email" name="email" className="w-full border-0 bg-transparent text-sm outline-none" required onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('phone')}</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                <Phone size={18} className="text-slate-400" />
                                <input type="text" name="phone" className="w-full border-0 bg-transparent text-sm outline-none" required onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('password')}</label>
                            <input type="password" name="password" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none" required onChange={handleChange} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('confirmPassword')}</label>
                            <input type="password" name="confirm_password" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none" required onChange={handleChange} />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-4 flex items-start gap-3 text-sm leading-6 text-slate-600">
                                <input type="checkbox" className="mt-1" required />
                                <span>{t('acceptTerms')} <Link to="/terms" className="font-semibold text-indigo-600">{t('termsOfService')}</Link> {t('and')} <Link to="/privacy" className="font-semibold text-indigo-600">{t('privacyPolicy')}</Link>.</span>
                            </label>
                            <Button type="submit" variant="accent" className="w-full gap-2" disabled={isLoading}>
                                {isLoading ? t('creating') : t('register')}
                                <ArrowRight size={16} />
                            </Button>
                        </div>
                    </form>

                    {message.text && <div className={`mt-4 rounded-2xl px-3 py-3 text-sm ${message.type === 'error' ? 'border border-rose-200 bg-rose-50 text-rose-600' : message.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-600' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}>{message.text}</div>}

                    <p className="mt-4 text-xs leading-5 text-slate-500">{t('registrationPendingHint')}</p>

                    <div className="mt-6 text-sm text-slate-600">
                        {t('hasAccount')}{' '}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">{t('loginNow')}</Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Register;
