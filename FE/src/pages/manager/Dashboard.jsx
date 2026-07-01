import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BriefcaseBusiness, ClipboardCheck, FileClock, MessageSquareWarning, Siren } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { getManagerDashboardApi } from '../../services/managerService';

const ManagerDashboard = () => {
    const { language } = useLanguage();
    const vi = language === 'vi';
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const load = useCallback(async () => { const result = await getManagerDashboardApi(); if (result.success) setData(result.data); else setError(result.message); }, []);
    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const cards = data ? [
        [vi ? 'Dự án đang triển khai' : 'Active projects', data.projects.ongoing, BriefcaseBusiness, 'text-indigo-600'],
        [vi ? 'Công việc đang mở' : 'Active tasks', data.tasks.active, ClipboardCheck, 'text-sky-600'],
        [vi ? 'Công việc quá hạn' : 'Overdue tasks', data.tasks.overdue, AlertTriangle, 'text-rose-600'],
        [vi ? 'Báo cáo chờ duyệt' : 'Reports pending', data.pending_reports, FileClock, 'text-amber-600'],
        [vi ? 'Yêu cầu chờ xử lý' : 'Requests pending', data.pending_requests, MessageSquareWarning, 'text-violet-600'],
        [vi ? 'Sự cố khẩn/cao' : 'Urgent incidents', data.urgent_incidents, Siren, 'text-orange-600'],
    ] : [];

    return <div className="space-y-6">
        <PageHeader title={vi ? 'Trung tâm điều hành dự án' : 'Project operations center'} subtitle={vi ? 'Các quyết định và cảnh báo cần xử lý trong ngày.' : 'Today’s decisions, approvals and field alerts.'} icon="dashboard" />
        {error && <div className="alert alert-error">{error}</div>}
        {!data ? <div className="rounded-3xl bg-white p-10 text-center text-slate-500">{vi ? 'Đang tải...' : 'Loading...'}</div> : <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value,Icon,tone]) => <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className={tone} size={21} /></div><p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p></div>)}</div>
            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{vi ? 'Tiến độ dự án' : 'Project progress'}</h2><Link className="text-sm font-semibold text-indigo-600" to="/manager/projects">{vi ? 'Xem dự án' : 'View projects'}</Link></div><div className="space-y-4">{data.project_progress.length ? data.project_progress.map((project) => <Link to={`/manager/projects/${project.id}`} key={project.id} className="block rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-semibold text-slate-900">{project.name}</p><span className="text-sm font-semibold text-indigo-600">{project.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${project.progress}%` }} /></div><p className="mt-2 text-xs text-slate-500">{Number(project.task_completed || 0)}/{Number(project.task_total || 0)} {vi ? 'công việc hoàn thành' : 'tasks completed'}</p></Link>) : <p className="py-8 text-center text-slate-500">{vi ? 'Chưa có dự án.' : 'No projects.'}</p>}</div></section>
                <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white"><h2 className="text-lg font-semibold text-white">{vi ? 'Cần xử lý ngay' : 'Action required'}</h2><div className="mt-5 grid gap-3"><Link className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950" to="/manager/assignments">{vi ? 'Nhiệm vụ mới từ Admin' : 'Assignments from Admin'}</Link><Link className="rounded-2xl border border-white/20 px-4 py-3 font-semibold text-white" to="/manager/reports">{vi ? `Duyệt báo cáo (${data.pending_reports})` : `Review reports (${data.pending_reports})`}</Link><Link className="rounded-2xl border border-white/20 px-4 py-3 font-semibold text-white" to="/manager/requests">{vi ? `Xử lý yêu cầu (${data.pending_requests})` : `Review requests (${data.pending_requests})`}</Link><Link className="rounded-2xl border border-white/20 px-4 py-3 font-semibold text-white" to="/manager/incidents">{vi ? `Sự cố đang mở (${data.open_incidents})` : `Open incidents (${data.open_incidents})`}</Link></div></section>
            </div>
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{vi ? 'Công việc quá hạn' : 'Overdue tasks'}</h2><Link className="text-sm font-semibold text-indigo-600" to="/manager/tasks">{vi ? 'Quản lý giao việc' : 'Manage tasks'}</Link></div><div className="grid gap-3 md:grid-cols-2">{data.overdue_tasks.length ? data.overdue_tasks.map((task) => <div key={task.id} className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><p className="font-semibold text-slate-900">{task.title}</p><p className="mt-1 text-sm text-slate-600">{task.project_name} · {task.engineer_name}</p><p className="mt-2 text-xs font-semibold text-rose-700">{new Date(task.due_date).toLocaleDateString(vi ? 'vi-VN' : 'en-US')}</p></div>) : <p className="col-span-2 py-6 text-center text-slate-500">{vi ? 'Không có công việc quá hạn.' : 'No overdue tasks.'}</p>}</div></section>
        </>}
    </div>;
};

export default ManagerDashboard;
