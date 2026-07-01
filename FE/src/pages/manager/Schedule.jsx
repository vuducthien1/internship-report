import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { getManagerDashboardApi } from '../../services/managerService';
import { getTasksApi } from '../../services/taskService';

const Schedule = () => {
    const { language } = useLanguage(); const vi = language === 'vi';
    const [tasks, setTasks] = useState([]); const [workload, setWorkload] = useState([]); const [error, setError] = useState('');
    const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    useEffect(() => { Promise.all([getTasksApi(), getManagerDashboardApi()]).then(([taskResult,dashboardResult]) => { if (taskResult.success) setTasks(taskResult.data); else setError(taskResult.message); if (dashboardResult.success) setWorkload(dashboardResult.data.workload); }); }, []);
    const days = useMemo(() => { const y=cursor.getFullYear(), m=cursor.getMonth(), offset=(new Date(y,m,1).getDay()+6)%7, total=new Date(y,m+1,0).getDate(); return [...Array(offset).fill(null),...Array.from({length:total},(_,i)=>i+1)]; }, [cursor]);
    const tasksOn = (day) => tasks.filter((task) => { if (!task.due_date || !day) return false; const d=new Date(task.due_date); return d.getFullYear()===cursor.getFullYear() && d.getMonth()===cursor.getMonth() && d.getDate()===day; });
    const loadClass = (active) => Number(active)>=8 ? 'badge-danger' : Number(active)>=5 ? 'badge-warning' : 'badge-success';
    const columns = [
        { key:'fullname', label:vi?'Kỹ sư':'Engineer', cellClassName:'font-semibold text-slate-900' },
        { key:'employee_code', label:vi?'Mã nhân viên':'Employee code' },
        { key:'active', label:vi?'Việc đang mở':'Active tasks', render:(r)=><span className={`badge ${loadClass(r.active)}`}>{r.active}</span> },
        { key:'urgent', label:vi?'Khẩn cấp':'Urgent', render:(r)=><span className="font-semibold text-orange-600">{Number(r.urgent||0)}</span> },
        { key:'overdue', label:vi?'Quá hạn':'Overdue', render:(r)=><span className="font-semibold text-rose-600">{Number(r.overdue||0)}</span> },
        { id:'capacity', label:vi?'Đánh giá tải':'Capacity', value:(r)=>Number(r.active)>=8?'overloaded':Number(r.active)>=5?'busy':'available', render:(r)=>Number(r.active)>=8?(vi?'Quá tải':'Overloaded'):Number(r.active)>=5?(vi?'Bận':'Busy'):(vi?'Có thể nhận việc':'Available') },
    ];
    return <div className="space-y-6"><PageHeader title={vi?'Lịch & tải công việc':'Schedule & workload'} subtitle={vi?'Cân đối nguồn lực và theo dõi toàn bộ hạn công việc theo tháng.':'Balance capacity and track project deadlines.'} icon="calendar" />{error&&<div className="alert alert-error">{error}</div>}
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-5"><button className="btn btn-outline btn-sm" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}><ChevronLeft size={17}/></button><h2 className="text-lg font-semibold capitalize text-slate-900">{cursor.toLocaleDateString(vi?'vi-VN':'en-US',{month:'long',year:'numeric'})}</h2><button className="btn btn-outline btn-sm" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}><ChevronRight size={17}/></button></div><div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase text-slate-500">{(vi?['T2','T3','T4','T5','T6','T7','CN']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map(d=><div className="p-3" key={d}>{d}</div>)}</div><div className="grid grid-cols-7">{days.map((day,index)=><div key={`${day}-${index}`} className="min-h-32 border-b border-r border-slate-100 p-2">{day&&<><span className="text-sm font-semibold text-slate-600">{day}</span><div className="mt-2 space-y-1">{tasksOn(day).slice(0,3).map(task=><div title={`${task.title} — ${task.engineer_name}`} key={task.id} className={`truncate rounded-lg px-2 py-1 text-xs font-medium ${task.status==='completed'?'bg-emerald-100 text-emerald-700':new Date(task.due_date)<new Date()?'bg-rose-100 text-rose-700':'bg-indigo-100 text-indigo-700'}`}>{task.title}</div>)}{tasksOn(day).length>3&&<p className="text-xs text-slate-500">+{tasksOn(day).length-3}</p>}</div></>}</div>)}</div></section>
        <section><h2 className="mb-4 text-lg font-semibold text-slate-900">{vi?'Tải công việc theo kỹ sư':'Engineer workload'}</h2><DataTable columns={columns} data={workload} emptyText={vi?'Chưa có kỹ sư trong dự án.':'No assigned engineers.'}/></section>
    </div>;
};
export default Schedule;
