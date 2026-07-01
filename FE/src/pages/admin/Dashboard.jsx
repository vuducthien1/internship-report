import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BriefcaseBusiness,
    ClipboardCheck,
    Clock3,
    FileCheck2,
    FolderKanban,
    ListChecks,
    Plus,
    ShieldCheck,
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getProjectsApi } from '../../services/projectService';
import { getReportsApi } from '../../services/reportService';
import { getTasksApi } from '../../services/taskService';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();
    const { user } = useAuth();

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            const [projectData, taskData, reportData] = await Promise.all([
                getProjectsApi(),
                getTasksApi(),
                getReportsApi(),
            ]);

            if (projectData.success) setProjects(projectData.data);
            if (taskData.success) setTasks(taskData.data);
            if (reportData.success) setReports(reportData.data);

            const failures = [projectData, taskData, reportData]
                .filter((result) => !result.success)
                .map((result) => result.message)
                .filter(Boolean);
            setError(failures.join(' · '));
            setLoading(false);
        };

        fetchDashboard();
    }, []);

    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const ongoingProjects = projects.filter((project) => project.status === 'ongoing').length;
    const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
    const reportCounts = {
        pending: reports.filter((report) => report.approval_status === 'pending').length,
        approved: reports.filter((report) => report.approval_status === 'approved').length,
        rejected: reports.filter((report) => report.approval_status === 'rejected').length,
    };
    const recentProjects = [...projects]
        .sort((first, second) => new Date(second.start_date || 0) - new Date(first.start_date || 0))
        .slice(0, 5);

    const statusLabel = (status) => ({
        planning: t('planning'),
        ongoing: t('statusOngoing'),
        completed: t('statusCompleted'),
    })[status] || status;

    const statusClass = (status) => ({
        planning: 'badge-warning',
        ongoing: 'badge-info',
        completed: 'badge-success',
    })[status] || 'badge-info';

    const recentProjectColumns = [
        {
            key: 'name',
            label: t('projectName'),
            render: (project) => <span className="font-semibold text-slate-900">{project.name}</span>,
        },
        { key: 'location', label: t('location') },
        { key: 'manager_name', label: t('manager') },
        {
            key: 'status',
            label: t('status'),
            value: (project) => statusLabel(project.status),
            render: (project) => <span className={`badge ${statusClass(project.status)}`}>{statusLabel(project.status)}</span>,
        },
        {
            key: 'start_date',
            label: t('startDate'),
            sortValue: (project) => new Date(project.start_date || 0).getTime(),
            render: (project) => project.start_date
                ? new Date(project.start_date).toLocaleDateString(locale)
                : '—',
        },
    ];

    const stats = [
        { icon: FolderKanban, label: t('statsProjects'), value: projects.length, to: '/admin/projects', color: 'text-indigo-600' },
        { icon: Clock3, label: t('projectsOngoing'), value: ongoingProjects, to: '/admin/projects?view=manage', color: 'text-sky-600' },
        { icon: ClipboardCheck, label: t('totalTasks'), value: tasks.length, to: '/admin/tasks?view=manage', color: 'text-violet-600' },
        { icon: ListChecks, label: t('tasksInProgress'), value: inProgressTasks, to: '/admin/tasks?view=manage', color: 'text-blue-600' },
        { icon: FileCheck2, label: t('statsReports'), value: reports.length, to: '/admin/reports', color: 'text-emerald-600' },
        { icon: ShieldCheck, label: t('reportsAwaitingReview'), value: reportCounts.pending, to: '/admin/reports', color: 'text-amber-600' },
    ];

    const reportBreakdown = [
        { label: t('approvalPending'), value: reportCounts.pending, bar: 'bg-amber-500', text: 'text-amber-600' },
        { label: t('approvalApproved'), value: reportCounts.approved, bar: 'bg-emerald-500', text: 'text-emerald-600' },
        { label: t('approvalRejected'), value: reportCounts.rejected, bar: 'bg-rose-500', text: 'text-rose-600' },
    ];

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-6 text-white shadow-xl shadow-indigo-950/15 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">{t('dashboard')}</p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            {t('dashboardGreeting')}, {user?.fullname || user?.username}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">{t('dashboardSubtitle')}</p>
                    </div>
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">{t('quickActions')}</p>
                        <div className="flex flex-wrap gap-2">
                            <Link to="/admin/projects?view=create" className="dashboard-primary-action inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5">
                                <Plus size={17} /> {t('createProjectQuick')}
                            </Link>
                            <Link to="/admin/tasks?view=assign" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                                <ClipboardCheck size={17} /> {t('assignTask')}
                            </Link>
                            <Link to="/admin/manager-assignments" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                                <BriefcaseBusiness size={17} /> {language === 'vi' ? 'Giao việc Manager' : 'Assign Manager'}
                            </Link>
                            <Link to="/admin/reports" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                                <FileCheck2 size={17} /> {t('reviewReportsQuick')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {error && <div className="alert alert-error">{t('error')}: {error}</div>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.label} to={stat.to} className="group rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                                    <Icon size={21} className={stat.color} />
                                </div>
                                <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
                            </div>
                            <p className="mt-5 text-3xl font-bold text-slate-900">{loading ? '—' : stat.value}</p>
                            <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
                        </Link>
                    );
                })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-4">
                    <div className="flex items-end justify-between gap-4 px-1">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t('projects')}</p>
                            <h2 className="mt-1 text-xl font-bold text-slate-900">{t('recentProjects')}</h2>
                        </div>
                        <Link to="/admin/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            {t('viewAll')} <ArrowRight size={16} />
                        </Link>
                    </div>
                    <DataTable
                        columns={recentProjectColumns}
                        data={recentProjects}
                        loading={loading}
                        emptyText={t('noProjects')}
                        initialPageSize={5}
                        pageSizeOptions={[5]}
                        searchable={false}
                        showPageSize={false}
                        showPagination={false}
                    />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-md shadow-slate-200/40">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t('reports')}</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-900">{t('reportOverview')}</h2>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
                            <p className="text-2xl font-bold text-amber-600">{loading ? '—' : reportCounts.pending}</p>
                            <p className="text-[11px] font-semibold text-slate-600">{t('attentionRequired')}</p>
                        </div>
                    </div>

                    <div className="mt-7 space-y-5">
                        {reportBreakdown.map((item) => {
                            const percentage = reports.length ? Math.round((item.value / reports.length) * 100) : 0;
                            return (
                                <div key={item.label}>
                                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                        <span className="font-medium text-slate-600">{item.label}</span>
                                        <span className={`font-bold ${item.text}`}>{loading ? '—' : item.value}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Link to="/admin/reports" className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                        {t('reviewReportsQuick')} <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
