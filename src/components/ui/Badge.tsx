import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'warning' | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-white/80 backdrop-blur-sm text-slate-700 border border-black/5',
  warning:
    'bg-amber-500/90 text-white backdrop-blur-sm',
  danger:
    'bg-white/90 text-slate-800 font-semibold',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
