import React from 'react';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { StatusBadge } from '../../../components/ui/StatusBadge.js';
import { PendingFollowUpData, FutureFollowUpData } from '../types/dashboard.types.js';

export interface PendingFollowUpTableProps {
  data: PendingFollowUpData;
}

export const PendingFollowUpTable: React.FC<PendingFollowUpTableProps> = ({ data }) => {
  return (
    <Card className="mb-6" noPadding>
      {/* Header */}
      <div className="p-4 sm:p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="p-1.5 bg-blue-50 text-brand-primary rounded-md shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-content-primary">
              {data.title}
            </h2>
            <StatusBadge
              label={data.badgeText}
              variant="danger"
              showDot
            />
          </div>
          <p className="text-xs text-content-muted mt-1 pl-0 sm:pl-8">
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* Table: Stage, Contacted, Detail Shared, Meeting, Site Visit */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
              <th scope="col" className="py-3.5 pl-6 pr-3 min-w-[160px]">
                Stage
              </th>
              <th scope="col" className="py-3.5 px-4 text-center min-w-[120px]">
                Contacted
              </th>
              <th scope="col" className="py-3.5 px-4 text-center min-w-[140px]">
                Detail Shared
              </th>
              <th scope="col" className="py-3.5 px-4 text-center min-w-[120px]">
                Meeting
              </th>
              <th scope="col" className="py-3.5 pl-4 pr-6 text-center min-w-[120px]">
                Site Visit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-subtle">
            {data.stages.map((stage) => (
              <tr
                key={stage.stage}
                className="hover:bg-surface-table-hover transition-colors duration-100"
              >
                {/* Stage */}
                <td className="py-3.5 pl-6 pr-3 font-semibold text-content-primary">
                  {stage.stage}
                </td>

                {/* Contacted */}
                <td className="py-3.5 px-4 text-center font-bold text-content-primary">
                  {stage.contacted === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.contacted
                  )}
                </td>

                {/* Detail Shared */}
                <td className="py-3.5 px-4 text-center font-bold text-content-primary">
                  {stage.detailShared === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.detailShared
                  )}
                </td>

                {/* Meeting */}
                <td className="py-3.5 px-4 text-center font-bold text-content-primary">
                  {stage.meeting === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.meeting ?? 0
                  )}
                </td>

                {/* Site Visit */}
                <td className="py-3.5 pl-4 pr-6 text-center font-bold text-content-primary">
                  {stage.siteVisit === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.siteVisit ?? 0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export interface FutureFollowUpTableProps {
  data: FutureFollowUpData;
}

export const FutureFollowUpTable: React.FC<FutureFollowUpTableProps> = ({ data }) => {
  return (
    <Card className="mb-6" noPadding>
      {/* Header */}
      <div className="p-4 sm:p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="p-1.5 bg-emerald-50 text-status-success rounded-md shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-content-primary">
              {data.title}
            </h2>
            <StatusBadge
              label={data.badgeText}
              variant="neutral"
              icon={<Clock className="h-3 w-3 text-content-muted" />}
            />
          </div>
          <p className="text-xs text-content-muted mt-1 pl-0 sm:pl-8">
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* Table: Stage, Contacted, Detail Shared, Meeting, Site Visit */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
              <th scope="col" className="py-3.5 pl-6 pr-3 min-w-[160px]">
                Stage
              </th>
              <th scope="col" className="py-3.5 px-4 text-center min-w-[120px]">
                Contacted
              </th>
              <th scope="col" className="py-3.5 px-4 text-center min-w-[140px]">
                Detail Shared
              </th>
              <th scope="col" className="py-3.5 px-4 text-center min-w-[120px]">
                Meeting
              </th>
              <th scope="col" className="py-3.5 pl-4 pr-6 text-center min-w-[120px]">
                Site Visit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-subtle">
            {data.stages.map((stage) => (
              <tr
                key={stage.stage}
                className="hover:bg-surface-table-hover transition-colors duration-100"
              >
                {/* Stage */}
                <td className="py-3.5 pl-6 pr-3 font-semibold text-content-primary">
                  {stage.stage}
                </td>

                {/* Contacted */}
                <td className="py-3.5 px-4 text-center font-bold text-content-primary">
                  {stage.contacted === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.contacted
                  )}
                </td>

                {/* Detail Shared */}
                <td className="py-3.5 px-4 text-center font-bold text-content-primary">
                  {stage.detailShared === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.detailShared
                  )}
                </td>

                {/* Meeting */}
                <td className="py-3.5 px-4 text-center font-bold text-content-primary">
                  {stage.meeting === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.meeting ?? 0
                  )}
                </td>

                {/* Site Visit */}
                <td className="py-3.5 pl-4 pr-6 text-center font-bold text-content-primary">
                  {stage.siteVisit === 'N/A' ? (
                    <span className="text-content-muted font-medium text-xs">N/A</span>
                  ) : (
                    stage.siteVisit ?? 0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
