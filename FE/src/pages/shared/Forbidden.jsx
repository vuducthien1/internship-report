import { ArrowLeft, Home, ShieldX } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getRoleHome } from '../../utils/roleRoutes';

const Forbidden = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const homePath = user ? getRoleHome(user.role) : '/';

    return (
        <main className="app-theme-shell flex min-h-screen items-center justify-center px-4 py-10">
            <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/95 p-8 text-center shadow-lg sm:p-12">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <ShieldX size={42} aria-hidden="true" />
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.35em] text-rose-600">
                    403
                </p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                    {t('forbiddenTitle')}
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-slate-600">
                    {t('forbiddenMessage')}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                    {t('attemptedPath')}: <code className="rounded bg-slate-100 px-2 py-1">{location.pathname}</code>
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link to={homePath} className="btn btn-primary">
                        <Home size={17} />
                        {t('returnToMyArea')}
                    </Link>
                    <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                        <ArrowLeft size={17} />
                        {t('goBack')}
                    </button>
                </div>
            </section>
        </main>
    );
};

export default Forbidden;
