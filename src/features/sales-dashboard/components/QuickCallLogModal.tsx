import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  PhoneCall,
  X,
  Clock,
  Calendar,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { NewLeadItem } from '../types/dashboard.types.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { FollowUpOutcome } from '../../../types/enquiry.types.js';
import {
  FOLLOW_UP_OUTCOME_META,
  QUICK_ACTIVITY_OUTCOMES,
} from '../../../utils/followUpOutcome.js';

export interface QuickCallLogModalProps {
  lead: NewLeadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const DURATION_PRESETS = [
  { label: '< 1 min', seconds: 45 },
  { label: '1–3 min', seconds: 120 },
  { label: '3–10 min', seconds: 360 },
  { label: '10+ min', seconds: 720 },
];

export const QuickCallLogModal: React.FC<QuickCallLogModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLogged,
}) => {
  const [purpose, setPurpose] = useState<'CALL' | 'WHATSAPP' | 'EMAIL'>('CALL');
  const [outcome, setOutcome] = useState<FollowUpOutcome>('NO_ANSWER');
  const [notes, setNotes] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined);
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState<string>('10:30');
  const [advanceToMeeting, setAdvanceToMeeting] = useState<boolean>(false);
  const [markRejected, setMarkRejected] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPurpose('CALL');
      setOutcome('NO_ANSWER');
      setNotes('');
      setDurationSeconds(undefined);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNextFollowUpDate(tomorrow.toISOString().split('T')[0]);
      setNextFollowUpTime('10:30');
      setAdvanceToMeeting(false);
      setMarkRejected(false);
    }
  }, [isOpen, lead?.id]);

  if (!isOpen || !lead) return null;

  const isCallbackRequired = outcome === 'CALL_BACK_REQUESTED';
  const showAdvanceToggle =
    outcome === 'MEETING_SCHEDULED' && (!lead.currentStage || lead.currentStage === 'FOLLOW_UP');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isCallbackRequired && (!nextFollowUpDate.trim() || !nextFollowUpTime.trim())) {
      Swal.fire({
        icon: 'warning',
        title: 'Callback Schedule Required',
        text: 'Please specify next callback date and time when Call Back Requested is selected.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await enquiryService.logQuickActivity(lead.id, {
        purpose,
        outcome,
        notes: notes.trim() || undefined,
        callDurationSeconds: durationSeconds,
        nextFollowUpDate: isCallbackRequired || nextFollowUpDate ? nextFollowUpDate : undefined,
        nextFollowUpTime: isCallbackRequired || (nextFollowUpDate && nextFollowUpTime) ? nextFollowUpTime : undefined,
        advanceStage: outcome === 'MEETING_SCHEDULED' ? advanceToMeeting : false,
      });

      if (!res.success) {
        Swal.fire({
          icon: 'error',
          title: 'Could Not Log Interaction',
          text: res.message || 'Failed to record quick interaction.',
        });
        return;
      }

      if (outcome === 'NOT_INTERESTED' && markRejected) {
        await enquiryService.rejectLead(lead.id, {
          reason: 'Not interested',
          remarks: notes.trim() || 'Marked Not Interested / Lost via Quick Call Log.',
        });
      }

      const meta = FOLLOW_UP_OUTCOME_META[outcome];
      Swal.fire({
        icon: 'success',
        title: `${meta?.label || 'Interaction'} Logged`,
        text: `Recorded for ${lead.name}. Visible immediately to supervisors and in timeline.`,
        timer: 2200,
        showConfirmButton: false,
      });

      onLogged();
      onClose();
    } catch (err: unknown) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: err instanceof Error ? err.message : 'Unable to save quick interaction.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Log Quick Call or Interaction"
    >
      <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 px-5 border-b border-edge flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-brand-primary text-white shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-content-primary truncate">
                Log Call / Quick Update
              </h3>
              <p className="text-xs text-content-muted truncate">
                Lead: <strong className="text-content-secondary">{lead.name}</strong> ({lead.mobile})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-content-subtle hover:text-content-primary p-1 rounded-md"
            aria-label="Close quick log modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Channel */}
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1.5">
              Channel Used
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CALL', 'WHATSAPP', 'EMAIL'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setPurpose(ch)}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    purpose === ch
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-surface-card text-content-secondary border-edge hover:bg-surface-subtle'
                  }`}
                >
                  {ch === 'CALL' && <PhoneCall className="w-3.5 h-3.5" />}
                  {ch === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5" />}
                  {ch === 'EMAIL' && <Mail className="w-3.5 h-3.5" />}
                  <span>{ch === 'CALL' ? 'Call' : ch === 'WHATSAPP' ? 'WhatsApp' : 'Email'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1-Click Outcome Chips */}
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1.5">
              Interaction Outcome <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIVITY_OUTCOMES.map((code) => {
                const meta = FOLLOW_UP_OUTCOME_META[code];
                const isSelected = outcome === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setOutcome(code);
                      if (code !== 'MEETING_SCHEDULED') setAdvanceToMeeting(false);
                      if (code !== 'NOT_INTERESTED') setMarkRejected(false);
                    }}
                    className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? `${meta.badgeCls} ring-2 ring-brand-primary/40 font-bold shadow-xs`
                        : 'bg-white text-content-secondary border-edge hover:bg-surface-subtle'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotCls}`} />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Call Duration */}
          <div>
            <label className="text-xs font-semibold text-content-secondary mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-content-muted" />
              <span>Call Duration (Optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setDurationSeconds((prev) => (prev === preset.seconds ? undefined : preset.seconds))
                  }
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer ${
                    durationSeconds === preset.seconds
                      ? 'bg-blue-50 text-brand-primary border-blue-300'
                      : 'bg-white text-content-secondary border-edge hover:bg-surface-subtle'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Callback Date & Time */}
          {(isCallbackRequired || outcome === 'NO_ANSWER' || outcome === 'SWITCHED_OFF' || outcome === 'CONNECTED') && (
            <div
              className={`p-3 rounded-lg border space-y-2 ${
                isCallbackRequired ? 'bg-amber-50/70 border-amber-300' : 'bg-surface-subtle/50 border-edge'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-content-primary">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  {isCallbackRequired
                    ? 'Next Callback Date & Time (Required) *'
                    : 'Schedule Next Retry / Follow-up (Optional)'}
                </span>
                {!isCallbackRequired && nextFollowUpDate && (
                  <button
                    type="button"
                    onClick={() => setNextFollowUpDate('')}
                    className="text-[11px] font-semibold text-content-muted hover:text-status-danger cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  required={isCallbackRequired}
                  className="p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                />
                <input
                  type="time"
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  required={isCallbackRequired}
                  className="p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                />
              </div>
            </div>
          )}

          {/* Conditional stage advance / close toggles */}
          {showAdvanceToggle && (
            <label className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-950 cursor-pointer">
              <input
                type="checkbox"
                checked={advanceToMeeting}
                onChange={(e) => setAdvanceToMeeting(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600"
              />
              <span>
                <strong className="block font-bold">Advance Lead to Step 2 (Meeting Plan)</strong>
                <span className="text-[11px] text-emerald-800">
                  Meeting Agreed enables progression to Step 2 immediately.
                </span>
              </span>
            </label>
          )}

          {outcome === 'NOT_INTERESTED' && (
            <label className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-950 cursor-pointer">
              <input
                type="checkbox"
                checked={markRejected}
                onChange={(e) => setMarkRejected(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-red-600"
              />
              <span>
                <strong className="block font-bold">Also mark lead as Rejected / Lost</strong>
                <span className="text-[11px] text-red-800">
                  Closes lead cleanly without advancing to Meeting Plan.
                </span>
              </span>
            </label>
          )}

          {/* Quick Note */}
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Call / Interaction Note (Optional for 1-click attempts)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Ringing no response, asked to call after 5 PM, discussed 3BHK pricing..."
              className="w-full p-2.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Saving...' : 'Save Call Attempt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
