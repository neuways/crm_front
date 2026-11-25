import React, { useState } from 'react';
import {
  Grid3X3,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Button } from '../../../components/ui/Button.js';
import { LeadQualificationMatrix, NewLeadItem } from '../types/dashboard.types.js';
import { QualifyLeadModal } from './QualifyLeadModal.js';
import {
  getFollowUpOutcomeMeta,
  getWorkflowStageMeta,
} from '../../../utils/followUpOutcome.js';

export interface LeadQualificationTableProps {
  matrix: LeadQualificationMatrix;
  isDemoMode?: boolean;
  activeLeads?: NewLeadItem[];
  onQualificationSaved?: () => void;
}

export const LeadQualificationTable: React.FC<LeadQualificationTableProps> = ({
  matrix,
  isDemoMode = false,
  activeLeads = [],
  onQualificationSaved = () => {},
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<NewLeadItem | null>(null);
  const [showScoredList, setShowScoredList] = useState<boolean>(true);

  const isPopulated = Boolean(
    isDemoMode ||
      (matrix.isPopulated &&
        (matrix.hotRow.values.some((v) => v > 0) ||
          matrix.possRow.values.some((v) => v > 0)))
  );

  const totalScored =
    matrix.scoredLeadsCount ??
    (matrix.hotRow.values.reduce((a, b) => a + b, 0) +
      matrix.possRow.values.reduce((a, b) => a + b, 0));

  const totalActive = matrix.totalActiveLeads ?? activeLeads.length;

  const handleOpenQualify = (lead?: NewLeadItem) => {
    setSelectedLead(lead || null);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="mb-6" noPadding>
        {/* Header */}
        <div className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 text-brand-primary rounded-md shrink-0">
                <Grid3X3 className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-content-primary">
                {matrix.title}
              </h2>
              {isPopulated && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-primary border border-blue-200">
                  {totalScored} of {totalActive || totalScored} Scored ({matrix.scoredPercentage ?? (totalActive > 0 ? Math.round((totalScored / totalActive) * 100) : 100)}%)
                </span>
              )}
            </div>
            <p className="text-xs text-content-muted mt-1 pl-8">
              {matrix.subtitle}
            </p>
          </div>

          {/* Controls: Legend & Qualify Button */}
          <div className="flex items-center gap-4 text-xs font-medium text-content-secondary pl-8 sm:pl-0">
            {isPopulated && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-status-danger shrink-0" aria-hidden="true" />
                  <span>Hot</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-content-secondary shrink-0" aria-hidden="true" />
                  <span>Poss.</span>
                </div>
              </div>
            )}

            {!isDemoMode && activeLeads.length > 0 && (
              <Button
                size="sm"
                variant={isPopulated ? 'outline' : 'primary'}
                icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                onClick={() => handleOpenQualify()}
              >
                Qualify Lead
              </Button>
            )}
          </div>
        </div>

        {!isPopulated ? (
          <div className="p-8 text-center bg-surface-subtle/30">
            <div className="max-w-md mx-auto space-y-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-primary border border-blue-200">
                Pipeline Unpopulated
              </span>
              <h3 className="text-sm font-bold text-content-primary">
                Lead Readiness Scoring Awaiting Configuration
              </h3>
              <p className="text-xs text-content-muted leading-relaxed">
                Qualification matrix percentages will dynamically populate as prospective buyer readiness scores are assigned during follow-up reviews. Currently 0 scored leads{totalActive > 0 ? ` (${totalActive} active pipeline leads awaiting qualification)` : ''}.
              </p>
              {!isDemoMode && activeLeads.length > 0 && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                    onClick={() => handleOpenQualify()}
                  >
                    Qualify Active Lead
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Matrix Table: Columns 10%, 20%, 50%, 70%, 80%, 100% */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                    <th scope="col" className="py-3.5 pl-6 pr-3 min-w-[140px]">
                      Readiness
                    </th>
                    {matrix.percentages.map((pct) => (
                      <th
                        key={pct}
                        scope="col"
                        className="py-3.5 px-3 text-center min-w-[75px]"
                      >
                        {pct}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle">
                  {/* Row 1: Hot */}
                  <tr className="hover:bg-surface-table-hover transition-colors duration-100">
                    <td className="py-3.5 pl-6 pr-3 font-semibold text-content-primary">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-status-danger shrink-0" />
                        <span>Hot</span>
                      </div>
                    </td>
                    {matrix.hotRow.values.map((val, idx) => {
                      const isHundredPercent = idx === 5; // 100% column
                      return (
                        <td key={idx} className="py-3 px-2 text-center">
                          <span
                            className={`inline-block w-11 py-1 rounded font-bold text-xs ${
                              isHundredPercent
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-status-danger border border-red-100'
                            }`}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2: Poss. */}
                  <tr className="hover:bg-surface-table-hover transition-colors duration-100">
                    <td className="py-3.5 pl-6 pr-3 font-semibold text-content-primary">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-content-secondary shrink-0" />
                        <span>Poss.</span>
                      </div>
                    </td>
                    {matrix.possRow.values.map((val, idx) => (
                      <td key={idx} className="py-3 px-2 text-center">
                        <span className="inline-block w-11 py-1 rounded font-bold text-xs bg-slate-100 text-content-primary border border-slate-200">
                          {val}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scored Prospects Breakdown Panel */}
            {matrix.leads && matrix.leads.length > 0 && (
              <div className="border-t border-edge bg-slate-50/50">
                <div
                  className="px-6 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                  onClick={() => setShowScoredList(!showScoredList)}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-content-secondary">
                    <UserCheck className="h-3.5 w-3.5 text-brand-primary" />
                    <span>Qualified Active Prospects ({matrix.leads.length})</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-content-muted flex items-center gap-1 hover:text-content-primary"
                  >
                    <span>{showScoredList ? 'Hide details' : 'Show details'}</span>
                    {showScoredList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {showScoredList && (
                  <div className="px-6 pb-4 pt-1 divide-y divide-edge">
                    {matrix.leads.map((l) => {
                      const matchedLeadItem = activeLeads.find((al) => al.id === l.id);
                      const stageMeta = getWorkflowStageMeta(l.currentStage);
                      const outcomeMeta = getFollowUpOutcomeMeta(matchedLeadItem?.lastFollowUpOutcome);
                      return (
                        <div key={l.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-content-primary">{l.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  l.priority === 'HOT'
                                    ? 'bg-red-50 text-status-danger border border-red-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {l.priority === 'HOT' ? 'Hot' : 'Poss.'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${stageMeta.cls}`}>
                                {stageMeta.label}
                              </span>
                              {outcomeMeta && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${outcomeMeta.badgeCls}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${outcomeMeta.dotCls}`} />
                                  {outcomeMeta.label}
                                </span>
                              )}
                            </div>
                            {l.notes && (
                              <p className="text-[11px] text-content-muted mt-0.5 line-clamp-1 italic">
                                "{l.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                l.scoreLabel === '100%'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-50 text-brand-primary border border-blue-200'
                              }`}
                            >
                              {l.scoreLabel} Readiness ({l.calculatedScore}/100 pts)
                            </span>
                            {!isDemoMode && (
                              <button
                                type="button"
                                onClick={() => handleOpenQualify(matchedLeadItem || ({ id: l.id, name: l.name } as any))}
                                className="text-brand-primary hover:underline font-semibold text-xs"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Qualify Lead Modal */}
      <QualifyLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialLead={selectedLead}
        activeLeads={activeLeads}
        onQualificationSaved={() => {
          onQualificationSaved();
        }}
      />
    </>
  );
};
