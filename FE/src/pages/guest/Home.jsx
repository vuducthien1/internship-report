import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    ClipboardList,
    FileCheck2,
    HardHat,
    Mail,
    MapPin,
    Mic,
    Phone,
    ShieldCheck,
    Sparkles,
    UserCog,
} from 'lucide-react';
import Logo from '../../components/common/Logo';
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getPublicStatsApi, submitContactApi } from '../../services/publicService';

const Home = () => {
    const { t } = useLanguage();
    const { isAuthenticated, homePath } = useAuth();
    const [stats, setStats] = useState({ projects: 0, engineers: 0, reports: 0, completed_tasks: 0 });
    const [contact, setContact] = useState({ fullname: '', email: '', phone: '', company: '', message: '' });
    const [contactState, setContactState] = useState({ loading: false, success: '', error: '' });
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'support@vdcms.vn';
    const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '028 7300 6868';
    const contactAddress = import.meta.env.VITE_CONTACT_ADDRESS || 'Thành phố Hồ Chí Minh, Việt Nam';

    useEffect(() => {
        getPublicStatsApi().then((data) => { if (data.success) setStats(data.data); });
    }, []);

    const features = [
        { icon: Mic, title: t('featureVoice'), desc: t('featureVoiceDesc') },
        { icon: BarChart3, title: t('featureProject'), desc: t('featureProjectDesc') },
        { icon: ClipboardList, title: t('featureTask'), desc: t('featureTaskDesc') },
        { icon: ShieldCheck, title: t('featureSecurity'), desc: t('featureSecurityDesc') },
    ];

    const statItems = [
        { number: stats.projects, label: t('statsProjects') },
        { number: stats.engineers, label: t('statsEngineers') },
        { number: stats.reports, label: t('statsReports') },
        { number: stats.completed_tasks, label: t('statsCompletedTasks') },
    ];

    const workflow = [
        { icon: UserCog, title: t('workflowAdminTitle'), desc: t('workflowAdminDesc') },
        { icon: BarChart3, title: t('workflowManagerTitle'), desc: t('workflowManagerDesc') },
        { icon: HardHat, title: t('workflowEngineerTitle'), desc: t('workflowEngineerDesc') },
        { icon: BadgeCheck, title: t('workflowApprovalTitle'), desc: t('workflowApprovalDesc') },
    ];

    const demos = [
        { icon: UserCog, role: t('roleAdmin'), title: t('demoAdminTitle'), items: [t('userManagement'), t('activityLogs'), t('reportOverview')] },
        { icon: BarChart3, role: t('roleManager'), title: t('demoManagerTitle'), items: [t('projects'), t('assignTasks'), t('reports')] },
        { icon: HardHat, role: t('roleEngineer'), title: t('demoEngineerTitle'), items: [t('myTasks'), t('voiceReport'), t('taskChecklist')] },
    ];

    const submitContact = async (event) => {
        event.preventDefault();
        setContactState({ loading: true, success: '', error: '' });
        const data = await submitContactApi(contact);
        if (data.success) {
            setContactState({ loading: false, success: data.message, error: '' });
            setContact({ fullname: '', email: '', phone: '', company: '', message: '' });
        } else {
            setContactState({ loading: false, success: '', error: data.message });
        }
    };

    return (
        <>
            <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20" id="about">
                <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-10 lg:p-12">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"><Sparkles size={16} />{t('tagline')}</div>
                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">{t('heroTitle')}</h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t('heroSubtitle')}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to={isAuthenticated ? homePath : '/register'} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
                            {isAuthenticated ? t('goToDashboard') : t('getStarted')} <ArrowRight size={16} />
                        </Link>
                        <a href="#workflow" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600">{t('howItWorks')}</a>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200/80 bg-slate-900 p-8 text-white shadow-[0_20px_80px_rgba(15,23,42,0.15)] sm:p-10">
                    <div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Logo size={30} /></div><div><p className="text-sm uppercase tracking-[0.3em] text-slate-400">VDCMS</p><h2 className="text-xl font-semibold">{t('appFullName')}</h2></div></div>
                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5"><div className="flex items-center gap-3 text-indigo-200"><Mic size={20} /><span className="text-sm font-medium">{t('voiceReport')}</span></div><p className="mt-3 text-sm leading-7 text-slate-300">{t('featureVoiceDesc')}</p></div>
                    <div className="mt-4 flex items-center gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-200"><ShieldCheck size={20} /><p className="text-sm font-medium">{t('featureSecurityDesc')}</p></div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="features">
                <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">{t('fields')}</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('features')}</h2><p className="mt-3 max-w-2xl text-slate-600">{t('featuresIntro')}</p></div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {features.map((feature) => { const Icon = feature.icon; return <Card key={feature.title} className="h-full"><CardHeader><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon size={24} /></div><CardTitle>{feature.title}</CardTitle><CardDescription>{feature.desc}</CardDescription></CardHeader></Card>; })}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="workflow">
                <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
                    <div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">{t('howItWorks')}</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{t('workflow')}</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">{t('workflowSubtitle')}</p></div>
                    <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {workflow.map((step, index) => { const Icon = step.icon; return <div key={step.title} className="relative rounded-2xl bg-slate-50 p-5"><span className="absolute right-4 top-3 text-4xl font-black text-slate-200">{index + 1}</span><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white"><Icon size={21} /></div><h3 className="mt-4 font-bold text-slate-900">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p></div>; })}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="demo">
                <div className="mb-8 text-center"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">{t('productDemo')}</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{t('demoByRole')}</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">{t('productDemoSubtitle')}</p></div>
                <div className="grid gap-6 lg:grid-cols-3">
                    {demos.map((demo) => { const Icon = demo.icon; return <div key={demo.role} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/40"><div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Icon size={22} /></div><div><p className="text-xs uppercase tracking-[0.18em] text-indigo-200">{demo.role}</p><h3 className="font-bold text-white">{demo.title}</h3></div></div></div><div className="space-y-3 p-5">{demo.items.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700"><FileCheck2 size={17} className="text-indigo-500" />{item}</div>)}</div></div>; })}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-4 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:grid-cols-2 xl:grid-cols-4 sm:p-8">
                    {statItems.map((stat) => <div key={stat.label} className="rounded-2xl bg-slate-50 p-4 text-center"><div className="text-3xl font-semibold text-slate-900">{stat.number}</div><div className="mt-1 text-sm text-slate-500">{stat.label}</div></div>)}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="contact">
                <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/40 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="bg-slate-900 p-6 text-white sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">{t('contact')}</p><h2 className="mt-3 text-3xl font-bold text-white">{t('contactTitle')}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{t('contactSubtitle')}</p><div className="mt-8 space-y-4 text-sm"><a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-slate-200"><Mail size={18} className="text-indigo-300" />{contactEmail}</a><a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-slate-200"><Phone size={18} className="text-indigo-300" />{contactPhone}</a><div className="flex items-center gap-3 text-slate-200"><MapPin size={18} className="text-indigo-300" />{contactAddress}</div></div></div>
                    <form className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8" onSubmit={submitContact}>
                        <input className="form-input" placeholder={t('fullname')} value={contact.fullname} onChange={(event) => setContact({ ...contact, fullname: event.target.value })} required />
                        <input className="form-input" type="email" placeholder={t('email')} value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} required />
                        <input className="form-input" placeholder={t('phone')} value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} />
                        <input className="form-input" placeholder={t('company')} value={contact.company} onChange={(event) => setContact({ ...contact, company: event.target.value })} />
                        <textarea className="form-textarea sm:col-span-2" rows={5} placeholder={t('contactMessage')} value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} required />
                        {contactState.success && <div className="alert alert-success sm:col-span-2">{contactState.success}</div>}
                        {contactState.error && <div className="alert alert-error sm:col-span-2">{contactState.error}</div>}
                        <button className="btn btn-primary sm:col-span-2" disabled={contactState.loading}>{contactState.loading ? t('processing') : t('sendContact')}</button>
                    </form>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-slate-900 to-indigo-900 p-8 text-center text-white shadow-[0_20px_80px_rgba(15,23,42,0.15)] sm:p-10"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Logo size={28} /></div><h2 className="text-3xl font-semibold">{t('ctaTitle')}</h2><p className="mx-auto mt-3 max-w-2xl text-slate-300">{t('ctaSubtitle')}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to={isAuthenticated ? homePath : '/register'} className="landing-light-action inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition">{isAuthenticated ? t('goToDashboard') : t('register')}</Link>{!isAuthenticated && <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">{t('login')}</Link>}</div></div>
            </section>
        </>
    );
};

export default Home;
