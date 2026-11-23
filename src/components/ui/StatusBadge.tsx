import React from 'react';

export interface StatusBadgeProps {
  label: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  icon?: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  showDot = false,
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-blue-50 text-brand-primary border-blue-100',
    danger: 'bg-red-50 text-status-danger border-red-100',
    warning: 'bg-amber-50 text-status-warning border-amber-100',
    success: 'bg-green-50 text-status-success border-green-100',
    info: 'bg-sky-50 text-status-info border-sky-100',
    neutral: 'bg-surface-subtle text-content-secondary border-edge',
  };

  const dotClasses = {
    primary: 'bg-brand-primary',
    danger: 'bg-status-danger',
    warning: 'bg-status-warning',
    success: 'bg-status-success',
    info: 'bg-status-info',
    neutral: 'bg-content-subtle',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClasses[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
