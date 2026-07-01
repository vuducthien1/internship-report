import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('mt-1 text-sm text-slate-600', className)} {...props}>
      {children}
    </p>
  );
}
