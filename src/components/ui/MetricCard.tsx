import React from 'react';
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
}) => {
  const badgeClasses = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <Card className="relative hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
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

      {/* Bottom Footer: Badge & Mock Indicator */}
      <div className="mt-4 pt-3 border-t border-edge-subtle flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[badgeType]}`}
        >
          {badgeText}
        </span>
        {isMockData && (
          <span
            className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded"
            title="Visual demonstration / mock dataset"
          >
            DEMO
          </span>
        )}
      </div>
    </Card>
  );
};
