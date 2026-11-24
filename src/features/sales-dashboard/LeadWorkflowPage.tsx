import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PhoneCall,
  MessageSquare,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building,
  IndianRupee,
  MapPin,
  Lock,
  RefreshCw,
  History,
  ShieldAlert,
  Tag,
  Check,
  ChevronRight,
  Briefcase,
  Layers,
  XCircle,
  Grid3X3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { useAuth } from '../../context/AuthContext.js';
import Swal from 'sweetalert2';
import {
  IEnquiry,
  ActiveManagerSummary,
  BudgetStatus,
  PurchaseTimeline,
  DecisionMaker,
  RequirementClarity,
  LeadPriority,
  PREDEFINED_REJECTION_REASONS,
  DEAL_LOST_REASONS,
  TaskStatus,
  IFollowUpTaskClient,
  UpdateTaskStatusPayload,
  DNC_ACTIVATION_REASONS,
  DNC_ACTIVATION_REASON_LABELS,
  DNC_REVOCATION_REASONS,
  DNC_REVOCATION_REASON_LABELS,
  DncActivationReason,
  DncDetails,
} from '../../types/enquiry.types.js';

export const LeadWorkflowPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data State
  const [lead, setLead] = useState<IEnquiry | null>(null);
  const [managers, setManagers] = useState<ActiveManagerSummary[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [activityList, setActivityList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workflow' | 'history'>('workflow');

  // Active workflow step in view (1 = Follow-up, 2 = Meeting, 3 = Site Visit, 4 = Deal Done)
  const [activeStep, setActiveStep] = useState<number>(1);

  // ---------------------------------------------------------------------------
  // Step 1: Follow-up State
  // ---------------------------------------------------------------------------
  const [purpose, setPurpose] = useState<'CALL' | 'WHATSAPP' | 'EMAIL'>('CALL');
  const [outcome, setOutcome] = useState<
    'CONNECTED' | 'NO_ANSWER' | 'CALL_BACK_REQUESTED' | 'MEETING_SCHEDULED' | 'NOT_INTERESTED' | 'OTHER'
  >('CONNECTED');
  const [followUpDate, setFollowUpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split('T')[0];
  });
  const [nextFollowUpTime, setNextFollowUpTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');
  const discussionNotesRef = useRef<HTMLTextAreaElement>(null);
  const [enquiryProjectName, setEnquiryProjectName] = useState<string>('');
  const [enquiryPreferredLocation, setEnquiryPreferredLocation] = useState<string>('');
  const [enquiryRequirement, setEnquiryRequirement] = useState<string>('');
  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>('UNCONFIRMED');
  const [timeline, setTimeline] = useState<PurchaseTimeline>('ABOVE_90_DAYS');
  const [decisionMaker, setDecisionMaker] = useState<DecisionMaker>('INFLUENCER_ONLY');
  const [needClarity, setNeedClarity] = useState<RequirementClarity>('EXPLORATORY');
  const [priority, setPriority] = useState<LeadPriority>('POSSIBLE');
  const [hasQualificationUpdated, setHasQualificationUpdated] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Step 2: Meeting Plan State
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Step 3: Site Visit Plan State
  // ---------------------------------------------------------------------------
  const [siteVisitAddress, setSiteVisitAddress] = useState<string>('');
  const [siteVisitDate, setSiteVisitDate] = useState<string>('');
  const [siteVisitTime, setSiteVisitTime] = useState<string>('11:00');
  const [siteVisitProject, setSiteVisitProject] = useState<string>('');
  const [siteVisitManagerId, setSiteVisitManagerId] = useState<string>('');
  const [siteVisitRemarks, setSiteVisitRemarks] = useState<string>('');
  const [siteVisitOutcome, setSiteVisitOutcome] = useState<string>('');
  const [isSiteVisitCompleted, setIsSiteVisitCompleted] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Step 4: Deal Done State
  // ---------------------------------------------------------------------------
  const [dealProject, setDealProject] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('Apartment');
  const [dealPrice, setDealPrice] = useState<string>('');
  const [dealSize, setDealSize] = useState<string>('');
  const [dealRemarks, setDealRemarks] = useState<string>('');
  const [isDealConfirmed, setIsDealConfirmed] = useState<boolean>(false);
  const [isDealCompletedConfirmationOpen, setIsDealCompletedConfirmationOpen] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Lead Closure & Rejection Dialog State
  // ---------------------------------------------------------------------------
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState<boolean>(false);
  const [closingReason, setClosingReason] = useState<string>('');
  const [closeError, setCloseError] = useState<string | null>(null);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>(PREDEFINED_REJECTION_REASONS[0]);
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [isRejectionConfirmed, setIsRejectionConfirmed] = useState<boolean>(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // REQ-36: Deal Lost Dialog State
  const [isDealLostDialogOpen, setIsDealLostDialogOpen] = useState<boolean>(false);
  const [dealLostReason, setDealLostReason] = useState<string>(DEAL_LOST_REASONS[0]);
  const [dealLostRemarks, setDealLostRemarks] = useState<string>('');
  const [isDealLostConfirmed, setIsDealLostConfirmed] = useState<boolean>(false);
  const [dealLostError, setDealLostError] = useState<string | null>(null);

  // REQ-38: Do Not Contact (DNC) Dialog States
  const [isDncDialogOpen, setIsDncDialogOpen] = useState<boolean>(false);
  const [dncReason, setDncReason] = useState<string>(DNC_ACTIVATION_REASONS[0]);
  const [dncRemarks, setDncRemarks] = useState<string>('');
  const [dncError, setDncError] = useState<string | null>(null);

  const [isRevokeDncDialogOpen, setIsRevokeDncDialogOpen] = useState<boolean>(false);
  const [revokeDncReason, setRevokeDncReason] = useState<string>(DNC_REVOCATION_REASONS[0]);
  const [revokeDncRemarks, setRevokeDncRemarks] = useState<string>('');
  const [revokeDncError, setRevokeDncError] = useState<string | null>(null);
  const [dncDetails, setDncDetails] = useState<DncDetails | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeletingLead, setIsDeletingLead] = useState<boolean>(false);

  // REQ-22: Task Status Tracking State
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<IFollowUpTaskClient | null>(null);
  const [targetTaskStatus, setTargetTaskStatus] = useState<TaskStatus | ''>('');
  const [taskStatusNotes, setTaskStatusNotes] = useState<string>('');
  const [taskCancellationReason, setTaskCancellationReason] = useState<string>('');
  const [taskRescheduledDate, setTaskRescheduledDate] = useState<string>('');
  const [taskRescheduledTime, setTaskRescheduledTime] = useState<string>('10:00');
  const [isUpdatingTaskStatus, setIsUpdatingTaskStatus] = useState<boolean>(false);
  const [taskStatusError, setTaskStatusError] = useState<string | null>(null);
  const [taskStatusSuccess, setTaskStatusSuccess] = useState<string | null>(null);

  const ALLOWED_TASK_TRANSITIONS: Record<string, TaskStatus[]> = {
    PENDING: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'RESCHEDULED'],
    RESCHEDULED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };

  const handleOpenStatusModal = (task: any) => {
    setSelectedTaskForStatus(task);
    setTargetTaskStatus('');
    setTaskStatusNotes('');
    setTaskCancellationReason('');
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    setTaskRescheduledDate(tmr.toISOString().split('T')[0]);
    setTaskRescheduledTime(task.followUpTime || '10:00');
    setTaskStatusError(null);
    setTaskStatusSuccess(null);
  };

  const handleCloseStatusModal = () => {
    setSelectedTaskForStatus(null);
    setTargetTaskStatus('');
    setTaskStatusError(null);
    setTaskStatusSuccess(null);
  };

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

  const handleUpdateTaskStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !selectedTaskForStatus) return;
    if (!targetTaskStatus) {
      setTaskStatusError('Please select a valid new task status.');
      return;
    }

    if (targetTaskStatus === 'CANCELLED' && !taskCancellationReason.trim()) {
      setTaskStatusError('Cancellation reason is mandatory when cancelling a task.');
      return;
    }

    if (targetTaskStatus === 'RESCHEDULED') {
      if (!taskRescheduledDate.trim()) {
        setTaskStatusError('A valid new date is required when rescheduling.');
        return;
      }
      if (!taskRescheduledTime.trim()) {
        setTaskStatusError('A valid new time is required when rescheduling.');
        return;
      }
    }

    try {
      setIsUpdatingTaskStatus(true);
      setTaskStatusError(null);

      const payload: UpdateTaskStatusPayload = {
        status: targetTaskStatus,
        notes: taskStatusNotes.trim() || undefined,
        cancellationReason: targetTaskStatus === 'CANCELLED' ? taskCancellationReason.trim() : undefined,
        followUpDate: targetTaskStatus === 'RESCHEDULED' ? taskRescheduledDate.trim() : undefined,
        followUpTime: targetTaskStatus === 'RESCHEDULED' ? taskRescheduledTime.trim() : undefined,
        rescheduledDate: targetTaskStatus === 'RESCHEDULED' ? taskRescheduledDate.trim() : undefined,
        rescheduledTime: targetTaskStatus === 'RESCHEDULED' ? taskRescheduledTime.trim() : undefined,
      };

      const res = await enquiryService.updateTaskStatus(leadId, selectedTaskForStatus._id, payload);

      if (res.success) {
        setTaskStatusSuccess(`Task status successfully updated to ${targetTaskStatus}.`);
        await loadLeadData(false);
        setTimeout(() => {
          handleCloseStatusModal();
        }, 1000);
      } else {
        setTaskStatusError(res.message || 'Failed to update task status.');
      }
    } catch (err: any) {
      setTaskStatusError(err?.message || 'An error occurred while updating task status.');
    } finally {
      setIsUpdatingTaskStatus(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Fetch Lead & Related Data
  // ---------------------------------------------------------------------------
  const loadLeadData = useCallback(async (isInitialLoad: boolean = false) => {
    if (!leadId) return;

    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [leadRes, mgrRes, followUpsRes, actsRes] = await Promise.all([
        enquiryService.getEnquiryById(leadId),
        enquiryService.getActiveManagers(),
        enquiryService.getFollowUps(leadId),
        enquiryService.getActivities(leadId),
      ]);

      if (leadRes.statusCode === 403 || leadRes.error === 'Forbidden') {
        setError('Access Denied: You do not have permission to access or manage this enquiry.');
        setIsLoading(false);
        return;
      }

      if (leadRes.statusCode === 404 || !leadRes.success || !leadRes.data?.enquiry) {
        setError('Enquiry not found or could not be loaded from database.');
        setIsLoading(false);
        return;
      }

      const e = leadRes.data.enquiry;
      setLead(e);

      // REQ-38: Load Do Not Contact details if lead is DNC restricted
      if (e.isDoNotContact) {
        try {
          const dncRes = await enquiryService.getDoNotContactStatus(leadId);
          if (dncRes.success && dncRes.data?.details) {
            setDncDetails(dncRes.data.details);
          }
        } catch {
          // Ignore failure to load additional DNC metadata
        }
      } else {
        setDncDetails(null);
      }

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

      // Populate Requirement Fields
      setEnquiryProjectName(e.projectName || '');
      setEnquiryPreferredLocation(e.preferredLocation || '');
      setEnquiryRequirement(e.requirement || '');
      setBudgetMin(e.budgetMin ? String(e.budgetMin) : '');
      setBudgetMax(e.budgetMax ? String(e.budgetMax) : '');

      // Populate Lead Qualification
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

      // Populate Step 1: Follow-up Contact Purpose
      // Consistently lock to customer's original preferred contact method if available!
      if (e.preferredContactMethod) {
        setPurpose(e.preferredContactMethod);
      } else {
        setPurpose('CALL');
      }

      // Populate Step 2: Meeting Plan
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

      // Populate Step 3: Site Visit Plan
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

      // Populate Step 4: Deal Done
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

      // Synchronize activeStep strictly with the persisted currentStage
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
    } catch (err: unknown) {
      setError('A network error occurred while retrieving lead data from the backend.');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLeadData(true);
  }, [loadLeadData]);

  // Step Completion & Unlocked Logic
  const hasCompletedDiscussion = Boolean(
    historyList.some(
      (t) =>
        t.status === 'COMPLETED' ||
        (!t.isInitialTask && t.notes && t.notes !== 'System initialized pending follow-up task')
    ) ||
    activityList.some(
      (a) => a.metadata?.step === 'FOLLOW_UP' || a.activityType === 'FOLLOW_UP_COMPLETED'
    )
  );
  const isStep1Done = Boolean(lead && (lead.currentStage !== 'FOLLOW_UP' || hasCompletedDiscussion));
  const isMeetingUnlocked = Boolean(isStep1Done);
  const isMeetingCompletedFinal = Boolean(lead?.meetingPlan?.isCompleted);
  const isMeetingCancelled = Boolean(lead?.meetingPlan?.isCancelled);
  const isSiteVisitCancelled = Boolean(lead?.siteVisitPlan?.isCancelled);

  const handleOpenCancelModal = (type: 'MEETING' | 'SITE_VISIT') => {
    setCancelReasonInput('');
    setCancelModalError(null);
    setCancelModalState({ isOpen: true, type });
  };

  const handleConfirmCancelPlan = async () => {
    const reason = cancelReasonInput.trim();
    if (!reason) {
      setCancelModalError('Cancellation reason is mandatory and cannot be empty.');
      showWarningPopup('Cancellation reason is mandatory and cannot be empty.', 'cancel-plan-reason');
      return;
    }

    if (!lead || !leadId) return;

    setIsCancellingPlan(true);
    setCancelModalError(null);

    try {
      let res;
      if (cancelModalState.type === 'MEETING') {
        res = await enquiryService.cancelMeetingPlan(leadId, reason);
      } else {
        res = await enquiryService.cancelSiteVisitPlan(leadId, reason);
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
      await loadLeadData(false);
    } catch (err: any) {
      const errorMsg = err?.message || 'A network error occurred while cancelling the plan.';
      setCancelModalError(errorMsg);
      showErrorPopup(errorMsg);
    } finally {
      setIsCancellingPlan(false);
    }
  };
  const isSiteVisitUnlocked = Boolean(isMeetingCompletedFinal);
  const isSiteVisitCompletedFinal = Boolean(lead?.siteVisitPlan?.isCompleted);
  const isDealDoneUnlocked = Boolean(isSiteVisitCompletedFinal);
  const isDealDoneFinalized = Boolean(lead?.dealDone?.isConfirmed);
  const isRejectedLead = Boolean(lead?.status === 'CLOSED' && lead?.rejection?.reason);

  // ---------------------------------------------------------------------------
  // Save Step Action
  // ---------------------------------------------------------------------------
  const handleSaveStep = async (advance: boolean = false) => {
    if (!lead || !leadId || isSaving) return;

    if (isRejectedLead || lead.status === 'CLOSED') {
      showWarningPopup('Cannot update workflow or finalize Deal Done on a closed or rejected lead.');
      return;
    }

    // REQ-38: Block customer contact actions if Do Not Contact is active
    if (lead.isDoNotContact && activeStep <= 3) {
      showWarningPopup('Customer has requested Do Not Contact. Customer communication and scheduling actions are prohibited.');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    // Frontend validations
    if (activeStep === 1) {
      if (!notes.trim()) {
        showWarningPopup('Follow-up remarks/notes cannot be empty.', 'follow-up-discussion-notes');
        return;
      }
      if (outcome === 'CALL_BACK_REQUESTED') {
        if (!nextFollowUpDate.trim()) {
          showWarningPopup('Next follow-up date is required when outcome is Call Back Requested.', 'next-follow-up-date');
          return;
        }
        if (!nextFollowUpTime.trim()) {
          showWarningPopup('Next follow-up time is required when outcome is Call Back Requested.', 'next-follow-up-time');
          return;
        }
      }
    } else if (activeStep === 2) {
      if (!meetingPlace.trim()) {
        showWarningPopup('Meeting place/address is required.', 'meeting-place');
        return;
      }
      if (!meetingDate.trim()) {
        showWarningPopup('Meeting date is required.', 'meeting-date');
        return;
      }
      if (!meetingTime.trim()) {
        showWarningPopup('Meeting time is required.', 'meeting-time');
        return;
      }
      if (!meetingProject.trim()) {
        showWarningPopup('Project details are required for the meeting.', 'meeting-project');
        return;
      }
      if (isMeetingCompleted && !meetingResult.trim() && !meetingRemarks.trim()) {
        showWarningPopup('Please record meeting result or remarks when marking meeting complete.', 'meeting-result');
        return;
      }
      if (advance && !isMeetingCompleted) {
        showWarningPopup('Meeting must be explicitly marked completed before advancing to Site Visit Plan.', 'meeting-is-completed');
        return;
      }
    } else if (activeStep === 3) {
      if (!siteVisitAddress.trim()) {
        showWarningPopup('Site visit address/location is required.', 'site-visit-address');
        return;
      }
      if (!siteVisitDate.trim()) {
        showWarningPopup('Site visit date is required.', 'site-visit-date');
        return;
      }
      if (!siteVisitTime.trim()) {
        showWarningPopup('Site visit time is required.', 'site-visit-time');
        return;
      }
      if (!siteVisitProject.trim()) {
        showWarningPopup('Project name is required for the site visit.', 'site-visit-project');
        return;
      }
      if (isSiteVisitCompleted && !siteVisitOutcome.trim() && !siteVisitRemarks.trim()) {
        showWarningPopup('Please record visit outcome or remarks when marking site visit complete.', 'site-visit-outcome');
        return;
      }
      if (advance && !isSiteVisitCompleted) {
        showWarningPopup('Site visit must be explicitly marked completed before advancing to Deal Done.', 'site-visit-is-completed');
        return;
      }
    } else if (activeStep === 4) {
      if (!dealProject.trim()) {
        showWarningPopup('Project name is required for Deal Done.', 'deal-project');
        return;
      }
      if (!propertyType.trim()) {
        showWarningPopup('Property type is required for Deal Done.', 'deal-property-type');
        return;
      }
      const priceNum = Number(dealPrice);
      if (!dealPrice.trim() || isNaN(priceNum) || priceNum <= 0) {
        showWarningPopup('A valid positive deal price is required.', 'deal-price');
        return;
      }
      if (!dealSize.trim()) {
        showWarningPopup('Property size is required (e.g., 1850 sqft).', 'deal-size');
        return;
      }
      if (!isDealConfirmed) {
        showWarningPopup('Please check the confirmation box to verify this finalized deal.', 'deal-confirmed');
        return;
      }
    }

    setIsSaving(true);

    try {
      let payload: any = {
        advanceStage: advance,
      };

      if (activeStep === 1) {
        payload = {
          ...payload,
          step: 'FOLLOW_UP',
          purpose,
          outcome,
          followUpDate,
          followUpTime,
          notes: notes.trim(),
          nextFollowUpDate: (outcome === 'CALL_BACK_REQUESTED' || nextFollowUpDate.trim()) ? nextFollowUpDate.trim() : undefined,
          nextFollowUpTime: (outcome === 'CALL_BACK_REQUESTED' || nextFollowUpTime.trim()) ? nextFollowUpTime.trim() : undefined,
          enquiryUpdate: {
            projectName: enquiryProjectName.trim() || undefined,
            preferredLocation: enquiryPreferredLocation.trim() || undefined,
            requirement: enquiryRequirement.trim() || undefined,
            budgetMin: budgetMin.trim() ? Number(budgetMin) : undefined,
            budgetMax: budgetMax.trim() ? Number(budgetMax) : undefined,
          },
          qualification:
            hasQualificationUpdated || budgetStatus !== 'UNCONFIRMED' || timeline !== 'ABOVE_90_DAYS'
              ? {
                  budgetStatus,
                  timeline,
                  decisionMaker,
                  needClarity,
                  priority,
                  notes: notes.trim() || undefined,
                }
              : undefined,
        };
      } else if (activeStep === 2) {
        payload = {
          ...payload,
          step: 'MEETING_PLAN',
          meetingPlace: meetingPlace.trim(),
          meetingDate,
          meetingTime,
          projectDetails: meetingProject.trim(),
          managerId: meetingManagerId.trim() || null,
          remarks: meetingRemarks.trim() || undefined,
          meetingResult: meetingResult.trim() || undefined,
          isCompleted: isMeetingCompleted,
        };
      } else if (activeStep === 3) {
        payload = {
          ...payload,
          step: 'SITE_VISIT_PLAN',
          siteVisitAddress: siteVisitAddress.trim(),
          siteVisitDate,
          siteVisitTime,
          projectName: siteVisitProject.trim(),
          managerId: siteVisitManagerId.trim() || null,
          remarks: siteVisitRemarks.trim() || undefined,
          visitOutcome: siteVisitOutcome.trim() || undefined,
          isCompleted: isSiteVisitCompleted,
        };
      } else if (activeStep === 4) {
        payload = {
          ...payload,
          step: 'DEAL_DONE',
          project: dealProject.trim(),
          propertyType: propertyType.trim(),
          price: Number(dealPrice),
          size: dealSize.trim(),
          remarks: dealRemarks.trim() || undefined,
          isConfirmed: isDealConfirmed,
        };
      }

      const res = await enquiryService.saveWorkflowStep(leadId, payload);

      if (!res.success) {
        showErrorPopup(res.message || 'Failed to save workflow step.');
        setIsSaving(false);
        return;
      }

      setSuccessMessage(
        advance
          ? `Step ${activeStep} saved successfully! Advanced to Step ${Math.min(activeStep + 1, 4)}.`
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

      showSuccessPopup(successMsg);

      // Trigger deal confirmation modal on Step 4 completion
      if (activeStep === 4) {
        setIsDealCompletedConfirmationOpen(true);
      }

      // Clear note field on step 1 after save so agent can enter a new note next time
      if (activeStep === 1) {
        setNotes('');
      }

      // Reload lead data from backend: this updates lead, history, and currentStage cleanly
      await loadLeadData(false);
    } catch (err: unknown) {
      showErrorPopup(err instanceof Error ? err.message : 'A network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Close / Lost Lead Action
  // ---------------------------------------------------------------------------
  const handleCloseLead = async () => {
    if (!lead || !leadId || isSaving) return;

    if (!closingReason.trim()) {
      setCloseError('Please provide a mandatory reason for closing this enquiry.');
      showWarningPopup('Please provide a mandatory reason for closing this enquiry.', 'close-reason');
      return;
    }

    setIsSaving(true);
    setCloseError(null);

    try {
      const res = await enquiryService.changeStatus(leadId, {
        status: 'CLOSED',
        reason: closingReason.trim(),
      });

      if (!res.success) {
        const errorMsg = res.message || 'Failed to close lead.';
        setCloseError(errorMsg);
        showErrorPopup(errorMsg);
        setIsSaving(false);
        return;
      }

      setIsCloseDialogOpen(false);
      showSuccessPopup('Lead has been successfully marked as CLOSED.');
      await loadLeadData(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update lead status.';
      setCloseError(errorMsg);
      showErrorPopup(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectLead = async () => {
    if (!lead || !leadId || isSaving) return;

    if (!rejectionReason) {
      setRejectError('Please select a rejection reason.');
      showWarningPopup('Please select a rejection reason.', 'reject-reason');
      return;
    }

    if (!rejectionRemarks.trim()) {
      setRejectError('Mandatory remarks are required when closing a lead as rejected.');
      showWarningPopup('Mandatory remarks are required when closing a lead as rejected.', 'reject-remarks');
      return;
    }

    if (!isRejectionConfirmed) {
      setRejectError('Please confirm the rejection before final submission.');
      showWarningPopup('Please confirm the rejection before final submission.', 'reject-confirmed');
      return;
    }

    setIsSaving(true);
    setRejectError(null);

    try {
      const res = await enquiryService.rejectLead(leadId, {
        reason: rejectionReason,
        remarks: rejectionRemarks.trim(),
      });

      if (!res.success) {
        const errorMsg = res.message || 'Failed to reject lead.';
        setRejectError(errorMsg);
        showErrorPopup(errorMsg);
        setIsSaving(false);
        return;
      }

      setIsRejectDialogOpen(false);
      showSuccessPopup(`Lead "${lead.name}" has been marked as Rejected / Lost.`);
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
      await loadLeadData(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject lead.';
      setRejectError(errorMsg);
      showErrorPopup(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDealLost = async () => {
    if (!lead || !leadId || isSaving) return;

    if (!dealLostReason) {
      setDealLostError('Please select a deal lost reason.');
      showWarningPopup('Please select a deal lost reason.', 'deal-lost-reason');
      return;
    }

    if (!dealLostRemarks.trim()) {
      setDealLostError('Mandatory remarks are required when marking a deal as lost.');
      showWarningPopup('Mandatory remarks are required when marking a deal as lost.', 'deal-lost-remarks');
      return;
    }

    if (!isDealLostConfirmed) {
      setDealLostError('Please confirm the deal lost action before final submission.');
      showWarningPopup('Please confirm the deal lost action before final submission.', 'deal-lost-confirmed');
      return;
    }

    setIsSaving(true);
    setDealLostError(null);

    try {
      const res = await enquiryService.markDealLost(leadId, {
        reason: dealLostReason,
        remarks: dealLostRemarks.trim(),
      });

      if (!res.success) {
        const errorMsg = res.message || 'Failed to mark deal as lost.';
        setDealLostError(errorMsg);
        showErrorPopup(errorMsg);
        setIsSaving(false);
        return;
      }

      setIsDealLostDialogOpen(false);
      showSuccessPopup(`Opportunity "${lead.name}" has been marked as Deal Lost.`);
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
      await loadLeadData(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark deal as lost.';
      setDealLostError(errorMsg);
      showErrorPopup(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    setIsDeletingLead(true);
    try {
      const res = await enquiryService.deleteEnquiry(lead.id);
      if (res.success) {
        navigate('/leads');
      } else {
        setError(res.message || 'Failed to delete lead.');
        setIsDeleteDialogOpen(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting lead.');
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeletingLead(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REQ-38: Do Not Contact (DNC) Handlers
  // ---------------------------------------------------------------------------
  const handleEnableDnc = async () => {
    if (!lead || !leadId || isSaving) return;
    if (!dncReason) {
      setDncError('Please select a Do Not Contact reason.');
      return;
    }
    if (!dncRemarks.trim()) {
      setDncError('Mandatory remarks are required when enabling Do Not Contact.');
      return;
    }
    setDncError(null);
    setIsSaving(true);
    try {
      const res = await enquiryService.enableDoNotContact(leadId, {
        reason: dncReason,
        remarks: dncRemarks.trim()
      });
      if (!res.success) {
        setDncError(res.message || 'Failed to enable Do Not Contact.');
        setIsSaving(false);
        return;
      }
      setIsDncDialogOpen(false);
      setSuccessMessage('Do Not Contact restriction enabled successfully. All active follow-up tasks have been cancelled.');
      await loadLeadData(false);
    } catch (err: unknown) {
      setDncError(err instanceof Error ? err.message : 'Failed to enable Do Not Contact.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeDnc = async () => {
    if (!lead || !leadId || isSaving) return;
    if (!revokeDncReason) {
      setRevokeDncError('Please select a revocation reason.');
      return;
    }
    if (!revokeDncRemarks.trim()) {
      setRevokeDncError('Mandatory remarks are required when revoking Do Not Contact.');
      return;
    }
    setRevokeDncError(null);
    setIsSaving(true);
    try {
      const res = await enquiryService.revokeDoNotContact(leadId, {
        reason: revokeDncReason,
        remarks: revokeDncRemarks.trim()
      });
      if (!res.success) {
        setRevokeDncError(res.message || 'Failed to revoke Do Not Contact.');
        setIsSaving(false);
        return;
      }
      setIsRevokeDncDialogOpen(false);
      setSuccessMessage('Do Not Contact restriction revoked successfully.');
      await loadLeadData(false);
    } catch (err: unknown) {
      setRevokeDncError(err instanceof Error ? err.message : 'Failed to revoke Do Not Contact.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading & Error Views
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-content-secondary">
          Loading enquiry and workflow data from Atlas...
        </p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-red-900 mb-1">Access or Loading Error</h2>
            <p className="text-sm text-red-700 leading-relaxed mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/sales/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Leads Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  // Currency Formatter Helper
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return 'Not provided';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const assignedAgentName =
    typeof lead.assignedTo === 'object' && lead.assignedTo !== null
      ? lead.assignedTo.name
      : lead.assignedToName || (lead.assignedTo ? 'Assigned Sales Agent' : 'Unassigned');

  return (
    <div className="space-y-6 pb-12">
      {/* -----------------------------------------------------------------------
       * Top Action Header & Breadcrumb
       * --------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-edge">
        <div>
          <button
            type="button"
            onClick={() => navigate('/sales/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-hover mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sales Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              {lead.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isRejectedLead
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : lead.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              {isRejectedLead ? 'REJECTED / LOST' : lead.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-primary border border-blue-200">
              Stage: {lead.currentStage || 'FOLLOW_UP'}
            </span>
            {lead.isDoNotContact && (
              <span
                data-testid="dnc-title-badge"
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1"
              >
                <ShieldAlert className="w-3 h-3 text-red-600" />
                DO NOT CONTACT (DNC)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => loadLeadData(false)}
            disabled={isSaving}
          >
            Refresh Data
          </Button>

          {/* REQ-38: Do Not Contact Actions */}
          {!lead.isDoNotContact ? (
            <Button
              size="sm"
              variant="outline"
              icon={<ShieldAlert className="w-3.5 h-3.5 text-purple-600" />}
              onClick={() => {
                setDncError(null);
                setDncRemarks('');
                setDncReason(DNC_ACTIVATION_REASONS[0]);
                setIsDncDialogOpen(true);
              }}
              className="text-purple-700 border-purple-200 hover:bg-purple-50 font-semibold"
              aria-label="Do Not Contact - Enable DNC"
              data-testid="mark-dnc-btn"
            >
              Do Not Contact
            </Button>
          ) : (
            (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button
                size="sm"
                variant="outline"
                icon={<ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={() => {
                  setRevokeDncError(null);
                  setRevokeDncRemarks('');
                  setRevokeDncReason(DNC_REVOCATION_REASONS[0]);
                  setIsRevokeDncDialogOpen(true);
                }}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
                aria-label="Revoke Do Not Contact"
                data-testid="revoke-dnc-btn"
              >
                Revoke DNC
              </Button>
            )
          )}

          {lead.status === 'ACTIVE' && !isRejectedLead && (
            <div className="flex items-center gap-2" title="Mark Rejected / Lost Actions">
              <Button
                size="sm"
                variant="outline"
                icon={<XCircle className="w-3.5 h-3.5 text-red-600" />}
                onClick={() => {
                  setRejectError(null);
                  setIsRejectionConfirmed(false);
                  setIsRejectDialogOpen(true);
                }}
                className="text-red-700 border-red-200 hover:bg-red-50 font-semibold"
                aria-label="Mark Rejected / Lost - Reject Lead"
              >
                Mark as Rejected
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => {
                  setDealLostError(null);
                  setIsDealLostConfirmed(false);
                  setIsDealLostDialogOpen(true);
                }}
                className="text-amber-700 border-amber-200 hover:bg-amber-50 font-semibold"
                aria-label="Mark Rejected / Lost - Deal Lost"
              >
                Mark as Deal Lost
              </Button>
            </div>
          )}

          {user?.role === 'ADMIN' && !lead.dealDone && lead.currentStage !== 'DEAL_DONE' && (
            <Button
              size="sm"
              variant="outline"
              icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-700 border-red-200 hover:bg-red-50 font-semibold"
            >
              Delete Lead
            </Button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
       * Global Feedback Messages
       * --------------------------------------------------------------------- */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800 leading-relaxed font-medium">{successMessage}</p>
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * REQ-38: Do Not Contact (DNC) Active Banner
       * --------------------------------------------------------------------- */}
      {lead.isDoNotContact && (
        <div
          data-testid="dnc-active-banner"
          className="p-5 rounded-xl space-y-3 border bg-red-50 border-red-300 text-red-900 shadow-xs animate-in fade-in"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-red-900">
                    DO NOT CONTACT (DNC) RESTRICTION ACTIVE
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-200 text-red-800 border border-red-300">
                    DNC RESTRICTED
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-0.5">
                  All customer communication channels (Call, WhatsApp, Email, Meeting, Site Visit) and follow-up reminders are strictly prohibited.
                </p>
              </div>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button
                size="sm"
                variant="outline"
                icon={<ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={() => {
                  setRevokeDncError(null);
                  setRevokeDncRemarks('');
                  setRevokeDncReason(DNC_REVOCATION_REASONS[0]);
                  setIsRevokeDncDialogOpen(true);
                }}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-semibold bg-white"
                data-testid="revoke-dnc-banner-btn"
              >
                Revoke DNC
              </Button>
            )}
          </div>
          {dncDetails && (
            <div className="mt-2 pt-2 border-t border-red-200 text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <span className="font-semibold text-red-800">Reason: </span>
                <span className="text-red-900">
                  {dncDetails.reason ? (DNC_ACTIVATION_REASON_LABELS[dncDetails.reason as DncActivationReason] || dncDetails.reason) : 'Customer Requested'}
                </span>
              </div>
              {dncDetails.activatedByName && (
                <div>
                  <span className="font-semibold text-red-800">Activated By: </span>
                  <span className="text-red-900">{dncDetails.activatedByName}</span>
                </div>
              )}
              {dncDetails.remarks && (
                <div className="sm:col-span-2 md:col-span-3">
                  <span className="font-semibold text-red-800">Remarks: </span>
                  <span className="text-red-900">{dncDetails.remarks}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * REQ-36: Rejected vs Deal Lost Information Card
       * --------------------------------------------------------------------- */}
      {isRejectedLead && (() => {
        const isLost = lead.rejection?.closureType === 'DEAL_LOST';
        const isExplicitReject = lead.rejection?.closureType === 'REJECTED';
        const cardBg = isLost
          ? 'bg-amber-50/80 border-amber-200'
          : isExplicitReject
          ? 'bg-red-50/70 border-red-200'
          : 'bg-slate-50 border-slate-200';
        const iconBg = isLost
          ? 'bg-amber-100 text-amber-700'
          : isExplicitReject
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-700';
        const badgeBg = isLost
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : isExplicitReject
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-slate-200 text-slate-800 border-slate-300';
        const titleText = isLost
          ? 'Lead Marked as Rejected / Lost — Opportunity Marked as Deal Lost'
          : isExplicitReject
          ? 'Lead Marked as Rejected / Lost — Lead Rejected'
          : 'Lead Marked as Rejected / Lost';
        const badgeText = isLost ? 'DEAL LOST' : isExplicitReject ? 'REJECTED' : 'REJECTED / LOST (Legacy)';
        const reasonLabel = isLost ? 'Deal Lost Reason' : 'Rejection Reason';

        return (
          <div className={`p-5 rounded-xl space-y-3 border ${cardBg}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`p-1.5 rounded-lg ${iconBg}`}>
                  {isLost ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {titleText}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {isLost
                      ? 'This deal has concluded without closing and has been archived from active sales operations.'
                      : 'This lead has been archived from the active sales pipeline and cannot advance through the deal workflow.'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
                {badgeText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-200/60">
              <div>
                <span className="font-semibold text-slate-700 uppercase text-[10px] block">
                  {reasonLabel}
                </span>
                <span className="font-bold text-slate-900">
                  {lead.rejection?.reason || 'Closed / Lost'}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 uppercase text-[10px] block">
                  Previous Workflow Stage
                </span>
                <span className="font-bold text-slate-900">
                  {lead.rejection?.previousStage || lead.currentStage || '01. Follow-up'}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 uppercase text-[10px] block">
                  Responsible Sales Agent
                </span>
                <span className="font-bold text-slate-900">
                  {lead.rejection?.rejectedByName ||
                    (typeof lead.rejection?.rejectedBy === 'object'
                      ? (lead.rejection.rejectedBy as any)?.name
                      : null) ||
                    assignedAgentName}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 uppercase text-[10px] block">
                  Rejection Date &amp; Time
                </span>
                <span className="font-bold text-slate-900">
                  {lead.rejection?.rejectedAt
                    ? new Date(lead.rejection.rejectedAt).toLocaleString('en-IN')
                    : new Date(lead.updatedAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {lead.rejection?.remarks && (
              <div className="pt-2 text-xs border-t border-slate-200/60">
                <span className="font-semibold text-slate-700 uppercase text-[10px] block mb-0.5">
                  Remarks / Context:
                </span>
                <p className="text-slate-900 bg-white/80 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                  {lead.rejection.remarks}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* -----------------------------------------------------------------------
       * Section 2: Complete Original Enquiry Card (Displaying All Saved Fields)
       * --------------------------------------------------------------------- */}
      <div className="bg-surface-card border border-edge rounded-card shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-edge flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Building className="w-4 h-4 text-brand-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-primary">
              Original Enquiry Profile (Submitted Details)
            </h2>
          </div>
          <span className="text-[11px] text-content-muted">
            Created: {new Date(lead.createdAt).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Customer Name */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Prospect Name
              </span>
              <p className="font-bold text-content-primary text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {lead.name}
              </p>
            </div>

            {/* 2. Full Mobile Number (Unmasked for Authorized Employee) */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Primary Mobile (Authorized View)
              </span>
              <p className="font-bold text-content-primary text-sm flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <a
                  href={`tel:${lead.mobile}`}
                  className="text-brand-primary hover:underline font-mono"
                  title="Call prospect"
                >
                  {lead.mobile}
                </a>
              </p>
            </div>

            {/* 3. Email Address */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Email Address
              </span>
              <p className="font-medium text-content-primary truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-brand-primary hover:underline">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-content-muted italic">Not provided</span>
                )}
              </p>
            </div>

            {/* 4. Customer Preferred Contact Method (PROMINENT & LOCKED) */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px] flex items-center gap-1">
                Customer Preference
                <Lock className="w-3 h-3 text-slate-400" />
              </span>
              <div>
                {lead.preferredContactMethod ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-brand-primary border border-blue-200">
                    {lead.preferredContactMethod === 'WHATSAPP' && (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {lead.preferredContactMethod === 'EMAIL' && (
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    {lead.preferredContactMethod === 'CALL' && (
                      <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    {lead.preferredContactMethod}
                    <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Original)</span>
                  </span>
                ) : (
                  <span className="text-content-muted italic">Not provided</span>
                )}
              </div>
            </div>

            {/* 5. Project Name */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Interested Project
              </span>
              <p className="font-semibold text-content-primary">
                {lead.projectName || <span className="text-content-muted italic">Not provided</span>}
              </p>
            </div>

            {/* 6. Requirement / Property Type */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Requirement / Spec
              </span>
              <p className="font-semibold text-content-primary">
                {lead.requirement || <span className="text-content-muted italic">Not provided</span>}
              </p>
            </div>

            {/* 7. Budget Range */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Indicated Budget
              </span>
              <p className="font-semibold text-content-primary flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                {lead.budgetMin || lead.budgetMax ? (
                  <span>
                    {formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}
                  </span>
                ) : (
                  <span className="text-content-muted italic">Not provided</span>
                )}
              </p>
            </div>

            {/* 8. Preferred Timing */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Preferred Contact Timing
              </span>
              <p className="font-medium text-content-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {lead.preferredContactTiming || (
                  <span className="text-content-muted italic">Not provided</span>
                )}
              </p>
            </div>

            {/* 9. Enquiry Source */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Lead Source
              </span>
              <p className="font-medium text-content-primary flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {lead.source || <span className="text-content-muted italic">Not provided</span>}
              </p>
            </div>

            {/* 10. Assigned Sales Agent */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Assigned Sales Agent
              </span>
              <p className="font-semibold flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {lead.assignedTo || lead.assignedToName ? (
                  <span className="text-brand-primary">{assignedAgentName}</span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Unassigned Queue
                  </span>
                )}
              </p>
            </div>

            {/* 11. Alternate Contact */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Alternate Contact
              </span>
              <p className="font-medium text-content-muted italic">Not provided</p>
            </div>

            {/* 12. Preferred Location */}
            <div className="space-y-1">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px]">
                Preferred Location
              </span>
              <p className="font-medium text-content-primary flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {lead.preferredLocation || <span className="text-content-muted italic">Not provided</span>}
              </p>
            </div>
          </div>

          {/* Description / Additional Notes */}
          {lead.description && (
            <div className="mt-4 pt-3 border-t border-edge text-xs">
              <span className="font-semibold text-content-muted uppercase tracking-wider text-[10px] block mb-1">
                Client Description / Remarks Submitted:
              </span>
              <p className="text-content-secondary leading-relaxed bg-surface-subtle p-2.5 rounded-lg border border-edge">
                {lead.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
       * Tabs: Workflow Execution vs. Activity History
       * --------------------------------------------------------------------- */}
      <div className="flex border-b border-edge gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('workflow')}
          className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'workflow'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          Sequential Workflow Pipeline
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <History className="w-4 h-4" />
          Activity & Interaction History ({activityList.length + historyList.length})
        </button>
      </div>

      {/* =======================================================================
       * TAB 1: WORKFLOW PIPELINE
       * ===================================================================== */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {/* 4-Stage Horizontal Progression Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1 Card */}
            <div
              onClick={() => setActiveStep(1)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeStep === 1
                  ? 'bg-blue-50/50 border-brand-primary ring-1 ring-brand-primary shadow-xs'
                  : 'bg-surface-card border-edge hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                  Step 1
                </span>
                {isStep1Done ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-content-primary">Follow-up / Discussion</p>
              <p className="text-[11px] text-content-muted mt-0.5">
                Record Call/WhatsApp, outcomes & requirement
              </p>
            </div>

            {/* Step 2 Card */}
            <div
              onClick={() => {
                if (isMeetingUnlocked) setActiveStep(2);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                !isMeetingUnlocked
                  ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                  : activeStep === 2
                  ? 'bg-blue-50/50 border-brand-primary ring-1 ring-brand-primary shadow-xs cursor-pointer'
                  : 'bg-surface-card border-edge hover:bg-surface-subtle cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                  Step 2
                </span>
                {!isMeetingUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : isMeetingCompletedFinal ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" /> Completed
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-content-primary">Meeting Plan</p>
              <p className="text-[11px] text-content-muted mt-0.5">
                Schedule date, place, manager & outcome
              </p>
            </div>

            {/* Step 3 Card */}
            <div
              onClick={() => {
                if (isSiteVisitUnlocked) setActiveStep(3);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                !isSiteVisitUnlocked
                  ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                  : activeStep === 3
                  ? 'bg-blue-50/50 border-brand-primary ring-1 ring-brand-primary shadow-xs cursor-pointer'
                  : 'bg-surface-card border-edge hover:bg-surface-subtle cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                  Step 3
                </span>
                {!isSiteVisitUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : isSiteVisitCompletedFinal ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" /> Completed
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-content-primary">Site Visit Plan</p>
              <p className="text-[11px] text-content-muted mt-0.5">
                Property site address, date & visit outcome
              </p>
            </div>

            {/* Step 4 Card */}
            <div
              onClick={() => {
                if (isDealDoneUnlocked) setActiveStep(4);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                !isDealDoneUnlocked
                  ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                  : activeStep === 4
                  ? 'bg-blue-50/50 border-brand-primary ring-1 ring-brand-primary shadow-xs cursor-pointer'
                  : 'bg-surface-card border-edge hover:bg-surface-subtle cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                  Step 4
                </span>
                {!isDealDoneUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : isDealDoneFinalized ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" /> Closed Deal
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    Ready
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-content-primary">Deal Done</p>
              <p className="text-[11px] text-content-muted mt-0.5">
                Finalized property, price, size & confirmation
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------------------
           * STEP 1 FORM: Customer Discussion & Follow-Up
           * ----------------------------------------------------------------- */}
          {activeStep === 1 && (
            <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-edge pb-3">
                <div>
                  <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-brand-primary" />
                    Step 1: Customer Discussion & Follow-Up Log
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Record client interaction details, feedback notes, and update requirements.
                  </p>
                </div>
                {lead.preferredContactMethod && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                    Customer Preference: <strong>{lead.preferredContactMethod}</strong> (Locked)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Contact Method */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Contact Method Used
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs font-semibold text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>

                {/* Outcome */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Discussion Outcome
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs font-semibold text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="CONNECTED">Connected & Discussed</option>
                    <option value="CALL_BACK_REQUESTED">Call Back Requested</option>
                    <option value="MEETING_SCHEDULED">Meeting Agreed</option>
                    <option value="NO_ANSWER">No Answer / Busy</option>
                    <option value="NOT_INTERESTED">Not Interested / Lost</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Interaction Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Interaction Time
                  </label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Scheduled Next Follow-Up / Callback Details */}
              <div
                className={`p-4 rounded-xl border space-y-3 transition-colors ${
                  outcome === 'CALL_BACK_REQUESTED'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-surface-subtle/50 border-edge'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-content-primary">
                    <Calendar
                      className={`w-4 h-4 ${
                        outcome === 'CALL_BACK_REQUESTED' ? 'text-amber-600' : 'text-brand-primary'
                      }`}
                    />
                    <span>
                      {outcome === 'CALL_BACK_REQUESTED'
                        ? 'Scheduled Next Callback Details (Required for Call Back Requested) *'
                        : 'Schedule Next Follow-Up Date & Time (Optional for future pipeline)'}
                    </span>
                  </div>
                  {outcome !== 'CALL_BACK_REQUESTED' && nextFollowUpDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setNextFollowUpDate('');
                        setNextFollowUpTime('10:00');
                      }}
                      className="text-[11px] font-semibold text-content-muted hover:text-status-danger cursor-pointer"
                    >
                      Clear schedule
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Next Follow-Up Date {outcome === 'CALL_BACK_REQUESTED' ? '*' : '(Optional)'}
                    </label>
                    <input
                      id="next-follow-up-date"
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className={`w-full px-3 py-2 bg-white rounded-lg text-xs text-content-primary focus:ring-1 ${
                        outcome === 'CALL_BACK_REQUESTED'
                          ? 'border border-amber-300 focus:ring-amber-500'
                          : 'border border-edge focus:ring-brand-primary'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Next Follow-Up Time {outcome === 'CALL_BACK_REQUESTED' ? '*' : '(Optional)'}
                    </label>
                    <input
                      id="next-follow-up-time"
                      type="time"
                      value={nextFollowUpTime}
                      onChange={(e) => setNextFollowUpTime(e.target.value)}
                      className={`w-full px-3 py-2 bg-white rounded-lg text-xs text-content-primary focus:ring-1 ${
                        outcome === 'CALL_BACK_REQUESTED'
                          ? 'border border-amber-300 focus:ring-amber-500'
                          : 'border border-edge focus:ring-brand-primary'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Follow-Up Remarks & Discussion Notes */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  Discussion Notes & Remarks * (Do not enter passwords or OTPs)
                </label>
                <textarea
                  ref={discussionNotesRef}
                  id="follow-up-discussion-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record customer discussion, key questions, preferred configurations, and next steps..."
                  className="w-full p-3 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary leading-relaxed"
                />
              </div>

              {/* Requirement Updates Section */}
              <div className="pt-4 border-t border-edge space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted block">
                  Update Requirement Specs (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Target Project
                    </label>
                    <input
                      type="text"
                      value={enquiryProjectName}
                      onChange={(e) => setEnquiryProjectName(e.target.value)}
                      placeholder="e.g. Prestige Towers"
                      className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Preferred Location
                    </label>
                    <input
                      type="text"
                      value={enquiryPreferredLocation}
                      onChange={(e) => setEnquiryPreferredLocation(e.target.value)}
                      placeholder="e.g. Whitefield, Bangalore"
                      className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Property Spec / Requirement
                    </label>
                    <input
                      type="text"
                      value={enquiryRequirement}
                      onChange={(e) => setEnquiryRequirement(e.target.value)}
                      placeholder="e.g. 3BHK East-Facing"
                      className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Min Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="e.g. 8000000"
                      className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Max Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="e.g. 12000000"
                      className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer Readiness Qualification (BANT Scoring) */}
              <div className="p-4 bg-blue-50/50 border border-blue-200/70 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Grid3X3 className="h-4 w-4 text-brand-primary" />
                    Buyer Readiness Qualification (BANT Scoring)
                  </span>
                  {lead.qualification?.isQualified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {lead.qualification.scoreLabel} ({lead.qualification.priority})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Unscored
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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
                      className="w-full p-2 bg-white border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-brand-primary"
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
                      className="w-full p-2 bg-white border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-brand-primary"
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
                      className="w-full p-2 bg-white border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-brand-primary"
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
                      className="w-full p-2 bg-white border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="SPECIFIC_UNIT_TYPE">Specific Unit Shortlisted (+20 pts)</option>
                      <option value="GENERAL_REQUIREMENT">General Category Aligned (+10 pts)</option>
                      <option value="EXPLORATORY">Exploratory / Browsing (+5 pts)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-semibold text-content-secondary">Matrix Priority:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('HOT');
                      setHasQualificationUpdated(true);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold border transition-colors ${
                      priority === 'HOT'
                        ? 'bg-red-50 text-status-danger border-red-300 ring-1 ring-red-400 font-extrabold'
                        : 'bg-white text-content-secondary border-edge hover:bg-slate-50'
                    }`}
                  >
                    Hot Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('POSSIBLE');
                      setHasQualificationUpdated(true);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold border transition-colors ${
                      priority === 'POSSIBLE'
                        ? 'bg-slate-200 text-slate-800 border-slate-300 ring-1 ring-slate-400 font-extrabold'
                        : 'bg-white text-content-secondary border-edge hover:bg-slate-50'
                    }`}
                  >
                    Poss. Priority
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-edge">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveStep(false)}
                  disabled={isSaving || isRejectedLead}
                >
                  Save Discussion Only
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleSaveStep(true)}
                  disabled={isSaving || isRejectedLead}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : 'Save & Advance to Meeting Plan'}
                </Button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
           * STEP 2 FORM: Meeting Plan
           * ----------------------------------------------------------------- */}
          {activeStep === 2 && (
            <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-edge pb-3">
                <div>
                  <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    Step 2: Meeting Plan & Agenda
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Plan customer meeting location, date/time, accompanying manager, and outcome.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isMeetingCompletedFinal && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Meeting Marked Completed
                    </span>
                  )}
                  {isMeetingCancelled && !isReschedulingMeeting && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Meeting Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Cancelled Banner */}
              {isMeetingCancelled && !isReschedulingMeeting && (
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-rose-900">
                        Meeting Plan Cancelled
                      </span>
                    </div>
                    {lead?.meetingPlan?.cancelledAt && (
                      <span className="text-[11px] text-rose-700 font-medium">
                        Cancelled on {new Date(lead.meetingPlan.cancelledAt).toLocaleString('en-IN')} by{' '}
                        {lead.meetingPlan.cancelledByName || 'Agent'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-rose-950 bg-white/80 p-3 rounded-lg border border-rose-100 space-y-1.5">
                    <p>
                      <strong>Mandatory Cancellation Reason:</strong> {lead?.meetingPlan?.cancellationReason || 'N/A'}
                    </p>
                    {(lead?.meetingPlan?.previousDate || lead?.meetingPlan?.meetingDate) && (
                      <p className="text-[11px] text-rose-800">
                        <strong>Previous Scheduled Date/Time:</strong>{' '}
                        {lead?.meetingPlan?.previousDate || lead?.meetingPlan?.meetingDate} at{' '}
                        {lead?.meetingPlan?.previousTime || lead?.meetingPlan?.meetingTime || 'N/A'}
                      </p>
                    )}
                    {lead?.meetingPlan?.meetingPlace && (
                      <p className="text-[11px] text-rose-800">
                        <strong>Location:</strong> {lead.meetingPlan.meetingPlace}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-rose-800 italic">
                      Lead remains at Step 2 (Meeting Plan). You can reschedule at any time.
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                      onClick={() => setIsReschedulingMeeting(true)}
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      Reschedule Meeting
                    </Button>
                  </div>
                </div>
              )}

              {/* Form Fields (rendered if not cancelled or currently rescheduling) */}
              {(!isMeetingCancelled || isReschedulingMeeting) && (
                <>
                  {isReschedulingMeeting && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                      <span className="flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        Rescheduling Meeting: Enter new date/time below. Previous schedule is preserved in audit history.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsReschedulingMeeting(false)}
                      >
                        Cancel Reschedule
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Meeting Place */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Meeting Place / Address *
                      </label>
                      <input
                        id="meeting-place"
                        type="text"
                        value={meetingPlace}
                        onChange={(e) => setMeetingPlace(e.target.value)}
                        placeholder="e.g. Neuways Regional Office, Indiranagar or Client Office"
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    {/* Accompanying Manager */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Accompanying Manager (Optional)
                      </label>
                      <select
                        value={meetingManagerId}
                        onChange={(e) => setMeetingManagerId(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary"
                      >
                        <option value="">No Manager / Self</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Meeting Date *
                      </label>
                      <input
                        id="meeting-date"
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Meeting Time *
                      </label>
                      <input
                        id="meeting-time"
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>

                    {/* Project Details */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Project Details *
                      </label>
                      <input
                        id="meeting-project"
                        type="text"
                        value={meetingProject}
                        onChange={(e) => setMeetingProject(e.target.value)}
                        placeholder="e.g. Prestige Towers, 2BHK Layouts"
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Meeting Agenda / Prep Remarks
                    </label>
                    <textarea
                      id="meeting-remarks"
                      rows={2}
                      value={meetingRemarks}
                      onChange={(e) => setMeetingRemarks(e.target.value)}
                      placeholder="Record discussion agenda, customer preferences to present, brochure kits needed..."
                      className="w-full p-3 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>

                  {/* Completion Guard Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        id="meeting-is-completed"
                        type="checkbox"
                        checked={isMeetingCompleted}
                        onChange={(e) => setIsMeetingCompleted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <span className="text-xs font-bold text-content-primary block">
                          Meeting has been conducted and completed
                        </span>
                        <span className="text-[11px] text-content-muted">
                          Check this box once the meeting has actually taken place and record the result below.
                          (Required before advancing to Site Visit Plan).
                        </span>
                      </div>
                    </label>

                    {isMeetingCompleted && (
                      <div>
                        <label className="block text-xs font-semibold text-content-secondary mb-1">
                          Meeting Result / Outcome Summary *
                        </label>
                        <input
                          id="meeting-result"
                          type="text"
                          value={meetingResult}
                          onChange={(e) => setMeetingResult(e.target.value)}
                          placeholder="e.g. Client agreed to project pricing; scheduled site visit for unit 402."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-edge">
                <div>
                  {!isMeetingCancelled && !isMeetingCompletedFinal && Boolean(lead?.meetingPlan?.meetingDate) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-700 border-rose-300 hover:bg-rose-50"
                      onClick={() => handleOpenCancelModal('MEETING')}
                      disabled={isSaving || isRejectedLead}
                    >
                      <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                      Cancel Meeting
                    </Button>
                  )}
                  {isReschedulingMeeting && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsReschedulingMeeting(false)}
                      disabled={isSaving}
                    >
                      Back to Cancelled View
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {(!isMeetingCancelled || isReschedulingMeeting) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveStep(false)}
                        disabled={isSaving || isRejectedLead}
                      >
                        {isReschedulingMeeting ? 'Save Rescheduled Meeting' : 'Save Meeting Draft'}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveStep(true)}
                        disabled={isSaving || isRejectedLead}
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        {isSaving ? 'Saving...' : 'Save & Advance to Site Visit Plan'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
           * STEP 3 FORM: Site Visit Plan
           * ----------------------------------------------------------------- */}
          {activeStep === 3 && (
            <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-edge pb-3">
                <div>
                  <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    Step 3: Site Visit Plan & Execution
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Schedule property on-site inspection, location coordinates, manager, and outcome.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSiteVisitCompletedFinal && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Site Visit Marked Completed
                    </span>
                  )}
                  {isSiteVisitCancelled && !isReschedulingSiteVisit && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Site Visit Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Cancelled Banner */}
              {isSiteVisitCancelled && !isReschedulingSiteVisit && (
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-rose-900">
                        Site Visit Plan Cancelled
                      </span>
                    </div>
                    {lead?.siteVisitPlan?.cancelledAt && (
                      <span className="text-[11px] text-rose-700 font-medium">
                        Cancelled on {new Date(lead.siteVisitPlan.cancelledAt).toLocaleString('en-IN')} by{' '}
                        {lead.siteVisitPlan.cancelledByName || 'Agent'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-rose-950 bg-white/80 p-3 rounded-lg border border-rose-100 space-y-1.5">
                    <p>
                      <strong>Mandatory Cancellation Reason:</strong> {lead?.siteVisitPlan?.cancellationReason || 'N/A'}
                    </p>
                    {(lead?.siteVisitPlan?.previousDate || lead?.siteVisitPlan?.siteVisitDate) && (
                      <p className="text-[11px] text-rose-800">
                        <strong>Previous Scheduled Date/Time:</strong>{' '}
                        {lead?.siteVisitPlan?.previousDate || lead?.siteVisitPlan?.siteVisitDate} at{' '}
                        {lead?.siteVisitPlan?.previousTime || lead?.siteVisitPlan?.siteVisitTime || 'N/A'}
                      </p>
                    )}
                    {lead?.siteVisitPlan?.siteVisitAddress && (
                      <p className="text-[11px] text-rose-800">
                        <strong>Location:</strong> {lead.siteVisitPlan.siteVisitAddress}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-rose-800 italic">
                      Lead remains at Step 3 (Site Visit Plan). You can reschedule at any time.
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                      onClick={() => setIsReschedulingSiteVisit(true)}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      Reschedule Site Visit
                    </Button>
                  </div>
                </div>
              )}

              {/* Form Fields (rendered if not cancelled or currently rescheduling) */}
              {(!isSiteVisitCancelled || isReschedulingSiteVisit) && (
                <>
                  {isReschedulingSiteVisit && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                      <span className="flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        Rescheduling Site Visit: Enter new visit date/time below. Previous schedule is preserved in audit history.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsReschedulingSiteVisit(false)}
                      >
                        Cancel Reschedule
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Site Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Site Visit Address / Property Location *
                      </label>
                      <input
                        id="site-visit-address"
                        type="text"
                        value={siteVisitAddress}
                        onChange={(e) => setSiteVisitAddress(e.target.value)}
                        placeholder="e.g. Tower 4, Unit 802, Prestige Towers, Whitefield"
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>

                    {/* Accompanying Manager */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Accompanying Manager (Optional)
                      </label>
                      <select
                        value={siteVisitManagerId}
                        onChange={(e) => setSiteVisitManagerId(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      >
                        <option value="">No Manager / Self</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Visit Date *
                      </label>
                      <input
                        id="site-visit-date"
                        type="date"
                        value={siteVisitDate}
                        onChange={(e) => setSiteVisitDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Visit Time *
                      </label>
                      <input
                        id="site-visit-time"
                        type="time"
                        value={siteVisitTime}
                        onChange={(e) => setSiteVisitTime(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>

                    {/* Project Name */}
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Project Name *
                      </label>
                      <input
                        id="site-visit-project"
                        type="text"
                        value={siteVisitProject}
                        onChange={(e) => setSiteVisitProject(e.target.value)}
                        placeholder="e.g. Prestige Towers"
                        className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      Site Visit Notes / Preparation
                    </label>
                    <textarea
                      id="site-visit-remarks"
                      rows={2}
                      value={siteVisitRemarks}
                      onChange={(e) => setSiteVisitRemarks(e.target.value)}
                      placeholder="Record keys availability, sample flat viewing arrangements, client family members attending..."
                      className="w-full p-3 bg-surface-card border border-edge rounded-lg text-xs"
                    />
                  </div>

                  {/* Completion Guard Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        id="site-visit-is-completed"
                        type="checkbox"
                        checked={isSiteVisitCompleted}
                        onChange={(e) => setIsSiteVisitCompleted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <span className="text-xs font-bold text-content-primary block">
                          Site visit has been conducted and completed
                        </span>
                        <span className="text-[11px] text-content-muted">
                          Check this box once the client has physically inspected the property and record the outcome below.
                          (Required before advancing to Deal Done).
                        </span>
                      </div>
                    </label>

                    {isSiteVisitCompleted && (
                      <div>
                        <label className="block text-xs font-semibold text-content-secondary mb-1">
                          Site Visit Outcome / Client Reaction *
                        </label>
                        <input
                          id="site-visit-outcome"
                          type="text"
                          value={siteVisitOutcome}
                          onChange={(e) => setSiteVisitOutcome(e.target.value)}
                          placeholder="e.g. Client loved corner balcony layout; agreed on unit #802; requested final price sheet."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-edge">
                <div>
                  {!isSiteVisitCancelled && !isSiteVisitCompletedFinal && Boolean(lead?.siteVisitPlan?.siteVisitDate) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-700 border-rose-300 hover:bg-rose-50"
                      onClick={() => handleOpenCancelModal('SITE_VISIT')}
                      disabled={isSaving || isRejectedLead}
                    >
                      <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                      Cancel Site Visit
                    </Button>
                  )}
                  {isReschedulingSiteVisit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsReschedulingSiteVisit(false)}
                      disabled={isSaving}
                    >
                      Back to Cancelled View
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {(!isSiteVisitCancelled || isReschedulingSiteVisit) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveStep(false)}
                        disabled={isSaving || isRejectedLead}
                      >
                        {isReschedulingSiteVisit ? 'Save Rescheduled Site Visit' : 'Save Site Visit Draft'}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveStep(true)}
                        disabled={isSaving || isRejectedLead}
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        {isSaving ? 'Saving...' : 'Save & Advance to Deal Done'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
           * STEP 4 FORM: Deal Done
           * ----------------------------------------------------------------- */}
          {activeStep === 4 && (
            <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-edge pb-3">
                <div>
                  <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Step 4: Deal Done & Booking Finalization
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Finalize agreed property specifications, total transaction price, and confirm deal closure.
                  </p>
                </div>
                {isDealDoneFinalized && (
                  <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    Deal Confirmed & Booked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Project Name */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Confirmed Project *
                  </label>
                  <input
                    id="deal-project"
                    type="text"
                    value={dealProject}
                    onChange={(e) => setDealProject(e.target.value)}
                    placeholder="e.g. Prestige Towers"
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Property Type *
                  </label>
                  <select
                    id="deal-property-type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Commercial Office">Commercial Office</option>
                    <option value="Plot / Land">Plot / Land</option>
                  </select>
                </div>

                {/* Final Deal Price */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Final Deal Price (₹) *
                  </label>
                  <input
                    id="deal-price"
                    type="number"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    placeholder="e.g. 9500000"
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs font-semibold"
                  />
                </div>

                {/* Property Size */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    Unit Size *
                  </label>
                  <input
                    id="deal-size"
                    type="text"
                    value={dealSize}
                    onChange={(e) => setDealSize(e.target.value)}
                    placeholder="e.g. 1850 sqft"
                    className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Deal Remarks */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  Booking Remarks & Advance Payment Details
                </label>
                <textarea
                  id="deal-remarks"
                  rows={2}
                  value={dealRemarks}
                  onChange={(e) => setDealRemarks(e.target.value)}
                  placeholder="Record cheque numbers, booking token amount, expected agreement date..."
                  className="w-full p-3 bg-surface-card border border-edge rounded-lg text-xs"
                />
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id="deal-confirmed"
                    type="checkbox"
                    checked={isDealConfirmed}
                    onChange={(e) => setIsDealConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-sm border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      I explicitly confirm this deal is finalized and approved *
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Checking this locks the final stage as DEAL_DONE and permanently archives the transaction in company records.
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-edge">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDealLostError(null);
                    setIsDealLostConfirmed(false);
                    setIsDealLostDialogOpen(true);
                  }}
                  disabled={isSaving || isRejectedLead || isDealDoneFinalized}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold"
                  icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                >
                  Mark Deal as Lost
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleSaveStep(true)}
                  disabled={isSaving || isRejectedLead}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isSaving ? 'Finalizing...' : 'Finalize & Confirm Deal Done'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
       * TAB 2: AUDIT & ACTIVITY TIMELINE & TASK STATUS TRACKING (REQ-22)
       * ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Section 1: Follow-Up Tasks & Task Status Tracking */}
          <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  Follow-Up Tasks & Status Tracking ({historyList.length})
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Track and manually manage task status: Pending, In Progress, Completed, Cancelled, or Rescheduled.
                </p>
              </div>
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-6 text-content-muted text-xs">
                No follow-up tasks recorded for this lead yet.
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((task) => {
                  const currentTaskStatus = task.status || 'PENDING';
                  const isTerminal = currentTaskStatus === 'COMPLETED' || currentTaskStatus === 'CANCELLED';

                  return (
                    <div
                      key={task._id || task.id}
                      className="p-4 bg-surface-subtle border border-edge rounded-xl text-xs space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary font-bold rounded-md uppercase tracking-wider text-[11px]">
                            {task.purpose}
                          </span>
                          <span className="text-content-secondary font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-content-muted" />
                            {task.followUpDate ? new Date(task.followUpDate).toLocaleDateString('en-IN') : 'N/A'} at {task.followUpTime || 'N/A'}
                          </span>
                          {task.assignedTo?.name && (
                            <span className="text-content-muted flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {task.assignedTo.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          {currentTaskStatus === 'PENDING' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Pending
                            </span>
                          )}
                          {currentTaskStatus === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              In Progress
                            </span>
                          )}
                          {currentTaskStatus === 'COMPLETED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Completed
                            </span>
                          )}
                          {currentTaskStatus === 'CANCELLED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              Cancelled
                            </span>
                          )}
                          {currentTaskStatus === 'RESCHEDULED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              Rescheduled
                            </span>
                          )}

                          {/* Action Button */}
                          {!isTerminal ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenStatusModal(task)}
                              className="text-[11px] h-7 px-2.5"
                            >
                              Update Status
                            </Button>
                          ) : (
                            <span className="text-[10px] text-content-muted font-medium italic">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {task.notes && (
                        <p className="text-content-secondary leading-relaxed bg-white/70 p-2.5 rounded-lg border border-edge/60">
                          {task.notes}
                        </p>
                      )}

                      {/* Cancellation reason if cancelled */}
                      {currentTaskStatus === 'CANCELLED' && task.cancellationReason && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
                          <strong>Cancellation Reason:</strong> {task.cancellationReason}
                        </div>
                      )}

                      {/* Rescheduled info */}
                      {currentTaskStatus === 'RESCHEDULED' && task.previousFollowUpDate && (
                        <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs">
                          <strong>Previous Schedule:</strong>{' '}
                          {new Date(task.previousFollowUpDate).toLocaleDateString('en-IN')} {task.previousFollowUpTime}
                        </div>
                      )}

                      {/* Status changed audit info */}
                      {task.statusChangedAt && (
                        <div className="text-[10px] text-content-muted flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            Status changed to {currentTaskStatus} on {new Date(task.statusChangedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Immutable Activity Trail */}
          <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-primary" />
                  Lead Audit Log & Interaction Trail ({activityList.length})
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Complete chronological audit log of all interactions, stage advances, and updates.
                </p>
              </div>
            </div>

            {activityList.length === 0 ? (
              <div className="text-center py-6 text-content-muted text-xs">
                No historical interactions recorded yet for this lead.
              </div>
            ) : (
              <div className="space-y-3">
                {activityList.map((act, idx) => (
                  <div
                    key={act._id || act.id || idx}
                    className="p-3.5 bg-surface-subtle border border-edge rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-content-primary flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-mono text-[10px]">
                          {act.type}
                        </span>
                        <span>{act.performedByName || 'Agent'}</span>
                      </span>
                      <span className="text-[11px] text-content-muted">
                        {new Date(act.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-content-secondary leading-relaxed">{act.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * REQ-22: Update Task Status Modal Dialog
       * --------------------------------------------------------------------- */}
      {selectedTaskForStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-brand-primary rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Update Task Status
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Change the status of this {selectedTaskForStatus.purpose} follow-up task. Status updates must be made manually.
                </p>
              </div>
            </div>

            {taskStatusError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
                {taskStatusError}
              </div>
            )}

            {taskStatusSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {taskStatusSuccess}
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className="font-bold text-slate-800">{selectedTaskForStatus.status || 'PENDING'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Scheduled:</span>
                <span className="font-semibold text-slate-700">
                  {selectedTaskForStatus.followUpDate ? new Date(selectedTaskForStatus.followUpDate).toLocaleDateString('en-IN') : 'N/A'} at {selectedTaskForStatus.followUpTime || 'N/A'}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateTaskStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select New Status *
                </label>
                <select
                  value={targetTaskStatus}
                  onChange={(e) => setTargetTaskStatus(e.target.value as TaskStatus)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-brand-primary bg-white"
                  required
                >
                  <option value="">-- Choose New Status --</option>
                  {(ALLOWED_TASK_TRANSITIONS[selectedTaskForStatus.status || 'PENDING'] || []).map((st) => (
                    <option key={st} value={st}>
                      {st === 'IN_PROGRESS'
                        ? 'In Progress'
                        : st === 'COMPLETED'
                        ? 'Completed'
                        : st === 'CANCELLED'
                        ? 'Cancelled'
                        : st === 'RESCHEDULED'
                        ? 'Rescheduled'
                        : st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory Cancellation Reason */}
              {targetTaskStatus === 'CANCELLED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cancellation Reason <span className="text-red-600 font-bold">* (Mandatory)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={taskCancellationReason}
                    onChange={(e) => setTaskCancellationReason(e.target.value)}
                    placeholder="Enter reason for cancelling this task (e.g., Prospect unavailable, Client postponed indefinitely)..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-red-500 bg-white"
                    required
                  />
                </div>
              )}

              {/* Mandatory Date & Time for Rescheduled */}
              {targetTaskStatus === 'RESCHEDULED' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Date <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      value={taskRescheduledDate}
                      onChange={(e) => setTaskRescheduledDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-brand-primary bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Time <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="time"
                      value={taskRescheduledTime}
                      onChange={(e) => setTaskRescheduledTime(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-brand-primary bg-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={taskStatusNotes}
                  onChange={(e) => setTaskStatusNotes(e.target.value)}
                  placeholder="Additional context or outcome notes regarding this status change..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-brand-primary bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseStatusModal}
                  disabled={isUpdatingTaskStatus}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdatingTaskStatus || !targetTaskStatus}
                >
                  {isUpdatingTaskStatus ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * Mark Lead as Rejected / Lost Modal Dialog
       * --------------------------------------------------------------------- */}
      {isRejectDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Mark Lead as Rejected / Lost
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Record the customer&apos;s rejection reason for &ldquo;<strong>{lead.name}</strong>&rdquo;. This action will archive the lead and remove it from the active sales pipeline.
                </p>
              </div>
            </div>

            {rejectError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
                {rejectError}
              </div>
            )}

            {/* Current Stage Indicator */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Current Workflow Stage:</span>
              <span className="font-bold text-brand-primary">
                {lead.currentStage || '01. Follow-up'}
              </span>
            </div>

            {/* Predefined Reason Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mandatory Rejection Reason *
              </label>
              <select
                id="reject-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-red-500 bg-white"
              >
                {PREDEFINED_REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks <span className="text-red-600 font-bold">* Mandatory remarks required (Mandatory for &apos;Other&apos; and all reasons)</span>
              </label>
              <textarea
                id="reject-remarks"
                rows={3}
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Please explain the specific reason why this customer decided not to proceed..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  id="reject-confirmed"
                  type="checkbox"
                  checked={isRejectionConfirmed}
                  onChange={(e) => setIsRejectionConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm border-red-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="text-xs font-bold text-red-950 block">
                    I confirm that this lead is lost and should be marked as Rejected / Lost *
                  </span>
                  <span className="text-[11px] text-red-700 block mt-0.5">
                    This lead will be excluded from the active sales pipeline and cannot be marked Deal Done without authorized recovery.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleRejectLead}
                disabled={
                  isSaving ||
                  !rejectionReason ||
                  !rejectionRemarks.trim() ||
                  !isRejectionConfirmed
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? 'Submitting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * REQ-36: Deal Lost Modal Dialog
       * --------------------------------------------------------------------- */}
      {isDealLostDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Mark Opportunity as Deal Lost
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Record that deal negotiations for &ldquo;<strong>{lead.name}</strong>&rdquo; have concluded without closure. Associated follow-up tasks will be safely cancelled.
                </p>
              </div>
            </div>

            {dealLostError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
                {dealLostError}
              </div>
            )}

            {/* Current Stage Indicator */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Current Workflow Stage:</span>
              <span className="font-bold text-brand-primary">
                {lead.currentStage || '01. Follow-up'}
              </span>
            </div>

            {/* Predefined Deal Lost Reason Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mandatory Deal Lost Reason *
              </label>
              <select
                id="deal-lost-reason"
                value={dealLostReason}
                onChange={(e) => setDealLostReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-amber-500 bg-white"
              >
                {DEAL_LOST_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandatory Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks <span className="text-amber-700 font-bold">* Mandatory remarks required</span>
              </label>
              <textarea
                id="deal-lost-remarks"
                rows={3}
                value={dealLostRemarks}
                onChange={(e) => setDealLostRemarks(e.target.value)}
                placeholder="Explain why the deal was lost (e.g., competitor pricing, loan rejection, customer requirements changed)..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  id="deal-lost-confirmed"
                  type="checkbox"
                  checked={isDealLostConfirmed}
                  onChange={(e) => setIsDealLostConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    I confirm that this opportunity should be marked as Deal Lost *
                  </span>
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    This lead will be closed and removed from active pipeline tracking.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsDealLostDialogOpen(false);
                  setDealLostError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleDealLost}
                disabled={
                  isSaving ||
                  !dealLostReason ||
                  !dealLostRemarks.trim() ||
                  !isDealLostConfirmed
                }
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSaving ? 'Submitting...' : 'Confirm Deal Lost'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * Lead Closure Modal Dialog
       * --------------------------------------------------------------------- */}
      {isCloseDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Close Lead / Not Interested</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to transition this lead to CLOSED? Closed leads are archived from the active sales queue.
                </p>
              </div>
            </div>

            {closeError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                {closeError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Closing Reason *
              </label>
              <textarea
                id="close-reason"
                rows={3}
                value={closingReason}
                onChange={(e) => setClosingReason(e.target.value)}
                placeholder="e.g. Client purchased competitor property, budget mismatch, relocated..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCloseDialogOpen(false);
                  setCloseError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleCloseLead}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? 'Closing...' : 'Confirm Lead Closure'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* -----------------------------------------------------------------------
       * Deal Done Finalization Confirmation Modal Dialog
       * --------------------------------------------------------------------- */}
      {isDealCompletedConfirmationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-edge">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Deal Finalized Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This property deal has been officially confirmed and moved to the Completed Deals register.
                </p>
              </div>
            </div>

            {/* Deal Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Finalized Deal Summary
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Customer Name</span>
                  <span className="font-bold text-slate-800">{lead?.name || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mobile Contact</span>
                  <span className="font-bold text-slate-800">{lead?.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Project</span>
                  <span className="font-bold text-slate-800">{dealProject || lead?.projectName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Property Type</span>
                  <span className="font-bold text-slate-800">{propertyType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Final Deal Price</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    ${Number(dealPrice || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit Size</span>
                  <span className="font-bold text-slate-800">{dealSize || 'N/A'}</span>
                </div>
              </div>
              {dealRemarks && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 block mb-0.5">Deal Remarks</span>
                  <p className="text-slate-700 italic">"{dealRemarks}"</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDealCompletedConfirmationOpen(false);
                  navigate('/sales/completed-deals');
                }}
                className="w-full sm:w-auto"
              >
                View Completed Deals
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDealCompletedConfirmationOpen(false);
                  navigate('/sales/dashboard');
                }}
                className="w-full sm:w-auto bg-brand-primary hover:bg-blue-700 text-white font-semibold"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Lead Confirmation Dialog */}
      {isDeleteDialogOpen && lead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-red-50 text-status-danger">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Delete Lead Permanently?
                </h3>
                <span className="text-xs text-content-muted font-mono">
                  {lead.id || lead.name}
                </span>
              </div>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed mb-5">
              Are you sure you want to permanently delete lead <strong className="text-content-primary">{lead.name}</strong>? All associated follow-up tasks and activity records will be deleted. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletingLead}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={isDeletingLead}
                onClick={handleDeleteLead}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* -----------------------------------------------------------------------
       * REQ-31: Mandatory Cancellation Reason Modal Dialog
       * --------------------------------------------------------------------- */}
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
                  Record the mandatory reason for cancelling this {cancelModalState.type === 'MEETING' ? 'meeting' : 'site visit'} with {lead?.name}. The lead will remain at this workflow step, and you can reschedule at any time.
                </p>
              </div>
            </div>

            {cancelModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium">
                {cancelModalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="cancel-plan-reason"
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => {
                  setCancelReasonInput(e.target.value);
                  if (cancelModalError) setCancelModalError(null);
                }}
                placeholder="Enter mandatory cancellation reason (e.g., Client requested postponement due to urgent travel, family emergency, or budget re-evaluation)..."
                className="w-full p-3 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:ring-1 focus:ring-rose-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-edge">
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

      {/* -----------------------------------------------------------------------
       * REQ-38: Enable Do Not Contact (DNC) Modal Dialog
       * --------------------------------------------------------------------- */}
      {isDncDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          data-testid="enable-dnc-modal"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Mark Customer as Do Not Contact (DNC)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Activating DNC applies at the customer level ({lead?.mobile}). All customer communication channels (Call, WhatsApp, Email, Meeting, Site Visit) and follow-up reminders will be strictly blocked. Active follow-up tasks will be automatically cancelled.
                </p>
              </div>
            </div>

            {dncError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
                {dncError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Predefined DNC Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={dncReason}
                onChange={(e) => setDncReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-red-500 bg-white"
                data-testid="dnc-reason-select"
              >
                {DNC_ACTIVATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {DNC_ACTIVATION_REASON_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={dncRemarks}
                onChange={(e) => setDncRemarks(e.target.value)}
                placeholder="Explain the circumstances of the DNC request (e.g., customer called and specifically requested no further sales calls)..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-red-500"
                data-testid="dnc-remarks-input"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsDncDialogOpen(false);
                  setDncError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleEnableDnc}
                disabled={isSaving || !dncReason || !dncRemarks.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-enable-dnc-btn"
              >
                {isSaving ? 'Submitting...' : 'Confirm Do Not Contact'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
       * REQ-38: Revoke Do Not Contact (DNC) Modal Dialog
       * --------------------------------------------------------------------- */}
      {isRevokeDncDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          data-testid="revoke-dnc-modal"
        >
          <div className="bg-white border border-edge rounded-card shadow-dropdown max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Revoke Do Not Contact Restriction
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Revoking DNC removes communication blocks for customer ({lead?.mobile}). Previously cancelled tasks will not be reopened; you may schedule fresh follow-ups once revoked. Authorized for Managers and Admins only.
                </p>
              </div>
            </div>

            {revokeDncError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
                {revokeDncError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revocation Reason <span className="text-emerald-600">*</span>
              </label>
              <select
                value={revokeDncReason}
                onChange={(e) => setRevokeDncReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 bg-white"
                data-testid="revoke-dnc-reason-select"
              >
                {DNC_REVOCATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {DNC_REVOCATION_REASON_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Remarks <span className="text-emerald-600">*</span>
              </label>
              <textarea
                rows={3}
                value={revokeDncRemarks}
                onChange={(e) => setRevokeDncRemarks(e.target.value)}
                placeholder="Explain the reason for revoking DNC (e.g., customer called back and renewed consent to be contacted)..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                data-testid="revoke-dnc-remarks-input"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsRevokeDncDialogOpen(false);
                  setRevokeDncError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleRevokeDnc}
                disabled={isSaving || !revokeDncReason || !revokeDncRemarks.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="confirm-revoke-dnc-btn"
              >
                {isSaving ? 'Submitting...' : 'Confirm Revocation'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
