import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, FileClock, Siren } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { getEngineerDashboardApi } from '../../services/taskService';

const Dashboard = () => {
    const { language } = useLanguage();
    const vi = language === 'vi';
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        const result = await getEngineerDashboardApi();
        if (result.success) setData(result.data);
        else setError(result.message);
    }, []);

    useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

    const cards = data ? [
        [vi ? 'Tổng công việc' : 'Total tasks', data.tasks.total, ClipboardList, 'text-indigo-600'],
        [vi ? 'Đang thực hiện' : 'In progress', data.tasks.in_progress, CalendarClock, 'text-sky-600'],
        [vi ? 'Đã hoàn thành' : 'Completed', data.tasks.completed, CheckCircle2, 'text-emerald-600'],
        [vi ? 'Quá hạn' : 'Overdue', data.tasks.overdue, AlertTriangle, 'text-rose-600'],
        [vi ? 'Báo cáo chờ duyệt' : 'Reports pending', data.pending_reports, FileClock, 'text-amber-600'],
        [vi ? 'Sự cố đang mở' : 'Open incidents', data.open_incidents, Siren, 'text-orange-600'],
    ] : [];

    return (
        <div className="space-y-6">
            <PageHeader title={vi ? 'Bảng điều khiển hiện trường' : 'Field dashboard'} subtitle={vi ? 'Việc cần ưu tiên và tình hình hiện trường của bạn trong một màn hình.' : 'Your priorities and field status in one place.'} icon="dashboard" />
            {error && <div className="alert alert-error">{error}</div>}
            {!data ? <div className="rounded-3xl bg-white p-10 text-center text-slate-500">{vi ? 'Đang tải...' : 'Loading...'}</div> : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {cards.map(([label, value, Icon, tone]) => (
                            <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className={tone} size={21} /></div>
                                <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{vi ? 'Công việc sắp đến hạn' : 'Upcoming tasks'}</h2><Link className="text-sm font-semibold text-indigo-600" to="/engineer/calendar">{vi ? 'Xem lịch' : 'View calendar'}</Link></div>
                            <div className="space-y-3">
                                {data.upcoming_tasks.length ? data.upcoming_tasks.map((task) => (
                                    <Link key={task.id} to="/engineer/tasks" className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 transition hover:bg-indigo-50">
                                        <div><p className="font-semibold text-slate-900">{task.title}</p><p className="mt-1 text-sm text-slate-500">{task.project_name}</p></div>
                                        <div className="text-right"><span className="badge badge-info">{task.priority}</span><p className="mt-2 text-xs text-slate-500">{task.due_date ? new Date(task.due_date).toLocaleDateString(vi ? 'vi-VN' : 'en-US') : '—'}</p></div>
                                    </Link>
                                )) : <p className="py-8 text-center text-slate-500">{vi ? 'Không có công việc sắp đến hạn.' : 'No upcoming tasks.'}</p>}
                            </div>
                        </section>
                        <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-sm">
                            <h2 className="text-lg font-semibold">{vi ? 'Thao tác hiện trường' : 'Field actions'}</h2>
                            <div className="mt-5 grid gap-3">
                                <Link className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950" to="/engineer/tasks">{vi ? 'Cập nhật công việc' : 'Update tasks'}</Link>
                                <Link className="rounded-2xl border border-white/20 px-4 py-3 font-semibold text-white" to="/engineer/requests">{vi ? `Yêu cầu đang chờ (${data.open_requests})` : `Pending requests (${data.open_requests})`}</Link>
                                <Link className="rounded-2xl border border-white/20 px-4 py-3 font-semibold text-white" to="/engineer/incidents">{vi ? 'Báo cáo sự cố an toàn' : 'Report a safety incident'}</Link>
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
