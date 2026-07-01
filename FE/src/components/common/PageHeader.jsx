import Logo from './Logo';

const PageHeader = ({ title, subtitle, icon, action, useLogo = false }) => (
    <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-sm shadow-slate-200/60 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
        <div>
            <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {useLogo ? <Logo size={22} /> : icon && <span>{icon}</span>}
                <span>{title}</span>
            </div>
            {subtitle && <p className="max-w-2xl text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
);

export default PageHeader;
