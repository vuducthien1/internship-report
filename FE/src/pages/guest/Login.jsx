import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { loginApi } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getRoleHome } from '../../utils/roleRoutes';
import Logo from '../../components/common/Logo';
import { Button } from '../../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, user } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (isAuthenticated && user) {
            const from = location.state?.from || getRoleHome(user.role);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.state]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const data = await loginApi(username, password);

        if (data.success) {
            login(data.token, data.user);
            const from = location.state?.from || getRoleHome(data.user.role);
            navigate(from, { replace: true });
        } else {
            setMessage(data.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:flex-row">
            <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white sm:p-10 lg:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Logo size={32} />
                </div>
                <h2 className="mt-6 text-3xl font-semibold">{t('appFullName')}</h2>
                <p className="mt-3 max-w-md text-base leading-8 text-slate-300">{t('heroSubtitle')}</p>
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-slate-300">
                    <p className="font-semibold text-white">{t('tagline')}</p>
                    <p className="mt-2">{t('featureVoiceDesc')}</p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-10">
                <Card className="w-full max-w-md border-0 shadow-none bg-transparent p-0">
                    <CardHeader>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <LockKeyhole size={22} />
                        </div>
                        <CardTitle>{t('loginTitle')}</CardTitle>
                        <CardDescription>{t('tagline')}</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('username')}</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                <UserRound size={18} className="text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full border-0 bg-transparent text-sm outline-none"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('username')}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('password')}</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                <LockKeyhole size={18} className="text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full border-0 bg-transparent text-sm outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('password')}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                                    title={showPassword ? t('hidePassword') : t('showPassword')}
                                    onClick={() => setShowPassword((value) => !value)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="mt-2 flex justify-end">
                                <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">{t('forgotPassword')}</Link>
                            </div>
                        </div>
                        <Button type="submit" variant="accent" className="w-full gap-2" disabled={isLoading}>
                            {isLoading ? t('processing') : t('login')}
                            <ArrowRight size={16} />
                        </Button>
                    </form>

                    {message && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-600">{message}</div>}
                    {message.toLocaleLowerCase().includes('email') && <Link to="/verify-email" className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">{t('resendVerification')}</Link>}

                    <div className="mt-6 text-sm text-slate-600">
                        {t('noAccount')}{' '}
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">{t('registerNow')}</Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Login;
