import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { getMyTasksApi } from '../../services/taskService';

const Calendar = () => {
    const { language } = useLanguage();
    const vi = language === 'vi';
    const [tasks, setTasks] = useState([]);
    const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [error, setError] = useState('');

    useEffect(() => {
        getMyTasksApi().then((result) => result.success ? setTasks(result.data) : setError(result.message));
    }, []);

    const days = useMemo(() => {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const firstMondayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const total = new Date(year, month + 1, 0).getDate();
        return [...Array(firstMondayIndex).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
    }, [cursor]);

    const tasksOn = (day) => tasks.filter((task) => {
        if (!task.due_date || !day) return false;
        const date = new Date(task.due_date);
        return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth() && date.getDate() === day;
    });

    return (
        <div className="space-y-6">
            <PageHeader title={vi ? 'Lịch công việc' : 'Task calendar'} subtitle={vi ? 'Theo dõi hạn hoàn thành theo tháng để chủ động tiến độ.' : 'Track monthly deadlines and stay ahead.'} icon="calendar" />
            {error && <div className="alert alert-error">{error}</div>}
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-5">
                    <button className="btn btn-outline btn-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
                    <h2 className="text-lg font-semibold capitalize text-slate-900">{cursor.toLocaleDateString(vi ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })}</h2>
                    <button className="btn btn-outline btn-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase text-slate-500">
                    {(vi ? ['T2','T3','T4','T5','T6','T7','CN'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map((d) => <div className="p-3" key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((day, index) => (
                        <div key={`${day}-${index}`} className="min-h-28 border-b border-r border-slate-100 p-2">
                            {day && <><span className="text-sm font-semibold text-slate-600">{day}</span><div className="mt-2 space-y-1">{tasksOn(day).map((task) => <div key={task.id} title={task.title} className={`truncate rounded-lg px-2 py-1 text-xs font-medium ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : new Date(task.due_date) < new Date() ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>{task.title}</div>)}</div></>}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Calendar;
