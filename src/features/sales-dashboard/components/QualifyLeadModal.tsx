import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid3X3,
  X,
  Check,
  AlertCircle,
  Loader2,
  IndianRupee,
  Clock,
  UserCheck,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import {
  BudgetStatus,
  PurchaseTimeline,
  DecisionMaker,
  RequirementClarity,
  LeadPriority,
  ReadinessPercentage,
} from '../../../types/enquiry.types.js';
import { NewLeadItem } from '../types/dashboard.types.js';

export interface QualifyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQualificationSaved: () => void;
  initialLead?: NewLeadItem | null;
  activeLeads?: NewLeadItem[];
}

export const QualifyLeadModal: React.FC<QualifyLeadModalProps> = ({
  isOpen,
  onClose,
  onQualificationSaved,
  initialLead,
  activeLeads = [],
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>('UNCONFIRMED');
  const [timeline, setTimeline] = useState<PurchaseTimeline>('ABOVE_90_DAYS');
  const [decisionMaker, setDecisionMaker] = useState<DecisionMaker>('INFLUENCER_ONLY');
  const [needClarity, setNeedClarity] = useState<RequirementClarity>('EXPLORATORY');
  const [priority, setPriority] = useState<LeadPriority>('POSSIBLE');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial lead when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      const targetId = initialLead?.id || activeLeads[0]?.id || '';
      setSelectedLeadId(targetId);

      // Fetch latest lead details to prefill if already qualified
      if (targetId) {
        enquiryService.getEnquiryById(targetId).then((res) => {
          if (res.success && res.data?.enquiry?.qualification) {
            const q = res.data.enquiry.qualification;
            if (q.budgetStatus) setBudgetStatus(q.budgetStatus);
            if (q.timeline) setTimeline(q.timeline);
            if (q.decisionMaker) setDecisionMaker(q.decisionMaker);
            if (q.needClarity) setNeedClarity(q.needClarity);
            if (q.priority) setPriority(q.priority);
            if (q.notes) setNotes(q.notes);
          } else {
            // Default reset
            setBudgetStatus('UNCONFIRMED');
            setTimeline('ABOVE_90_DAYS');
            setDecisionMaker('INFLUENCER_ONLY');
            setNeedClarity('EXPLORATORY');
            setPriority('POSSIBLE');
            setNotes('');
          }
        }).catch(() => {
          // Ignore prefetch error
        });
      }
    }
  }, [isOpen, initialLead, activeLeads]);

  // Live dynamic scoring calculation mirroring backend engine
  const { rawScore, scoreLabel, autoPriority } = useMemo(() => {
    let bPts = 0;
    if (budgetStatus === 'VERIFIED_BUDGET') bPts = 30;
    else if (budgetStatus === 'LOAN_PRE_APPROVED') bPts = 25;
    else if (budgetStatus === 'STRETCH_BUDGET') bPts = 15;

    let tPts = 5;
    if (timeline === 'IMMEDIATE') tPts = 30;
    else if (timeline === 'WITHIN_30_DAYS') tPts = 25;
    else if (timeline === 'WITHIN_90_DAYS') tPts = 15;

    let aPts = 5;
    if (decisionMaker === 'SOLE_DECISION_MAKER') aPts = 20;
    else if (decisionMaker === 'JOINT_DECISION_MAKER') aPts = 15;

    let nPts = 5;
    if (needClarity === 'SPECIFIC_UNIT_TYPE') nPts = 20;
    else if (needClarity === 'GENERAL_REQUIREMENT') nPts = 10;

    const total = bPts + tPts + aPts + nPts;

    let pct: ReadinessPercentage = '10%';
    if (total >= 90) pct = '100%';
    else if (total >= 75) pct = '80%';
    else if (total >= 60) pct = '70%';
    else if (total >= 40) pct = '50%';
    else if (total >= 25) pct = '20%';

    const p: LeadPriority = total >= 60 || timeline === 'IMMEDIATE' || timeline === 'WITHIN_30_DAYS' ? 'HOT' : 'POSSIBLE';

    return { rawScore: total, scoreLabel: pct, autoPriority: p };
  }, [budgetStatus, timeline, decisionMaker, needClarity]);

  // Handle lead switch
  const handleLeadChange = async (leadId: string) => {
    setSelectedLeadId(leadId);
    setErrorMessage(null);
    try {
      const res = await enquiryService.getEnquiryById(leadId);
      if (res.success && res.data?.enquiry?.qualification) {
        const q = res.data.enquiry.qualification;
        if (q.budgetStatus) setBudgetStatus(q.budgetStatus);
        if (q.timeline) setTimeline(q.timeline);
        if (q.decisionMaker) setDecisionMaker(q.decisionMaker);
        if (q.needClarity) setNeedClarity(q.needClarity);
        if (q.priority) setPriority(q.priority);
        if (q.notes) setNotes(q.notes);
      } else {
        setBudgetStatus('UNCONFIRMED');
        setTimeline('ABOVE_90_DAYS');
        setDecisionMaker('INFLUENCER_ONLY');
        setNeedClarity('EXPLORATORY');
        setPriority('POSSIBLE');
        setNotes('');
      }
    } catch {
      // Ignore
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setErrorMessage('Please select an active lead to qualify.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await enquiryService.qualifyLead(selectedLeadId, {
        budgetStatus,
        timeline,
        decisionMaker,
        needClarity,
        priority,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Failed to save qualification scoring.');
        setIsSubmitting(false);
        return;
      }

      onQualificationSaved();
      onClose();
    } catch (err: unknown) {
      setErrorMessage('Network error while saving qualification score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:px-6 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white border-b border-edge flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary text-white rounded-lg shadow-xs shrink-0">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-content-primary">
                  Lead Readiness Qualification
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-brand-primary px-2 py-0.5 rounded-full">
                  BANT Scoring
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">
                Evaluate prospective buyer readiness across budget, timeline, authority, and need clarity.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-content-subtle hover:text-content-primary p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Score Preview Banner */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Calculated Readiness:</span>
            <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              {rawScore}/100 pts
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                scoreLabel === '100%'
                  ? 'bg-emerald-500 text-white'
                  : scoreLabel === '80%' || scoreLabel === '70%'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              {scoreLabel} Bucket
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Priority:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                priority === 'HOT'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {priority === 'HOT' && <Flame className="h-3 w-3 text-red-400" />}
              {priority === 'HOT' ? 'Hot' : 'Poss.'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-status-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Lead Selector */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1.5">
              Select Active Enquiry to Qualify <span className="text-status-danger">*</span>
            </label>
            {activeLeads.length > 0 ? (
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs sm:text-sm text-content-primary focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
                required
              >
                {activeLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.currentStage || 'FOLLOW_UP'} ({l.price || 'Price on request'})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-content-muted">
                No active leads found in pipeline to qualify.
              </p>
            )}
          </div>

          {/* 1. Budget & Financing Readiness (30 pts) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-edge space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-content-primary">
                  1. Budget & Financing Readiness (30 pts)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-content-muted">
                {budgetStatus === 'VERIFIED_BUDGET' ? '+30 pts' : budgetStatus === 'LOAN_PRE_APPROVED' ? '+25 pts' : budgetStatus === 'STRETCH_BUDGET' ? '+15 pts' : '+0 pts'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { value: 'VERIFIED_BUDGET', label: 'Verified Funds / Cash Ready (+30)' },
                { value: 'LOAN_PRE_APPROVED', label: 'Loan Pre-Approved (+25)' },
                { value: 'STRETCH_BUDGET', label: 'Stretch / Assistance Needed (+15)' },
                { value: 'UNCONFIRMED', label: 'Budget Unconfirmed (+0)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    budgetStatus === opt.value
                      ? 'bg-blue-50 border-brand-primary font-bold text-blue-950'
                      : 'bg-white border-edge text-content-secondary hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="budgetStatus"
                    value={opt.value}
                    checked={budgetStatus === opt.value}
                    onChange={() => setBudgetStatus(opt.value as BudgetStatus)}
                    className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Purchase Timeline (30 pts) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-edge space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-content-primary">
                  2. Purchase Timeline (30 pts)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-content-muted">
                {timeline === 'IMMEDIATE' ? '+30 pts' : timeline === 'WITHIN_30_DAYS' ? '+25 pts' : timeline === 'WITHIN_90_DAYS' ? '+15 pts' : '+5 pts'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { value: 'IMMEDIATE', label: 'Immediate (< 30 days) (+30)' },
                { value: 'WITHIN_30_DAYS', label: 'Within 30–60 days (+25)' },
                { value: 'WITHIN_90_DAYS', label: 'Within 90 days / 1–3 mos (+15)' },
                { value: 'ABOVE_90_DAYS', label: 'Above 90 days / Looking (+5)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    timeline === opt.value
                      ? 'bg-blue-50 border-brand-primary font-bold text-blue-950'
                      : 'bg-white border-edge text-content-secondary hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeline"
                    value={opt.value}
                    checked={timeline === opt.value}
                    onChange={() => setTimeline(opt.value as PurchaseTimeline)}
                    className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Decision Maker Role (20 pts) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-edge space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-content-primary">
                  3. Authority / Decision Maker (20 pts)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-content-muted">
                {decisionMaker === 'SOLE_DECISION_MAKER' ? '+20 pts' : decisionMaker === 'JOINT_DECISION_MAKER' ? '+15 pts' : '+5 pts'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { value: 'SOLE_DECISION_MAKER', label: 'Sole Buyer (+20)' },
                { value: 'JOINT_DECISION_MAKER', label: 'Joint / Family (+15)' },
                { value: 'INFLUENCER_ONLY', label: 'Influencer (+5)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    decisionMaker === opt.value
                      ? 'bg-blue-50 border-brand-primary font-bold text-blue-950'
                      : 'bg-white border-edge text-content-secondary hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="decisionMaker"
                    value={opt.value}
                    checked={decisionMaker === opt.value}
                    onChange={() => setDecisionMaker(opt.value as DecisionMaker)}
                    className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Need Clarity (20 pts) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-edge space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-bold text-content-primary">
                  4. Requirement Clarity (20 pts)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-content-muted">
                {needClarity === 'SPECIFIC_UNIT_TYPE' ? '+20 pts' : needClarity === 'GENERAL_REQUIREMENT' ? '+10 pts' : '+5 pts'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { value: 'SPECIFIC_UNIT_TYPE', label: 'Specific Unit (+20)' },
                { value: 'GENERAL_REQUIREMENT', label: 'General Need (+10)' },
                { value: 'EXPLORATORY', label: 'Exploratory (+5)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    needClarity === opt.value
                      ? 'bg-blue-50 border-brand-primary font-bold text-blue-950'
                      : 'bg-white border-edge text-content-secondary hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="needClarity"
                    value={opt.value}
                    checked={needClarity === opt.value}
                    onChange={() => setNeedClarity(opt.value as RequirementClarity)}
                    className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Matrix Row Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1.5">
              Qualification Priority (Matrix Row Placement)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPriority('HOT')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  priority === 'HOT'
                    ? 'bg-red-50 text-status-danger border-red-200 ring-2 ring-red-400'
                    : 'bg-white text-content-secondary border-edge hover:bg-slate-50'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-status-danger shrink-0" />
                <span>Hot Priority</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('POSSIBLE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  priority === 'POSSIBLE'
                    ? 'bg-slate-100 text-slate-800 border-slate-300 ring-2 ring-slate-400'
                    : 'bg-white text-content-secondary border-edge hover:bg-slate-50'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-content-secondary shrink-0" />
                <span>Poss. Priority</span>
              </button>
            </div>
            <p className="text-[11px] text-content-muted mt-1">
              Suggested default: {autoPriority === 'HOT' ? 'Hot' : 'Poss.'} based on current points.
            </p>
          </div>

          {/* Qualification Notes */}
          <div>
            <label className="block text-xs font-bold text-content-primary mb-1">
              Qualification Review Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record specific buyer insights, liquid funds availability, floor preferences, objections..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs sm:text-sm text-content-primary placeholder:text-content-muted focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-edge flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              disabled={isSubmitting || !selectedLeadId}
            >
              {isSubmitting ? 'Saving Score...' : 'Save Qualification'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
