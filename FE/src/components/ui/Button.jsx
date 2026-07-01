import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  accent: 'bg-indigo-600 text-white hover:bg-indigo-700',
};

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10',
};

const Button = forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn('inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60', variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };
