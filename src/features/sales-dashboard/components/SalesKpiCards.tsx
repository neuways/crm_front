import React from 'react';
import { Users, Clock, CalendarClock, Briefcase } from 'lucide-react';
import { MetricCard } from '../../../components/ui/MetricCard.js';
import { DashboardKpiMetric } from '../types/dashboard.types.js';

export interface SalesKpiCardsProps {
  metrics: DashboardKpiMetric[];
}

export const SalesKpiCards: React.FC<SalesKpiCardsProps> = ({ metrics }) => {
  const getIconConfig = (id: string) => {
    switch (id) {
      case 'kpi-daily-velocity':
        return {
          icon: <Users className="h-5 w-5" />,
          bgColor: 'bg-blue-50 text-brand-primary',
        };
      case 'kpi-action-pipeline':
        return {
          icon: <Clock className="h-5 w-5" />,
          bgColor: 'bg-amber-50 text-status-warning',
        };
      case 'kpi-calendar-bookings':
        return {
          icon: <CalendarClock className="h-5 w-5" />,
          bgColor: 'bg-purple-50 text-purple-600',
        };
      case 'kpi-portfolio-scope':
      default:
        return {
          icon: <Briefcase className="h-5 w-5" />,
          bgColor: 'bg-emerald-50 text-status-success',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => {
        const config = getIconConfig(metric.id);
        return (
          <MetricCard
            key={metric.id}
            title={metric.title}
            subtitle={metric.subtitle}
            value={metric.value}
            badgeText={metric.badgeText}
            badgeType={metric.badgeType}
            icon={config.icon}
            iconBgColor={config.bgColor}
            isMockData={metric.isMockData}
          />
        );
      })}
    </div>
  );
};
