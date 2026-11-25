import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  PhoneCall,
  MessageSquare,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  History,
  Tag,
  Loader2,
  Users,
  MapPin,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  FileEdit,
  Check,
  Grid3X3,
  Lock,
} from 'lucide-react';
import {
  getFollowUpOutcomeMeta,
  formatFollowUpScheduleLabel,
} from '../../../utils/followUpOutcome.js';
import { Button } from '../../../components/ui/Button.js';
import { NewLeadItem } from '../types/dashboard.types.js';
import {
  enquiryService,
} from '../../../services/enquiry.service.js';
import {
  IEnquiry,
  ActiveManagerSummary,
  BudgetStatus,
  PurchaseTimeline,
  DecisionMaker,
  RequirementClarity,
  LeadPriority,
} from '../../../types/enquiry.types.js';

export interface FollowUpModalProps {
  lead: NewLeadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onFollowUpLogged: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  lead,
  isOpen,
  onClose,
  onFollowUpLogged,
}) => {
  // Active workflow step in view (1 = Follow-up, 2 = Meeting, 3 = Site Visit, 4 = Deal Done)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [leadDetail, setLeadDetail] = useState<IEnquiry | null>(null);
  const [managers, setManagers] = useState<ActiveManagerSummary[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Step 1: Follow-up State
  // -------------------------------------------------------------
  const [purpose, setPurpose] = useState<'CALL' | 'WHATSAPP' | 'EMAIL'>('CALL');
  const [outcome, setOutcome] = useState<
    'CONNECTED' | 'NO_ANSWER' | 'CALL_BACK_REQUESTED' | 'MEETING_SCHEDULED' | 'NOT_INTERESTED' | 'OTHER'
  >('CONNECTED');
  const followUpDate = new Date().toISOString().split('T')[0];
  const now = new Date();
  const followUpTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split('T')[0];
  });
  const [nextFollowUpTime, setNextFollowUpTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');
  const [enquiryProjectName, setEnquiryProjectName] = useState<string>('');
  const [enquiryRequirement, setEnquiryRequirement] = useState<string>('');
  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>('UNCONFIRMED');
  const [timeline, setTimeline] = useState<PurchaseTimeline>('ABOVE_90_DAYS');
  const [decisionMaker, setDecisionMaker] = useState<DecisionMaker>('INFLUENCER_ONLY');
  const [needClarity, setNeedClarity] = useState<RequirementClarity>('EXPLORATORY');
  const [priority, setPriority] = useState<LeadPriority>('POSSIBLE');
  const [hasQualificationUpdated, setHasQualificationUpdated] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Step 2: Meeting Plan State
  // -------------------------------------------------------------
  const [meetingPlace, setMeetingPlace] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('11:00');
  const [meetingProject, setMeetingProject] = useState<string>('');
  const [meetingManagerId, setMeetingManagerId] = useState<string>('');
  const [meetingRemarks, setMeetingRemarks] = useState<string>('');
  const [meetingResult, setMeetingResult] = useState<string>('');
  const [isMeetingCompleted, setIsMeetingCompleted] = useState<boolean>(false);
  const [isReschedulingMeeting, setIsReschedulingMeeting] = useState<boolean>(false);
  const [isReschedulingSiteVisit, setIsReschedulingSiteVisit] = useState<boolean>(false);
  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    type: 'MEETING' | 'SITE_VISIT';
  }>({ isOpen: false, type: 'MEETING' });
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [isCancellingPlan, setIsCancellingPlan] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Step 3: Site Visit Plan State
  // -------------------------------------------------------------
  const [siteVisitAddress, setSiteVisitAddress] = useState<string>('');
  const [siteVisitDate, setSiteVisitDate] = useState<string>('');
  const [siteVisitTime, setSiteVisitTime] = useState<string>('11:00');
  const [siteVisitProject, setSiteVisitProject] = useState<string>('');
  const [siteVisitManagerId, setSiteVisitManagerId] = useState<string>('');
  const [siteVisitRemarks, setSiteVisitRemarks] = useState<string>('');
  const [siteVisitOutcome, setSiteVisitOutcome] = useState<string>('');
  const [isSiteVisitCompleted, setIsSiteVisitCompleted] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Step 4: Deal Done State
  // -------------------------------------------------------------
  const [dealProject, setDealProject] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('Apartment');
  const [dealPrice, setDealPrice] = useState<string>('');
  const [dealSize, setDealSize] = useState<string>('');
  const [dealRemarks, setDealRemarks] = useState<string>('');
  const [isDealConfirmed, setIsDealConfirmed] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Operational Status & History State
  // -------------------------------------------------------------
  const [leadStatus, setLeadStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [closingReason, setClosingReason] = useState<string>('');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [activityList, setActivityList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'workflow' | 'history'>('workflow');

  // Submit / Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showWarningPopup = useCallback((message: string, elementId?: string) => {
    Swal.fire({
      icon: 'warning',
      title: 'Required Field Missing',
      text: message,
      confirmButtonText: 'Got it',
      confirmButtonColor: '#2563eb',
      didClose: () => {
        if (elementId) {
          const el = document.getElementById(elementId);
          el?.focus();
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
    }).then(() => {
      if (elementId) {
        const el = document.getElementById(elementId);
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  const showSuccessPopup = useCallback((message: string) => {
    return Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
    });
  }, []);

  const showErrorPopup = useCallback((message: string) => {
    return Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
    });
  }, []);

  // Re-fetch lead details and prefill data when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab('workflow');
      loadAllLeadData(lead.id);
    }
  }, [isOpen, lead]);

  const loadAllLeadData = async (leadId: string) => {
    setIsLoadingDetails(true);
    try {
      const [leadRes, mgrRes, followUpsRes, actsRes] = await Promise.all([
        enquiryService.getEnquiryById(leadId),
        enquiryService.getActiveManagers(),
        enquiryService.getFollowUps(leadId),
        enquiryService.getActivities(leadId),
      ]);

      if (mgrRes.success && mgrRes.data?.managers) {
        setManagers(mgrRes.data.managers);
      }

      if (followUpsRes.success && followUpsRes.data?.followUps) {
        setHistoryList(followUpsRes.data.followUps);
      } else {
        setHistoryList([]);
      }

      if (actsRes.success && actsRes.data?.activities) {
        setActivityList(actsRes.data.activities);
      } else {
        setActivityList([]);
      }

      if (leadRes.success && leadRes.data?.enquiry) {
        const e = leadRes.data.enquiry;
        setLeadDetail(e);
        setLeadStatus(e.status || 'ACTIVE');
        if (e.preferredContactMethod) {
          setPurpose(e.preferredContactMethod);
        }
        setEnquiryProjectName(e.projectName || '');
        setEnquiryRequirement(e.requirement || '');
        setBudgetMin(e.budgetMin ? String(e.budgetMin) : '');
        setBudgetMax(e.budgetMax ? String(e.budgetMax) : '');

        // Prefill Lead Qualification
        if (e.qualification) {
          setBudgetStatus(e.qualification.budgetStatus || 'UNCONFIRMED');
          setTimeline(e.qualification.timeline || 'ABOVE_90_DAYS');
          setDecisionMaker(e.qualification.decisionMaker || 'INFLUENCER_ONLY');
          setNeedClarity(e.qualification.needClarity || 'EXPLORATORY');
          setPriority(e.qualification.priority || 'POSSIBLE');
          setHasQualificationUpdated(false);
        } else {
          setBudgetStatus('UNCONFIRMED');
          setTimeline('ABOVE_90_DAYS');
          setDecisionMaker('INFLUENCER_ONLY');
          setNeedClarity('EXPLORATORY');
          setPriority('POSSIBLE');
          setHasQualificationUpdated(false);
        }

        // Prefill Step 2 (Meeting Plan)
        if (e.meetingPlan) {
          setMeetingPlace(e.meetingPlan.meetingPlace || '');
          setMeetingDate(e.meetingPlan.meetingDate || '');
          setMeetingTime(e.meetingPlan.meetingTime || '11:00');
          setMeetingProject(e.meetingPlan.projectDetails || e.projectName || '');
          setMeetingManagerId(e.meetingPlan.managerId ? String(e.meetingPlan.managerId) : '');
          setMeetingRemarks(e.meetingPlan.remarks || '');
          setMeetingResult(e.meetingPlan.meetingResult || '');
          setIsMeetingCompleted(Boolean(e.meetingPlan.isCompleted));
        } else {
          setMeetingProject(e.projectName || '');
        }

        // Prefill Step 3 (Site Visit Plan)
        if (e.siteVisitPlan) {
          setSiteVisitAddress(e.siteVisitPlan.siteVisitAddress || '');
          setSiteVisitDate(e.siteVisitPlan.siteVisitDate || '');
          setSiteVisitTime(e.siteVisitPlan.siteVisitTime || '11:00');
          setSiteVisitProject(e.siteVisitPlan.projectName || e.projectName || '');
          setSiteVisitManagerId(e.siteVisitPlan.managerId ? String(e.siteVisitPlan.managerId) : '');
          setSiteVisitRemarks(e.siteVisitPlan.remarks || '');
          setSiteVisitOutcome(e.siteVisitPlan.visitOutcome || '');
          setIsSiteVisitCompleted(Boolean(e.siteVisitPlan.isCompleted));
        } else {
          setSiteVisitProject(e.projectName || '');
        }

        // Prefill Step 4 (Deal Done)
        if (e.dealDone) {
          setDealProject(e.dealDone.project || e.projectName || '');
          setPropertyType(e.dealDone.propertyType || 'Apartment');
          setDealPrice(e.dealDone.price ? String(e.dealDone.price) : '');
          setDealSize(e.dealDone.size || '');
          setDealRemarks(e.dealDone.remarks || '');
          setIsDealConfirmed(Boolean(e.dealDone.isConfirmed));
        } else {
          setDealProject(e.projectName || '');
          if (e.budgetMax) setDealPrice(String(e.budgetMax));
        }

        // Determine initial active step from persisted currentStage
        switch (e.currentStage) {
          case 'MEETING_PLAN':
            setActiveStep(2);
            break;
          case 'SITE_VISIT_PLAN':
            setActiveStep(3);
            break;
          case 'DEAL_DONE':
            setActiveStep(4);
            break;
          case 'FOLLOW_UP':
          default:
            setActiveStep(1);
            break;
        }
      }
    } catch (err: unknown) {
      setErrorMessage('Failed to load lead details from database.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen || !lead) return null;

  // Highest unlocked step based on completion invariants
  const hasCompletedDiscussion = Boolean(
    leadDetail?.lastFollowUpOutcome
      ? leadDetail.lastFollowUpOutcome === 'MEETING_SCHEDULED'
      : historyList.some(
          (t) =>
            t.outcome === 'MEETING_SCHEDULED' &&
            (t.status === 'COMPLETED' ||
              (!t.isInitialTask && t.notes && t.notes !== 'System initialized pending follow-up task'))
        ) ||
        activityList.some(
          (a) =>
            (a.metadata?.step === 'FOLLOW_UP' || a.activityType === 'FOLLOW_UP_COMPLETED') &&
            a.metadata?.outcome === 'MEETING_SCHEDULED'
        )
  );
  const isStep1Done = Boolean(leadDetail && (leadDetail.currentStage !== 'FOLLOW_UP' || hasCompletedDiscussion));
  const modalOutcomeMeta = getFollowUpOutcomeMeta(
    leadDetail?.lastFollowUpOutcome || lead?.lastFollowUpOutcome
  );
  const modalScheduleLabel = formatFollowUpScheduleLabel(
    leadDetail?.nextFollowUpDate || lead?.nextFollowUpDate,
    leadDetail?.nextFollowUpTime || lead?.nextFollowUpTime
  );
  const isMeetingCancelled = Boolean(leadDetail?.meetingPlan?.isCancelled);
  const isSiteVisitCancelled = Boolean(leadDetail?.siteVisitPlan?.isCancelled);

  const handleOpenCancelModal = (type: 'MEETING' | 'SITE_VISIT') => {
    setCancelReasonInput('');
    setCancelModalError(null);
    setCancelModalState({ isOpen: true, type });
  };

  const handleConfirmCancelPlan = async () => {
    const reason = cancelReasonInput.trim();
    if (!reason) {
      setCancelModalError('Cancellation reason is mandatory and cannot be empty.');
      showWarningPopup('Cancellation reason is mandatory and cannot be empty.', 'modal-cancel-reason');
      return;
    }
    if (!lead) return;

    setIsCancellingPlan(true);
    setCancelModalError(null);

    try {
      let res;
      if (cancelModalState.type === 'MEETING') {
        res = await enquiryService.cancelMeetingPlan(lead.id, reason);
      } else {
        res = await enquiryService.cancelSiteVisitPlan(lead.id, reason);
      }

      if (!res.success) {
        const errorMsg = res.message || 'Failed to cancel plan.';
        setCancelModalError(errorMsg);
        showErrorPopup(errorMsg);
        setIsCancellingPlan(false);
        return;
      }

      setCancelModalState({ isOpen: false, type: 'MEETING' });
      setIsReschedulingMeeting(false);
      setIsReschedulingSiteVisit(false);
      showSuccessPopup(
        cancelModalState.type === 'MEETING'
          ? 'Meeting plan cancelled successfully.'
          : 'Site visit plan cancelled successfully.'
      );
      await loadAllLeadData(lead.id);
      if (onFollowUpLogged) onFollowUpLogged();
    } catch (err: any) {
      const errorMsg = err?.message || 'A network error occurred while cancelling the plan.';
      setCancelModalError(errorMsg);
      showErrorPopup(errorMsg);
    } finally {
      setIsCancellingPlan(false);
    }
  };

  const isMeetingUnlocked = Boolean(isStep1Done);
  const isSiteVisitUnlocked = Boolean(leadDetail?.meetingPlan?.isCompleted || isMeetingCompleted);
  const isDealDoneUnlocked = Boolean(leadDetail?.siteVisitPlan?.isCompleted || isSiteVisitCompleted);

  // -------------------------------------------------------------
  // Submit Step Handler
  // -------------------------------------------------------------
  const handleSaveStep = async (advance: boolean = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation for Step 1
    if (activeStep === 1) {
      if (advance && outcome !== 'MEETING_SCHEDULED') {
        showWarningPopup(
          'Cannot proceed to Meeting Plan until Follow-up Outcome is set to "Meeting Agreed".',
          'modal-follow-up-outcome'
        );
        return;
      }
      if (!notes.trim()) {
        showWarningPopup('Follow-up remark/notes cannot be empty.', 'modal-follow-up-notes');
        return;
      }
      if (outcome === 'CALL_BACK_REQUESTED') {
        if (!nextFollowUpDate.trim()) {
          showWarningPopup('Next follow-up date is required when outcome is Call Back Requested.', 'modal-next-follow-up-date');
          return;
        }
        if (!nextFollowUpTime.trim()) {
          showWarningPopup('Next follow-up time is required when outcome is Call Back Requested.', 'modal-next-follow-up-time');
          return;
        }
      }
    }

    // Validation for Step 2
    if (activeStep === 2) {
      if (!meetingPlace.trim()) {
        showWarningPopup('Meeting place/address is required.', 'modal-meeting-place');
        return;
      }
      if (!meetingDate.trim()) {
        showWarningPopup('Meeting date is required.', 'modal-meeting-date');
        return;
      }
      if (!meetingTime.trim()) {
        showWarningPopup('Meeting time is required.', 'modal-meeting-time');
        return;
      }
      if (!meetingProject.trim()) {
        showWarningPopup('Project details are required.', 'modal-meeting-project');
        return;
      }
      if (advance && !isMeetingCompleted) {
        showWarningPopup('Meeting must be marked completed before proceeding to Site Visit Plan.', 'meeting-completed');
        return;
      }
    }

    // Validation for Step 3
    if (activeStep === 3) {
      if (!siteVisitAddress.trim()) {
        showWarningPopup('Site visit address/location is required.', 'modal-site-visit-address');
        return;
      }
      if (!siteVisitDate.trim()) {
        showWarningPopup('Site visit date is required.', 'modal-site-visit-date');
        return;
      }
      if (!siteVisitTime.trim()) {
        showWarningPopup('Site visit time is required.', 'modal-site-visit-time');
        return;
      }
      if (!siteVisitProject.trim()) {
        showWarningPopup('Project name is required.', 'modal-site-visit-project');
        return;
      }
      if (advance && !isSiteVisitCompleted) {
        showWarningPopup('Site visit must be marked completed before proceeding to Deal Done.', 'sitevisit-completed');
        return;
      }
    }

    // Validation for Step 4
    if (activeStep === 4) {
      if (!dealProject.trim()) {
        showWarningPopup('Project name is required for Deal Done.', 'modal-deal-project');
        return;
      }
      if (!propertyType.trim()) {
        showWarningPopup('Property type is required.', 'modal-deal-property-type');
        return;
      }
      const numPrice = parseFloat(dealPrice);
      if (isNaN(numPrice) || numPrice <= 0) {
        showWarningPopup('Please enter a valid positive deal price.', 'modal-deal-price');
        return;
      }
      if (!dealSize.trim()) {
        showWarningPopup('Property size is required (e.g. 1850 sq ft or 3 BHK).', 'modal-deal-size');
        return;
      }
      if (!isDealConfirmed) {
        showWarningPopup('Explicit agent confirmation is required to finalize Deal Done.', 'deal-confirmed');
        return;
      }
    }

    // Status validation
    if (leadStatus === 'CLOSED' && !closingReason.trim()) {
      showWarningPopup('A closing reason is mandatory when setting lead status to CLOSED.', 'modal-closing-reason');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload: any = {
        advanceStage: advance,
        leadStatus,
        closingReason: leadStatus === 'CLOSED' ? closingReason.trim() : undefined,
      };

      if (activeStep === 1) {
        payload.step = 'FOLLOW_UP';
        payload.purpose = purpose;
        payload.outcome = outcome;
        payload.followUpDate = followUpDate;
        payload.followUpTime = followUpTime;
        payload.notes = notes.trim();
        payload.nextFollowUpDate = outcome === 'CALL_BACK_REQUESTED' ? nextFollowUpDate : undefined;
        payload.nextFollowUpTime = outcome === 'CALL_BACK_REQUESTED' ? nextFollowUpTime : undefined;
        payload.enquiryUpdate = {
          projectName: enquiryProjectName.trim() || undefined,
          requirement: enquiryRequirement.trim() || undefined,
          budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
          budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        };
        if (hasQualificationUpdated || budgetStatus !== 'UNCONFIRMED' || timeline !== 'ABOVE_90_DAYS' || decisionMaker !== 'INFLUENCER_ONLY' || needClarity !== 'EXPLORATORY') {
          payload.qualification = {
            budgetStatus,
            timeline,
            decisionMaker,
            needClarity,
            priority,
            notes: notes.trim() || undefined,
          };
        }
      } else if (activeStep === 2) {
        payload.step = 'MEETING_PLAN';
        payload.meetingPlace = meetingPlace.trim();
        payload.meetingDate = meetingDate;
        payload.meetingTime = meetingTime;
        payload.projectDetails = meetingProject.trim();
        payload.managerId = meetingManagerId || null;
        payload.remarks = meetingRemarks.trim();
        payload.meetingResult = meetingResult.trim();
        payload.isCompleted = isMeetingCompleted;
      } else if (activeStep === 3) {
        payload.step = 'SITE_VISIT_PLAN';
        payload.siteVisitAddress = siteVisitAddress.trim();
        payload.siteVisitDate = siteVisitDate;
        payload.siteVisitTime = siteVisitTime;
        payload.projectName = siteVisitProject.trim();
        payload.managerId = siteVisitManagerId || null;
        payload.remarks = siteVisitRemarks.trim();
        payload.visitOutcome = siteVisitOutcome.trim();
        payload.isCompleted = isSiteVisitCompleted;
      } else if (activeStep === 4) {
        payload.step = 'DEAL_DONE';
        payload.project = dealProject.trim();
        payload.propertyType = propertyType.trim();
        payload.price = parseFloat(dealPrice);
        payload.size = dealSize.trim();
        payload.remarks = dealRemarks.trim();
        payload.isConfirmed = isDealConfirmed;
      }

      const res = await enquiryService.saveWorkflowStep(lead.id, payload);

      if (!res.success) {
        const errorMsg = res.message || res.error || 'Failed to save workflow step.';
        setErrorMessage(errorMsg);
        showErrorPopup(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        advance
          ? `Step ${activeStep} saved! Advanced to Step ${activeStep + 1}.`
          : `Step ${activeStep} details saved successfully.`
      );

      // SweetAlert2 success notification across all 4 workflow stages
      let successMsg = `Step ${activeStep} details saved successfully.`;
      if (activeStep === 1) {
        successMsg = advance
          ? 'Follow-up saved and advanced to Meeting Plan successfully.'
          : 'Follow-up saved successfully.';
      } else if (activeStep === 2) {
        successMsg = advance
          ? 'Meeting Plan saved and advanced to Site Visit Plan successfully.'
          : 'Meeting Plan details saved successfully.';
      } else if (activeStep === 3) {
        successMsg = advance
          ? 'Site Visit Plan saved and advanced to Deal Done successfully.'
          : 'Site Visit Plan details saved successfully.';
      } else if (activeStep === 4) {
        successMsg = 'Deal finalized and saved successfully.';
      }

      const savedNotesSnapshot = notes.trim();
      // Refresh local modal data and parent dashboard
      // Note: loadAllLeadData automatically syncs activeStep with the updated currentStage from the backend
      await loadAllLeadData(lead.id);
      onFollowUpLogged();

      if (activeStep === 1 && outcome === 'NOT_INTERESTED' && leadStatus === 'ACTIVE') {
        const confirmLost = await Swal.fire({
          icon: 'warning',
          title: 'Follow-Up Logged as Not Interested / Lost',
          text: 'Step 2 stays locked. Would you like to mark this lead as Rejected / Lost now?',
          showCancelButton: true,
          confirmButtonText: 'Yes, Mark Rejected / Lost',
          cancelButtonText: 'Keep Active for Now',
          confirmButtonColor: '#dc2626',
        });
        if (confirmLost.isConfirmed) {
          const rejectRes = await enquiryService.rejectLead(lead.id, {
            reason: 'Not interested',
            remarks: savedNotesSnapshot,
          });
          if (rejectRes.success) {
            showSuccessPopup(`Lead "${lead.name}" has been marked as Rejected / Lost.`);
            onFollowUpLogged();
            onClose();
          } else {
            showErrorPopup(rejectRes.message || 'Failed to mark lead as Rejected / Lost.');
          }
        }
      } else {
        showSuccessPopup(successMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'A network error occurred.';
      setErrorMessage(errorMsg);
      showErrorPopup(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-2xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* =========================================================
         * MODAL HEADER
         * ========================================================= */}
        <div className="p-3.5 sm:p-4 sm:px-6 border-b border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-slate-50/50">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-brand-primary text-white rounded-lg shadow-xs shrink-0">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-content-primary">
                    Lead Workflow & Follow-Up
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-brand-primary">
                    Sequential Pipeline
                  </span>
                  {modalOutcomeMeta && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${modalOutcomeMeta.badgeCls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${modalOutcomeMeta.dotCls}`} />
                      <span>{modalOutcomeMeta.label}</span>
                      {modalScheduleLabel && (
                        <span className="opacity-85">• {modalScheduleLabel}</span>
                      )}
                    </span>
                  )}
                </div>
                <span className="text-xs text-content-muted truncate block">
                  Prospect: <strong className="text-content-secondary">{lead.name}</strong> ({lead.mobile})
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-content-subtle hover:text-content-primary p-1 rounded-md sm:hidden shrink-0"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
            {/* View Switcher: Workflow vs History */}
            <div className="flex rounded-lg border border-edge p-0.5 bg-white text-xs w-full sm:w-auto justify-center sm:justify-start sm:mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('workflow')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded font-medium transition-colors text-center ${
                  activeTab === 'workflow'
                    ? 'bg-brand-primary text-white font-bold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Workflow Steps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'history'
                    ? 'bg-brand-primary text-white font-bold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <History className="h-3 w-3" />
                <span>History ({historyList.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-content-subtle hover:text-content-primary p-1 rounded-md hidden sm:block shrink-0"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
         * SEQUENTIAL STEPPER BAR (Always visible in Workflow tab)
         * ========================================================= */}
        {activeTab === 'workflow' && (
          <div className="p-2.5 sm:px-6 bg-slate-50 border-b border-edge shrink-0 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 sm:justify-between text-xs min-w-max sm:min-w-0">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeStep === 1
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-content-secondary border-edge hover:bg-slate-100'
                }`}
              >
                <span className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                <span>Follow-up</span>
                {isStep1Done && <Check className="h-3 w-3 text-emerald-400" />}
              </button>

              <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={() => isMeetingUnlocked && setActiveStep(2)}
                disabled={!isMeetingUnlocked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeStep === 2
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : isMeetingUnlocked
                    ? 'bg-white text-content-secondary border-edge hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 border-dashed border-slate-200 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                <span>Meeting Plan</span>
                {leadDetail?.meetingPlan?.isCompleted && <Check className="h-3 w-3 text-emerald-400" />}
              </button>

              <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Step 3 Pill */}
              <button
                type="button"
                onClick={() => isSiteVisitUnlocked && setActiveStep(3)}
                disabled={!isSiteVisitUnlocked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeStep === 3
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : isSiteVisitUnlocked
                    ? 'bg-white text-content-secondary border-edge hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 border-dashed border-slate-200 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
                <span>Site Visit</span>
                {leadDetail?.siteVisitPlan?.isCompleted && <Check className="h-3 w-3 text-emerald-400" />}
              </button>

              <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Step 4 Pill */}
              <button
                type="button"
                onClick={() => isDealDoneUnlocked && setActiveStep(4)}
                disabled={!isDealDoneUnlocked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeStep === 4
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : isDealDoneUnlocked
                    ? 'bg-white text-content-secondary border-edge hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 border-dashed border-slate-200 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">4</span>
                <span>Deal Done</span>
                {leadDetail?.dealDone?.isConfirmed && <Check className="h-3 w-3 text-white" />}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
         * MODAL SCROLLABLE BODY
         * ========================================================= */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isLoadingDetails ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-content-muted text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              <span>Fetching latest database records for this lead...</span>
            </div>
          ) : activeTab === 'history' ? (
            /* =========================================================
             * TAB 2: AUDIT TRAIL & HISTORY
             * ========================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-edge pb-2">
                <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-brand-primary" />
                  Preserved Activity & Follow-Up History
                </h4>
                <span className="text-[11px] text-content-muted">
                  Immutable database records
                </span>
              </div>

              {historyList.length === 0 && activityList.length === 0 ? (
                <p className="text-xs text-content-muted italic text-center py-6">
                  No interaction history recorded for this lead yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {activityList.map((act) => (
                    <div
                      key={act._id || act.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-brand-primary">
                          {act.type}
                        </span>
                        <span className="text-content-muted font-mono">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-content-primary font-normal">{act.note}</p>
                      <span className="text-[10px] text-content-subtle block">
                        Actor: {act.performedByName || 'Authorized Employee'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* =========================================================
             * TAB 1: WORKFLOW FORM (Displaying One Step at a Time)
             * ========================================================= */
            <div className="space-y-5">
              
              {/* -------------------------------------------------------
               * STEP 1: FOLLOW-UP / CUSTOMER DISCUSSION
               * ------------------------------------------------------- */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-950 mb-0.5">
                      <PhoneCall className="h-4 w-4 text-brand-primary shrink-0" />
                      <span>Step 1: Follow-up & Customer Interaction</span>
                    </div>
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      Record conversation with the prospect, update their requirements, and schedule the next interaction.
                    </p>
                  </div>

                  {/* Contact Method */}
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                      Contact Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPurpose('CALL')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          purpose === 'CALL'
                            ? 'bg-blue-50 border-brand-primary text-brand-primary shadow-xs'
                            : 'border-edge hover:bg-surface-subtle text-content-secondary'
                        }`}
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPurpose('WHATSAPP')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          purpose === 'WHATSAPP'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                            : 'border-edge hover:bg-surface-subtle text-content-secondary'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPurpose('EMAIL')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          purpose === 'EMAIL'
                            ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-xs'
                            : 'border-edge hover:bg-surface-subtle text-content-secondary'
                        }`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>

                  {/* Enquiry Requirement Updates */}
                  <div className="p-3 bg-surface-subtle/50 border border-edge rounded-lg space-y-2.5">
                    <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                      <FileEdit className="h-3.5 w-3.5 text-indigo-600" />
                      Enquiry Detail Updates
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={enquiryProjectName}
                          onChange={(e) => setEnquiryProjectName(e.target.value)}
                          placeholder="e.g. Greenwood Heights"
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Requirement Details
                        </label>
                        <input
                          type="text"
                          value={enquiryRequirement}
                          onChange={(e) => setEnquiryRequirement(e.target.value)}
                          placeholder="e.g. 3 BHK High Rise + Study"
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Budget Min (₹)
                        </label>
                        <input
                          type="number"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          placeholder="500000"
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Budget Max (₹)
                        </label>
                        <input
                          type="number"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                          placeholder="1200000"
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buyer Readiness Qualification (BANT Scoring) */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200/70 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Grid3X3 className="h-3.5 w-3.5 text-brand-primary" />
                        Buyer Readiness Qualification (BANT Scoring)
                      </span>
                      {leadDetail?.qualification?.isQualified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {leadDetail.qualification.scoreLabel} ({leadDetail.qualification.priority})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Unscored
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Budget Readiness
                        </label>
                        <select
                          value={budgetStatus}
                          onChange={(e) => {
                            setBudgetStatus(e.target.value as BudgetStatus);
                            setHasQualificationUpdated(true);
                          }}
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        >
                          <option value="VERIFIED_BUDGET">Verified Funds / Cash (+30 pts)</option>
                          <option value="LOAN_PRE_APPROVED">Loan Pre-Approved (+25 pts)</option>
                          <option value="STRETCH_BUDGET">Stretch / Assistance Needed (+15 pts)</option>
                          <option value="UNCONFIRMED">Budget Unconfirmed (+0 pts)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Purchase Timeline
                        </label>
                        <select
                          value={timeline}
                          onChange={(e) => {
                            setTimeline(e.target.value as PurchaseTimeline);
                            setHasQualificationUpdated(true);
                          }}
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        >
                          <option value="IMMEDIATE">Immediate (&lt; 30 days) (+30 pts)</option>
                          <option value="WITHIN_30_DAYS">Within 30–60 days (+25 pts)</option>
                          <option value="WITHIN_90_DAYS">Within 90 days / 1–3 mos (+15 pts)</option>
                          <option value="ABOVE_90_DAYS">Above 90 days / Exploratory (+5 pts)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Decision Maker
                        </label>
                        <select
                          value={decisionMaker}
                          onChange={(e) => {
                            setDecisionMaker(e.target.value as DecisionMaker);
                            setHasQualificationUpdated(true);
                          }}
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        >
                          <option value="SOLE_DECISION_MAKER">Sole Buyer (+20 pts)</option>
                          <option value="JOINT_DECISION_MAKER">Joint / Family (+15 pts)</option>
                          <option value="INFLUENCER_ONLY">Influencer / On Behalf (+5 pts)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                          Requirement Clarity
                        </label>
                        <select
                          value={needClarity}
                          onChange={(e) => {
                            setNeedClarity(e.target.value as RequirementClarity);
                            setHasQualificationUpdated(true);
                          }}
                          className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                        >
                          <option value="SPECIFIC_UNIT_TYPE">Specific Unit Shortlisted (+20 pts)</option>
                          <option value="GENERAL_REQUIREMENT">General Category Aligned (+10 pts)</option>
                          <option value="EXPLORATORY">Exploratory / Browsing (+5 pts)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-content-secondary">Matrix Priority:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPriority('HOT');
                          setHasQualificationUpdated(true);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          priority === 'HOT'
                            ? 'bg-red-50 text-status-danger border-red-300 font-extrabold'
                            : 'bg-white text-content-secondary border-edge hover:bg-slate-50'
                        }`}
                      >
                        Hot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPriority('POSSIBLE');
                          setHasQualificationUpdated(true);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          priority === 'POSSIBLE'
                            ? 'bg-slate-200 text-slate-800 border-slate-300 font-extrabold'
                            : 'bg-white text-content-secondary border-edge hover:bg-slate-50'
                        }`}
                      >
                        Poss.
                      </button>
                    </div>
                  </div>

                  {/* Outcome Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Follow-up Outcome <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="modal-follow-up-outcome"
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value as any)}
                      className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs font-medium text-content-primary focus:outline-none focus:border-brand-primary"
                    >
                      <option value="CONNECTED">Connected & Discussed</option>
                      <option value="CALL_BACK_REQUESTED">Call Back Requested</option>
                      <option value="NO_ANSWER">No Answer / Busy</option>
                      <option value="SWITCHED_OFF">Switched Off / Not Reachable</option>
                      <option value="MEETING_SCHEDULED">Meeting Agreed</option>
                      <option value="NOT_INTERESTED">Not Interested / Lost</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {outcome !== 'MEETING_SCHEDULED' && (
                      <p className="mt-1.5 text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>
                          {outcome === 'NOT_INTERESTED'
                            ? 'Step 2 (Meeting Plan) stays locked. Save log to mark lead as Rejected / Lost.'
                            : 'Step 2 (Meeting Plan) unlocks only when outcome is "Meeting Agreed".'}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Conditional Next Follow-Up Schedule */}
                  {outcome === 'CALL_BACK_REQUESTED' && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Scheduled Next Callback Required</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                            Next Follow-Up Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-next-follow-up-date"
                            type="date"
                            value={nextFollowUpDate}
                            onChange={(e) => setNextFollowUpDate(e.target.value)}
                            required
                            className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                            Next Follow-Up Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-next-follow-up-time"
                            type="time"
                            value={nextFollowUpTime}
                            onChange={(e) => setNextFollowUpTime(e.target.value)}
                            required
                            className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remark / Notes (Required) */}
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Conversation Remark / Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="modal-follow-up-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Record the conversation, customer response, buyer sentiment, and next action..."
                      required
                      className="w-full p-2.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------
               * STEP 2: MEETING PLAN
               * ------------------------------------------------------- */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-950 mb-0.5">
                        <Users className="h-4 w-4 text-purple-700 shrink-0" />
                        <span>Step 2: Meeting Plan & Consultation</span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-relaxed">
                        Plan and coordinate face-to-face or virtual consultations. Creating a plan does not mark it complete; explicitly confirm completion once conducted.
                      </p>
                    </div>
                    {isMeetingCancelled && !isReschedulingMeeting && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Meeting Cancelled
                      </span>
                    )}
                  </div>

                  {/* Cancelled Banner */}
                  {isMeetingCancelled && !isReschedulingMeeting && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Meeting Plan Cancelled
                        </span>
                        {leadDetail?.meetingPlan?.cancelledAt && (
                          <span className="text-[11px] text-rose-700">
                            Cancelled on {new Date(leadDetail.meetingPlan.cancelledAt).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-rose-950 bg-white/80 p-2.5 rounded border border-rose-100 space-y-1">
                        <p><strong>Reason:</strong> {leadDetail?.meetingPlan?.cancellationReason || 'N/A'}</p>
                        {(leadDetail?.meetingPlan?.previousDate || leadDetail?.meetingPlan?.meetingDate) && (
                          <p className="text-[11px] text-rose-800">
                            <strong>Previous Schedule:</strong> {leadDetail?.meetingPlan?.previousDate || leadDetail?.meetingPlan?.meetingDate} at {leadDetail?.meetingPlan?.previousTime || leadDetail?.meetingPlan?.meetingTime || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setIsReschedulingMeeting(true)}
                        >
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Reschedule Meeting
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  {(!isMeetingCancelled || isReschedulingMeeting) && (
                    <>
                      {isReschedulingMeeting && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
                          <span>Rescheduling meeting: choose new date/time below.</span>
                          <Button size="sm" variant="outline" onClick={() => setIsReschedulingMeeting(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Meeting Place / Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-meeting-place"
                            type="text"
                            value={meetingPlace}
                            onChange={(e) => setMeetingPlace(e.target.value)}
                            placeholder="e.g. Main Sales Gallery or Client Office"
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Project Details <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-meeting-project"
                            type="text"
                            value={meetingProject}
                            onChange={(e) => setMeetingProject(e.target.value)}
                            placeholder="e.g. Greenwood Heights Tower B Unit 402"
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Meeting Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-meeting-date"
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Meeting Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-meeting-time"
                            type="time"
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>
                      </div>

                      {/* Manager Selection (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-content-secondary mb-1">
                          Assisting Manager (Optional)
                        </label>
                        <select
                          value={meetingManagerId}
                          onChange={(e) => setMeetingManagerId(e.target.value)}
                          className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                        >
                          <option value="">None / Not Assigned</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.role === 'ADMIN' ? `Direct Admin — ${m.name}` : m.name} ({m.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remarks & Result */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Meeting Remarks / Agenda
                          </label>
                          <textarea
                            id="modal-meeting-remarks"
                            value={meetingRemarks}
                            onChange={(e) => setMeetingRemarks(e.target.value)}
                            rows={2}
                            placeholder="Key discussion points, floor plans reviewed..."
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Meeting Result / Outcome
                          </label>
                          <textarea
                            id="modal-meeting-result"
                            value={meetingResult}
                            onChange={(e) => setMeetingResult(e.target.value)}
                            rows={2}
                            placeholder="Client sentiment, requested changes, readiness..."
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>
                      </div>

                      {/* Completion Checkbox */}
                      <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="meeting-completed"
                          checked={isMeetingCompleted}
                          onChange={(e) => setIsMeetingCompleted(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="meeting-completed" className="text-xs text-purple-950">
                          <strong className="block font-semibold">Mark Meeting as Completed</strong>
                          <span className="text-[11px] text-content-muted leading-snug">
                            Check this box once the consultation has concluded to unlock the Site Visit Plan.
                          </span>
                        </label>
                      </div>

                      {/* Cancel Meeting Action */}
                      {!isMeetingCancelled && Boolean(leadDetail?.meetingPlan?.meetingDate) && !leadDetail?.meetingPlan?.isCompleted && (
                        <div className="pt-1 flex justify-start">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-700 border-rose-300 hover:bg-rose-50"
                            onClick={() => handleOpenCancelModal('MEETING')}
                            disabled={isSubmitting}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                            Cancel Meeting
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------
               * STEP 3: SITE VISIT PLAN
               * ------------------------------------------------------- */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 mb-0.5">
                        <MapPin className="h-4 w-4 text-amber-700 shrink-0" />
                        <span>Step 3: Site Visit Plan & Property Tour</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Schedule on-site property walkthroughs and demo unit inspections. Explicitly mark completed to unlock Deal Done.
                      </p>
                    </div>
                    {isSiteVisitCancelled && !isReschedulingSiteVisit && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Site Visit Cancelled
                      </span>
                    )}
                  </div>

                  {/* Cancelled Banner */}
                  {isSiteVisitCancelled && !isReschedulingSiteVisit && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Site Visit Plan Cancelled
                        </span>
                        {leadDetail?.siteVisitPlan?.cancelledAt && (
                          <span className="text-[11px] text-rose-700">
                            Cancelled on {new Date(leadDetail.siteVisitPlan.cancelledAt).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-rose-950 bg-white/80 p-2.5 rounded border border-rose-100 space-y-1">
                        <p><strong>Reason:</strong> {leadDetail?.siteVisitPlan?.cancellationReason || 'N/A'}</p>
                        {(leadDetail?.siteVisitPlan?.previousDate || leadDetail?.siteVisitPlan?.siteVisitDate) && (
                          <p className="text-[11px] text-rose-800">
                            <strong>Previous Schedule:</strong> {leadDetail?.siteVisitPlan?.previousDate || leadDetail?.siteVisitPlan?.siteVisitDate} at {leadDetail?.siteVisitPlan?.previousTime || leadDetail?.siteVisitPlan?.siteVisitTime || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setIsReschedulingSiteVisit(true)}
                        >
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          Reschedule Site Visit
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  {(!isSiteVisitCancelled || isReschedulingSiteVisit) && (
                    <>
                      {isReschedulingSiteVisit && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
                          <span>Rescheduling site visit: choose new date/time below.</span>
                          <Button size="sm" variant="outline" onClick={() => setIsReschedulingSiteVisit(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Site Visit Address / Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-site-visit-address"
                            type="text"
                            value={siteVisitAddress}
                            onChange={(e) => setSiteVisitAddress(e.target.value)}
                            placeholder="e.g. Sector 45 Greenwood Site Office"
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Project Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-site-visit-project"
                            type="text"
                            value={siteVisitProject}
                            onChange={(e) => setSiteVisitProject(e.target.value)}
                            placeholder="e.g. Greenwood Heights"
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Site Visit Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-site-visit-date"
                            type="date"
                            value={siteVisitDate}
                            onChange={(e) => setSiteVisitDate(e.target.value)}
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Site Visit Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="modal-site-visit-time"
                            type="time"
                            value={siteVisitTime}
                            onChange={(e) => setSiteVisitTime(e.target.value)}
                            required
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>
                      </div>

                      {/* Manager Selection (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-content-secondary mb-1">
                          Host Manager / Escort (Optional)
                        </label>
                        <select
                          value={siteVisitManagerId}
                          onChange={(e) => setSiteVisitManagerId(e.target.value)}
                          className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                        >
                          <option value="">None / Not Assigned</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.role === 'ADMIN' ? `Direct Admin — ${m.name}` : m.name} ({m.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Visit Outcome & Remarks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Visit Remarks
                          </label>
                          <textarea
                            id="modal-site-visit-remarks"
                            value={siteVisitRemarks}
                            onChange={(e) => setSiteVisitRemarks(e.target.value)}
                            rows={2}
                            placeholder="Specific units inspected, family members present..."
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content-secondary mb-1">
                            Visit Outcome / Client Feedback
                          </label>
                          <textarea
                            id="modal-site-visit-outcome"
                            value={siteVisitOutcome}
                            onChange={(e) => setSiteVisitOutcome(e.target.value)}
                            rows={2}
                            placeholder="Client reaction to layout, floor, view, ready to proceed..."
                            className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                          />
                        </div>
                      </div>

                      {/* Completion Checkbox */}
                      <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="sitevisit-completed"
                          checked={isSiteVisitCompleted}
                          onChange={(e) => setIsSiteVisitCompleted(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="sitevisit-completed" className="text-xs text-amber-950">
                          <strong className="block font-semibold">Mark Site Visit as Completed</strong>
                          <span className="text-[11px] text-content-muted leading-snug">
                            Check this box once the physical site tour has concluded to unlock Deal Done.
                          </span>
                        </label>
                      </div>

                      {/* Cancel Site Visit Action */}
                      {!isSiteVisitCancelled && Boolean(leadDetail?.siteVisitPlan?.siteVisitDate) && !leadDetail?.siteVisitPlan?.isCompleted && (
                        <div className="pt-1 flex justify-start">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-700 border-rose-300 hover:bg-rose-50"
                            onClick={() => handleOpenCancelModal('SITE_VISIT')}
                            disabled={isSubmitting}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                            Cancel Site Visit
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------
               * STEP 4: DEAL DONE
               * ------------------------------------------------------- */}
              {activeStep === 4 && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 mb-0.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span>Step 4: Deal Done & Booking Confirmation</span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Finalize commercial agreement, token booking amount, and unit details. Requires explicit confirmation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Final Project <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="modal-deal-project"
                        type="text"
                        value={dealProject}
                        onChange={(e) => setDealProject(e.target.value)}
                        placeholder="e.g. Greenwood Heights"
                        required
                        className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="modal-deal-property-type"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                      >
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Plot">Plot</option>
                        <option value="Commercial Office">Commercial Office</option>
                        <option value="Retail Space">Retail Space</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Final Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="modal-deal-price"
                          type="number"
                          value={dealPrice}
                          onChange={(e) => setDealPrice(e.target.value)}
                          placeholder="1250000"
                          required
                          className="w-full pl-7 pr-2.5 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                        />
                        <IndianRupee className="h-3.5 w-3.5 text-content-muted absolute left-2 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Unit Size / Configuration <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="modal-deal-size"
                        type="text"
                        value={dealSize}
                        onChange={(e) => setDealSize(e.target.value)}
                        placeholder="e.g. 1850 sq ft (3 BHK + 3T)"
                        required
                        className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Deal Remarks / Payment Plan Notes
                    </label>
                    <textarea
                      id="modal-deal-remarks"
                      value={dealRemarks}
                      onChange={(e) => setDealRemarks(e.target.value)}
                      rows={2}
                      placeholder="e.g. Booking token of ₹50,000 received. Agreement signing scheduled for Friday."
                      className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                    />
                  </div>

                  {/* Explicit Confirmation Checkbox */}
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="deal-confirmed"
                      checked={isDealConfirmed}
                      onChange={(e) => setIsDealConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="deal-confirmed" className="text-xs text-emerald-950 font-medium">
                      <strong className="block font-bold">Explicit Deal Closure Confirmation</strong>
                      <span className="text-[11px] text-emerald-800">
                        I confirm that commercials are agreed, token deposit is verified, and this deal is finalized.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------
               * COMMON: OPERATIONAL STATUS & CLOSING WORKFLOW
               * ------------------------------------------------------- */}
              <div className="p-3 bg-surface-subtle/50 border border-edge rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-content-muted" />
                    Lead Operational Status
                  </span>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as any)}
                    className="text-xs font-semibold border border-edge rounded-md px-2 py-1 bg-white text-content-primary"
                  >
                    <option value="ACTIVE">ACTIVE (Ongoing in Pipeline)</option>
                    <option value="CLOSED">CLOSED (Won or Lost/Disqualified)</option>
                  </select>
                </div>

                {leadStatus === 'CLOSED' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                      Closing Reason <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modal-closing-reason"
                      type="text"
                      value={closingReason}
                      onChange={(e) => setClosingReason(e.target.value)}
                      placeholder="e.g. Deal successfully won, budget mismatch, bought elsewhere..."
                      required
                      className="w-full p-1.5 bg-white border border-edge rounded text-xs text-content-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
         * MODAL FOOTER & ACTION CONTROLS
         * ========================================================= */}
        <div className="p-4 px-6 border-t border-edge bg-surface-subtle/30 flex items-center justify-between gap-3 shrink-0">
          <div>
            {activeTab === 'workflow' && activeStep > 1 && (
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowLeft className="h-3.5 w-3.5" />}
                onClick={() => setActiveStep((curr) => Math.max(1, curr - 1))}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Close
            </Button>

            {activeTab === 'workflow' && (
              <>
                {/* Save Current Step Data (Keeps current step) */}
                <Button
                  size="sm"
                  variant={activeStep === 1 && outcome !== 'MEETING_SCHEDULED' ? 'primary' : 'outline'}
                  onClick={() => handleSaveStep(false)}
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : undefined}
                >
                  {activeStep === 1 && outcome !== 'MEETING_SCHEDULED'
                    ? 'Save Follow-Up Status'
                    : `Save Step ${activeStep}`}
                </Button>

                {/* Advance or Finalize Button */}
                {activeStep < 4 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSaveStep(true)}
                    disabled={
                      isSubmitting ||
                      (activeStep === 1 && outcome !== 'MEETING_SCHEDULED') ||
                      (activeStep === 2 && !isMeetingCompleted) ||
                      (activeStep === 3 && !isSiteVisitCompleted)
                    }
                    title={
                      activeStep === 1 && outcome !== 'MEETING_SCHEDULED'
                        ? 'Select "Meeting Agreed" as Follow-up Outcome to unlock Meeting Plan'
                        : undefined
                    }
                    icon={
                      isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : activeStep === 1 && outcome !== 'MEETING_SCHEDULED' ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {activeStep === 1
                      ? 'Save & Proceed to Meeting'
                      : activeStep === 2
                      ? 'Proceed to Site Visit'
                      : 'Proceed to Deal Done'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSaveStep(false)}
                    disabled={isSubmitting || !isDealConfirmed}
                    icon={
                      isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )
                    }
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    Save & Finalize Deal
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {/* REQ-31: Cancellation Modal Dialog */}
        {cancelModalState.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {cancelModalState.type === 'MEETING' ? 'Cancel Scheduled Meeting' : 'Cancel Scheduled Site Visit'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Record mandatory reason for cancellation. The lead will remain at this workflow step and can be rescheduled.
                  </p>
                </div>
              </div>

              {cancelModalError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
                  {cancelModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="modal-cancel-reason"
                  rows={3}
                  value={cancelReasonInput}
                  onChange={(e) => {
                    setCancelReasonInput(e.target.value);
                    if (cancelModalError) setCancelModalError(null);
                  }}
                  placeholder="Enter mandatory cancellation reason..."
                  className="w-full p-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelModalState({ isOpen: false, type: 'MEETING' })}
                  disabled={isCancellingPlan}
                >
                  Keep {cancelModalState.type === 'MEETING' ? 'Meeting' : 'Site Visit'}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={handleConfirmCancelPlan}
                  disabled={isCancellingPlan || !cancelReasonInput.trim()}
                >
                  {isCancellingPlan ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
