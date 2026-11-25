import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from './Card.js';

export interface MetricCardProps {
  title: string;
  subtitle: string;
  value: number | string;
  badgeText: string;
  badgeType?: 'positive' | 'warning' | 'info' | 'neutral';
  icon: React.ReactNode;
  iconBgColor?: string;
  isMockData?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  subtitle,
  value,
  badgeText,
  badgeType = 'neutral',
  icon,
  iconBgColor = 'bg-blue-50 text-brand-primary',
  isMockData = true,
  onClick,
  ariaLabel,
}) => {
  const badgeClasses = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isInteractive = typeof onClick === 'function';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? ariaLabel || `${title}: ${value}` : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={`relative flex flex-col justify-between transition-all duration-200 ${
        isInteractive
          ? 'group cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary'
          : 'hover:shadow-md'
      }`}
    >
      {/* Top Header: Subtitle & Icon */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold tracking-wider uppercase text-content-muted">
          {subtitle}
        </span>
        <div className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {/* Main Metric Value & Title */}
      <div className="mt-1">
        <div className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
          {value}
        </div>
        <p className="text-sm font-medium text-content-secondary mt-0.5">
          {title}
        </p>
      </div>

      {/* Bottom Footer: Badge, Mock Indicator & Interactive Arrow */}
      <div className="mt-4 pt-3 border-t border-edge-subtle flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[badgeType]}`}
        >
          {badgeText}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isMockData && (
            <span
              className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded"
              title="Visual demonstration / mock dataset"
            >
              DEMO
            </span>
          )}
          {isInteractive && (
            <ArrowUpRight
              className="w-4 h-4 text-content-subtle opacity-60 group-hover:opacity-100 group-hover:text-brand-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </Card>
  );
};
