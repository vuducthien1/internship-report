import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Mail, Menu, Phone, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageToggle from '../common/LanguageToggle';
import Logo from '../common/Logo';
import ThemeToggle from '../common/ThemeToggle';

const GuestLayout = () => {
    const { t } = useLanguage();
    const { isAuthenticated, homePath } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isAuthPage = authPaths.includes(location.pathname);
    const isHome = location.pathname === '/';
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'support@vdcms.vn';
    const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '028 7300 6868';

    const homeLinks = [
        ['#about', t('about')],
        ['#features', t('features')],
        ['#workflow', t('workflow')],
        ['#demo', t('productDemo')],
        ['#contact', t('contact')],
    ];

    const closeMenu = () => setMobileOpen(false);

    return (
        <div className="app-theme-shell min-h-screen">
            <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
                    <Link to="/" className="flex min-w-0 items-center gap-3 text-slate-900" onClick={closeMenu}>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><Logo size={24} /></div>
                        <div className="min-w-0">
                            <p className="text-lg font-semibold">{t('appName')}</p>
                            <p className="hidden truncate text-sm text-slate-500 sm:block">{t('tagline')}</p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
                        {isHome && homeLinks.map(([href, label]) => <a key={href} href={href} className="transition hover:text-indigo-600">{label}</a>)}
                    </nav>

                    <div className="flex items-center gap-2">
                        <LanguageToggle compact />
                        <ThemeToggle compact />
                        {isAuthenticated ? (
                            <Link to={homePath} className="hidden rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm sm:inline-flex">{t('goToDashboard')}</Link>
                        ) : (
                            <>
                                <Link to="/login" className="hidden rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 md:inline-flex">{t('login')}</Link>
                                <Link to="/register" className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 sm:inline-flex">{t('register')}</Link>
                            </>
                        )}
                        <button type="button" className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={t('mobileMenu')}>
                            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
                        <nav className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold text-slate-700">
                            {isHome && homeLinks.map(([href, label]) => <a key={href} href={href} className="rounded-xl px-3 py-2.5 hover:bg-slate-100" onClick={closeMenu}>{label}</a>)}
                            <div className="my-2 border-t border-slate-200" />
                            {isAuthenticated ? (
                                <Link to={homePath} className="rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-white" onClick={closeMenu}>{t('goToDashboard')}</Link>
                            ) : (
                                <>
                                    <Link to="/login" className="rounded-xl px-3 py-2.5 hover:bg-slate-100" onClick={closeMenu}>{t('login')}</Link>
                                    <Link to="/register" className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-white" onClick={closeMenu}>{t('register')}</Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            <main className={isAuthPage || !isHome ? 'px-4 py-8 sm:px-6 lg:px-8' : ''}><Outlet /></main>

            {isHome && (
                <footer className="border-t border-slate-200/70 bg-white/70 backdrop-blur-xl">
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="grid gap-8 md:grid-cols-3">
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white"><Logo size={20} /></div>
                                    <h4 className="text-lg font-semibold text-slate-900">{t('appFullName')}</h4>
                                </div>
                                <p className="text-sm leading-7 text-slate-600">{t('footerAbout')}</p>
                            </div>
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('legal')}</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li><Link to="/terms" className="transition hover:text-indigo-600">{t('termsOfService')}</Link></li>
                                    <li><Link to="/privacy" className="transition hover:text-indigo-600">{t('privacyPolicy')}</Link></li>
                                    <li><Link to="/forgot-password" className="transition hover:text-indigo-600">{t('forgotPassword')}</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('contact')}</h4>
                                <ul className="space-y-3 text-sm text-slate-600">
                                    <li><a className="inline-flex items-center gap-2 hover:text-indigo-600" href={`mailto:${contactEmail}`}><Mail size={16} /> {contactEmail}</a></li>
                                    <li><a className="inline-flex items-center gap-2 hover:text-indigo-600" href={`tel:${contactPhone.replace(/\s/g, '')}`}><Phone size={16} /> {contactPhone}</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">{t('footerRights')}</div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default GuestLayout;
