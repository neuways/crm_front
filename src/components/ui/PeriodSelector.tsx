import React from 'react';
import { DashboardPeriod } from '../../features/sales-dashboard/types/dashboard.types.js';

export interface PeriodSelectorProps {
  selectedPeriod: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const options: Array<{ id: DashboardPeriod; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <div
      className="inline-flex items-center p-1 bg-surface-subtle border border-edge rounded-lg text-xs font-medium"
      role="group"
      aria-label="Select dashboard time period"
    >
      {options.map((opt) => {
        const isActive = selectedPeriod === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPeriodChange(opt.id)}
            className={`px-3 py-1.5 rounded-md transition-all duration-150 font-medium ${
              isActive
                ? 'bg-surface-card text-brand-primary font-semibold shadow-sm'
                : 'text-content-secondary hover:text-content-primary hover:bg-slate-200/50'
            }`}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
