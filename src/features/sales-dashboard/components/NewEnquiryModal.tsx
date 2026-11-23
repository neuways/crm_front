/**
 * Nueways CRM - New Lead Enquiry Modal Component
 * 
 * Provides a responsive, accessible dialog for sales agents to register
 * new prospect enquiries with real-time validation, duplicate detection
 * handling (HTTP 409), and explicit demonstration mode isolation.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Building,
  MapPin,
  IndianRupee,
  Clock,
  FileText,
  ShieldAlert,
  Users,
  Flag,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { userService } from '../../../services/user.service.js';
import { propertyMappingService } from '../../../services/property-mapping.service.js';
import { useAuth } from '../../../context/AuthContext.js';
import {
  CreateEnquiryInput,
  IEnquiry,
  DuplicateType,
  MatchedEnquirySummary,
  PreferredContactMethod,
  PreviousEnquirySummary,
} from '../../../types/enquiry.types.js';
import { IPropertyMappingItem } from '../../../types/property-mapping.types.js';
import { EmployeeProfile } from '../../../types/user.types.js';
import { NewLeadItem } from '../types/dashboard.types.js';
import { isValidMobileNumber, maskPhoneNumber } from '../../../utils/phone.js';

export interface NewEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoMode?: boolean;
  onEnquiryCreated: (lead: NewLeadItem, rawEnquiry?: IEnquiry) => void;
}

interface FormState {
  name: string;
  mobile: string;
  email: string;
  projectName: string;
  preferredLocation: string;
  requirement: string;
  budgetMin: string;
  budgetMax: string;
  source: string;
  preferredContactMethod: '' | PreferredContactMethod;
  preferredContactTiming: string;
  description: string;
}

const initialFormState: FormState = {
  name: '',
  mobile: '',
  email: '',
  projectName: '',
  preferredLocation: '',
  requirement: '',
  budgetMin: '',
  budgetMax: '',
  source: 'Website Enquiry',
  preferredContactMethod: 'CALL',
  preferredContactTiming: 'Morning (9 AM - 12 PM)',
  description: '',
};

export const NewEnquiryModal: React.FC<NewEnquiryModalProps> = ({
  isOpen,
  onClose,
  onEnquiryCreated,
}) => {
  const { user } = useAuth();
  const role = user?.role || 'SALES';

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Assignment states based on user role
  const [adminAssignOption, setAdminAssignOption] = useState<'ROUND_ROBIN' | 'MANUAL'>('ROUND_ROBIN');
  const [adminSelectedEmployeeId, setAdminSelectedEmployeeId] = useState<string>('');
  const [managerAssignOption, setManagerAssignOption] = useState<'SELF' | 'TEAM_MEMBER'>('SELF');
  const [managerSelectedAgentId, setManagerSelectedAgentId] = useState<string>('');

  const [eligibleEmployees, setEligibleEmployees] = useState<EmployeeProfile[]>([]);
  const [managerTeamAgents, setManagerTeamAgents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [propertyMappings, setPropertyMappings] = useState<IPropertyMappingItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [createdSummary, setCreatedSummary] = useState<{
    name: string;
    ref: string;
    isUnassigned?: boolean;
    assigneeName?: string;
  } | null>(null);

  // Fetch properties and role-relevant assignment pools on modal open
  useEffect(() => {
    if (!isOpen) return;

    propertyMappingService.listMappings().then((res) => {
      if (res.success && res.data?.mappings) {
        setPropertyMappings(res.data.mappings);
      }
    }).catch(() => {});

    if (role === 'ADMIN') {
      userService.listEmployees().then((res) => {
        if (res.success && res.data) {
          const activeEmployees = res.data.filter(
            (e) => e.isActive && (e.role === 'SALES' || e.role === 'MANAGER')
          );
          setEligibleEmployees(activeEmployees);
        }
      }).catch(() => {});
    } else if (role === 'MANAGER') {
      enquiryService.getTeamRoster().then((res) => {
        if (res.success && res.data?.agents) {
          const teamAgents = res.data.agents
            .filter((a) => a.isAssignedToCurrentManager && a.isActive && a.isTeamActive)
            .map((a) => ({ id: a.id, name: a.name, email: a.email }));
          setManagerTeamAgents(teamAgents);
        }
      }).catch(() => {});
    }
  }, [isOpen, role]);

  // Duplicate conflict state
  const [duplicateConflict, setDuplicateConflict] = useState<{
    type: DuplicateType;
    message: string;
    matches: MatchedEnquirySummary[];
    isRedFlag?: boolean;
    previousEnquiry?: PreviousEnquirySummary;
  } | null>(null);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user modifies value
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Clear global alerts on edit
    if (submitError) setSubmitError(null);
    if (duplicateConflict) setDuplicateConflict(null);
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof FormState, value: string): string | null => {
    let error: string | null = null;

    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Prospect name is required.';
        }
        break;

      case 'mobile':
        if (!value.trim()) {
          error = 'Mobile number is required.';
        } else if (!isValidMobileNumber(value)) {
          error = 'Enter a valid 10-digit Indian number or international E.164 number (+...).';
        }
        break;

      case 'email':
        if (value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            error = 'Enter a valid email address.';
          }
        }
        break;

      case 'budgetMin':
      case 'budgetMax': {
        const minVal = formData.budgetMin ? Number(formData.budgetMin) : null;
        const maxVal = formData.budgetMax ? Number(formData.budgetMax) : null;

        if (minVal !== null && (isNaN(minVal) || minVal < 0)) {
          error = 'Budget must be a non-negative number.';
        }
        if (maxVal !== null && (isNaN(maxVal) || maxVal < 0)) {
          error = 'Budget must be a non-negative number.';
        }
        if (minVal !== null && maxVal !== null && minVal > maxVal) {
          error = 'Minimum budget cannot exceed maximum budget.';
        }
        break;
      }

      default:
        break;
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });

    return error;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Prospect name is required.';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!isValidMobileNumber(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit Indian number or international E.164 number (+...).';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address.';
      }
    }

    const min = formData.budgetMin.trim() ? Number(formData.budgetMin) : undefined;
    const max = formData.budgetMax.trim() ? Number(formData.budgetMax) : undefined;

    if (min !== undefined && (isNaN(min) || min < 0)) {
      newErrors.budgetMin = 'Minimum budget cannot be negative.';
    }
    if (max !== undefined && (isNaN(max) || max < 0)) {
      newErrors.budgetMax = 'Maximum budget cannot be negative.';
    }
    if (min !== undefined && max !== undefined && min > max) {
      newErrors.budgetMin = 'Minimum budget cannot exceed maximum budget.';
    }

    if (role === 'ADMIN' && adminAssignOption === 'MANUAL' && !adminSelectedEmployeeId) {
      newErrors.adminSelectedEmployeeId = 'Please select an employee for manual assignment.';
    }
    if (role === 'MANAGER' && managerAssignOption === 'TEAM_MEMBER' && !managerSelectedAgentId) {
      newErrors.managerSelectedAgentId = 'Please select a team member.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeSubmit = async (allowReEnquiry = false) => {
    // Prevent accidental double clicks
    if (isSubmitting) return;

    // Run client validation
    if (!validateAll()) {
      setSubmitError('Please correct the highlighted validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    if (!allowReEnquiry) {
      setDuplicateConflict(null);
    }

    const minNum = formData.budgetMin.trim() ? Number(formData.budgetMin) : undefined;
    const maxNum = formData.budgetMax.trim() ? Number(formData.budgetMax) : undefined;

    // Format indicated budget for UI cards
    let priceDisplay = 'Price on Request';
    if (minNum && maxNum) {
      priceDisplay = `₹${minNum.toLocaleString('en-IN')} - ₹${maxNum.toLocaleString('en-IN')}`;
    } else if (minNum) {
      priceDisplay = `From ₹${minNum.toLocaleString('en-IN')}`;
    } else if (maxNum) {
      priceDisplay = `Up to ₹${maxNum.toLocaleString('en-IN')}`;
    }

    const initials = formData.name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'EN';

    // ------------------------------------------------------------------
    // Live Backend Integration (POST /api/v1/enquiries)
    // ------------------------------------------------------------------
    try {
      let assignedToId: string | null | undefined = undefined;
      let assignmentMethod: 'ROUND_ROBIN' | 'MANUAL' | undefined = undefined;

      if (role === 'SALES') {
        assignedToId = user?.id;
      } else if (role === 'MANAGER') {
        if (managerAssignOption === 'SELF') {
          assignedToId = user?.id;
        } else {
          assignedToId = managerSelectedAgentId || user?.id;
        }
      } else if (role === 'ADMIN') {
        if (adminAssignOption === 'ROUND_ROBIN') {
          assignmentMethod = 'ROUND_ROBIN';
          assignedToId = undefined;
        } else {
          assignmentMethod = 'MANUAL';
          assignedToId = adminSelectedEmployeeId || undefined;
        }
      }

      const payload: CreateEnquiryInput = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() ? formData.email.trim() : undefined,
        projectName: formData.projectName.trim() ? formData.projectName.trim() : undefined,
        preferredLocation: formData.preferredLocation.trim() ? formData.preferredLocation.trim() : undefined,
        requirement: formData.requirement.trim() ? formData.requirement.trim() : undefined,
        budgetMin: minNum,
        budgetMax: maxNum,
        source: formData.source.trim() ? formData.source.trim() : undefined,
        preferredContactMethod: formData.preferredContactMethod || undefined,
        preferredContactTiming: formData.preferredContactTiming.trim() ? formData.preferredContactTiming.trim() : undefined,
        description: formData.description.trim() ? formData.description.trim() : undefined,
        assignedToId,
        assignmentMethod,
        allowReEnquiry,
        previousEnquiryId: duplicateConflict?.previousEnquiry?.id
      };

      const res = await enquiryService.createEnquiry(payload);

      // Handle Duplicate / Conflict (HTTP 409)
      if (res.statusCode === 409 || res.isDuplicate) {
        const matchesList: MatchedEnquirySummary[] =
          res.data?.matchedEnquiries && Array.isArray(res.data.matchedEnquiries)
            ? res.data.matchedEnquiries
            : [];

        const isRedFlag = Boolean(res.isRedFlag || (res as any)?.data?.isRedFlag);
        const previousEnquiry = res.previousEnquiry || (res as any)?.data?.previousEnquiry;

        setDuplicateConflict({
          type: res.duplicateType || 'MOBILE_MATCH',
          message:
            res.message ||
            'An active enquiry matching these contact details already exists.',
          matches: matchesList,
          isRedFlag,
          previousEnquiry
        });
        // Notify notification bell and pages to immediately refresh unread indicators
        window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
        setIsSubmitting(false);
        return;
      }

      // Handle Validation Error (HTTP 400)
      if (res.statusCode === 400) {
        setSubmitError(res.message || 'Validation error: Please verify entered enquiry information.');
        setIsSubmitting(false);
        return;
      }

      // Handle Authentication Error (HTTP 401)
      if (res.statusCode === 401) {
        setSubmitError('Authentication required (HTTP 401). Your session has expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Handle Forbidden Error (HTTP 403)
      if (res.statusCode === 403) {
        setSubmitError('Access forbidden (HTTP 403). Your account role is not permitted to create enquiries.');
        setIsSubmitting(false);
        return;
      }

      // Handle Generic Non-Success
      if (!res.success || !res.data?.enquiry) {
        setSubmitError(res.message || 'Failed to create enquiry on backend. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Successful Creation (HTTP 201)
      const created = res.data.enquiry;
      const assignedObj = created.assignedTo as any;
      const liveLead: NewLeadItem = {
        id: created.id || created._id || `lead-${Date.now()}`,
        srNo: '01',
        name: created.name,
        initials,
        avatarColor: 'bg-blue-100 text-brand-primary',
        mobile: maskPhoneNumber(created.mobile),
        price: priceDisplay,
        remark: created.requirement || created.projectName || 'Active prospective enquiry',
        isMockData: false,
        createdAt: created.createdAt,
        assignedTo: assignedObj
          ? {
              id: (assignedObj._id || assignedObj.id || assignedObj).toString(),
              name: assignedObj.name || 'Sales Agent',
              role: assignedObj.role || 'SALES',
            }
          : null,
        status: created.status || 'ACTIVE',
      };

      const isUnassigned = !created.assignedTo;
      onEnquiryCreated(liveLead, created);
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
      setCreatedSummary({
        name: liveLead.name,
        ref: liveLead.id,
        isUnassigned,
        assigneeName: liveLead.assignedTo?.name,
      });
      setSubmitSuccess(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the backend server. Please verify network connectivity.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmit(false);
  };

  const handleConfirmReEnquiry = () => {
    executeSubmit(true);
  };

  const handleResetAndClose = () => {
    setFormData(initialFormState);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setSubmitSuccess(false);
    setDuplicateConflict(null);
    setCreatedSummary(null);
    setAdminAssignOption('ROUND_ROBIN');
    setAdminSelectedEmployeeId('');
    setManagerAssignOption('SELF');
    setManagerSelectedAgentId('');
    onClose();
  };

  const formatDuplicateBadge = (type: DuplicateType) => {
    switch (type) {
      case 'MOBILE_MATCH':
        return 'Mobile Number Conflict';
      case 'EMAIL_MATCH':
        return 'Email Address Conflict';
      case 'BOTH_FIELDS_MATCH':
        return 'Mobile & Email Match';
      case 'CROSS_FIELD_MATCH':
        return 'Cross-Field Collision (Mobile & Email belong to separate leads)';
      case 'CONCURRENT_COLLISION':
        return 'Concurrent Write Collision';
      default:
        return 'Duplicate Record Detected';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-enquiry-modal-title"
    >
      <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-2xl w-full my-auto sm:my-8 p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-edge pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-brand-primary rounded-xl shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="new-enquiry-modal-title"
                className="text-lg font-bold text-content-primary"
              >
                New Lead Enquiry
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Register a new prospect inquiry into the sales pipeline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-content-subtle hover:text-content-primary hover:bg-surface-subtle transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Success State */}
          {submitSuccess && createdSummary && (
            <div className="py-8 px-4 flex flex-col items-center text-center animate-in fade-in duration-200">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-status-success flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-content-primary mb-1">
                Enquiry Registered Successfully!
              </h3>
              {createdSummary.isUnassigned ? (
                <div className="mt-2 mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-w-md text-left">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Saved in Unassigned Queue</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    No active Sales Agents are currently mapped to this property. The lead has been safely saved in the Unassigned Queue (Ref: #{createdSummary.ref.slice(-6).toUpperCase()}), and an in-app system alert has been logged for administrators.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-content-secondary max-w-sm mb-4">
                  Prospect <strong className="text-content-primary">{createdSummary.name}</strong> has been enrolled into the active sales pipeline (Ref: #{createdSummary.ref.slice(-6).toUpperCase()})
                  {createdSummary.assigneeName ? (
                    <> assigned to <strong>{createdSummary.assigneeName}</strong>.</>
                  ) : (
                    '.'
                  )}
                </p>
              )}
              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormData(initialFormState);
                    setSubmitSuccess(false);
                    setCreatedSummary(null);
                  }}
                >
                  Create Another Enquiry
                </Button>
                <Button size="sm" variant="primary" onClick={handleResetAndClose}>
                  Done & View Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Form Content */}
          {!submitSuccess && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Duplicate Conflict / Red Flag Banner */}
              {duplicateConflict && (
                duplicateConflict.isRedFlag && duplicateConflict.previousEnquiry ? (
                  /* Red Flag Banner for Closed / Rejected Customer Re-Enquiry */
                  <div className="p-4 bg-red-50/95 border-2 border-red-500 rounded-xl text-xs text-red-950 shadow-sm animate-in fade-in space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-red-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
                        <Flag className="h-5 w-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-extrabold text-sm text-red-900 tracking-tight">
                            RED FLAG — Returning Customer Detected
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-red-200 text-red-900 px-2.5 py-0.5 rounded-full border border-red-300">
                            Previous {duplicateConflict.previousEnquiry.previousStatus}
                          </span>
                        </div>
                        <p className="text-red-800 text-xs leading-relaxed">
                          This customer previously had an enquiry that was marked <strong>{duplicateConflict.previousEnquiry.previousStatus}</strong>.
                          You may review historical details, update customer information in the fields below, and create a new lead for this returning customer.
                        </p>
                      </div>
                    </div>

                    {/* Previous Enquiry Details Grid */}
                    <div className="bg-white/95 p-3.5 rounded-lg border border-red-200 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Customer Name</span>
                        <span className="font-bold text-slate-900">{duplicateConflict.previousEnquiry.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Mobile Number</span>
                        <span className="font-bold text-slate-900">{duplicateConflict.previousEnquiry.mobile}</span>
                      </div>
                      {duplicateConflict.previousEnquiry.email && (
                        <div>
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Email</span>
                          <span className="font-medium text-slate-800">{duplicateConflict.previousEnquiry.email}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Project / Property</span>
                        <span className="font-medium text-slate-800">{duplicateConflict.previousEnquiry.previousProject || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Assigned Sales Agent</span>
                        <span className="font-medium text-slate-800">{duplicateConflict.previousEnquiry.previousAssignedAgent || 'Unassigned'}</span>
                      </div>
                      {duplicateConflict.previousEnquiry.previousManager && (
                        <div>
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Manager</span>
                          <span className="font-medium text-slate-800">{duplicateConflict.previousEnquiry.previousManager}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Status</span>
                        <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] ${
                          duplicateConflict.previousEnquiry.previousStatus === 'Deal Done'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {duplicateConflict.previousEnquiry.previousStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Budget</span>
                        <span className="font-medium text-slate-800">{duplicateConflict.previousEnquiry.previousBudget || 'N/A'}</span>
                      </div>
                      {duplicateConflict.previousEnquiry.previousEnquiryDate && (
                        <div>
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Enquiry Date</span>
                          <span className="font-medium text-slate-800">
                            {new Date(duplicateConflict.previousEnquiry.previousEnquiryDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {duplicateConflict.previousEnquiry.previousRemarks && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Previous Remarks</span>
                          <span className="font-medium text-slate-800 italic">"{duplicateConflict.previousEnquiry.previousRemarks}"</span>
                        </div>
                      )}
                    </div>

                    {/* Action to proceed with Re-Enquiry */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-red-200">
                      <span className="text-[11px] text-red-800 font-medium">
                        Historical records remain preserved. The new lead will receive a fresh enquiry ID.
                      </span>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmReEnquiry}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Confirm & Create New Lead for Returning Customer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Amber Duplicate Banner for active duplicates */
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 animate-in fade-in">
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-amber-900">
                            Duplicate Enquiry Detected
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                            {formatDuplicateBadge(duplicateConflict.type)}
                          </span>
                        </div>
                        <p className="text-amber-800 leading-relaxed">
                          {duplicateConflict.message}
                        </p>
                      </div>
                    </div>

                    {duplicateConflict.matches.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
                        <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                          Existing Lead Records Found:
                        </span>
                        {duplicateConflict.matches.map((match) => (
                          <div
                            key={match.id}
                            className="bg-white/90 p-2.5 rounded-lg border border-amber-200 text-[11px] flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{match.name}</span>
                              <span className="text-slate-500 ml-2">
                                Status: <strong className="text-slate-700">{match.status}</strong>
                              </span>
                              {match.assignedTo && (
                                <span className="text-slate-500 ml-2">
                                  Assigned to: <strong>{match.assignedTo.name}</strong>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              Ref: #{match.id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-amber-800 font-medium">
                      Policy: Existing active enquiries cannot be duplicated or automatically merged. Please coordinate with the assigned agent.
                    </p>
                  </div>
                )
              )}

              {/* General / Validation Error Banner */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-status-danger flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Section 1: Contact Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-3 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-primary" />
                  Prospect Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Prospect Name (Required) */}
                  <div>
                    <label
                      htmlFor="enquiry-name"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Full Name <span className="text-status-danger">*</span>
                    </label>
                    <input
                      id="enquiry-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="e.g. Vikram Malhotra"
                      className={`w-full px-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none transition-colors ${
                        touched.name && errors.name
                          ? 'border-status-danger ring-1 ring-status-danger'
                          : 'border-edge focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                      }`}
                    />
                    {touched.name && errors.name && (
                      <p className="text-[11px] text-status-danger mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Mobile Number (Required) */}
                  <div>
                    <label
                      htmlFor="enquiry-mobile"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Mobile Phone <span className="text-status-danger">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="enquiry-mobile"
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => handleFieldChange('mobile', e.target.value)}
                        onBlur={() => handleBlur('mobile')}
                        placeholder="e.g. 9876543210 or +91 98765 43210"
                        className={`w-full pl-8 pr-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none transition-colors ${
                          touched.mobile && errors.mobile
                            ? 'border-status-danger ring-1 ring-status-danger'
                            : 'border-edge focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                        }`}
                      />
                    </div>
                    {touched.mobile && errors.mobile ? (
                      <p className="text-[11px] text-status-danger mt-1">{errors.mobile}</p>
                    ) : (
                      <p className="text-[10px] text-content-subtle mt-1">
                        10-digit Indian number or international with country code
                      </p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label
                      htmlFor="enquiry-email"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Email Address <span className="text-content-subtle font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="enquiry-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="e.g. vikram@example.com"
                        className={`w-full pl-8 pr-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none transition-colors ${
                          touched.email && errors.email
                            ? 'border-status-danger ring-1 ring-status-danger'
                            : 'border-edge focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                        }`}
                      />
                    </div>
                    {touched.email && errors.email && (
                      <p className="text-[11px] text-status-danger mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Preferred Contact Method (Optional enum) */}
                  <div>
                    <label
                      htmlFor="enquiry-contact-method"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Preferred Contact Method
                    </label>
                    <select
                      id="enquiry-contact-method"
                      value={formData.preferredContactMethod}
                      onChange={(e) =>
                        handleFieldChange(
                          'preferredContactMethod',
                          e.target.value as PreferredContactMethod
                        )
                      }
                      className="w-full px-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="CALL">Phone Call</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Property & Budget Requirements */}
              <div className="pt-2 border-t border-edge">
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-3 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-brand-primary" />
                  Property & Budget Specification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Project Name */}
                  <div>
                    <label
                      htmlFor="enquiry-project"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Project / Property Name
                    </label>
                    <input
                      id="enquiry-project"
                      type="text"
                      list="property-suggestions"
                      value={formData.projectName}
                      onChange={(e) => handleFieldChange('projectName', e.target.value)}
                      placeholder="e.g. Greenfield Heights"
                      className="w-full px-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                    <datalist id="property-suggestions">
                      {propertyMappings.map((m) => (
                        <option key={m._id || m.id} value={m.propertyName} />
                      ))}
                    </datalist>
                  </div>

                  {/* Preferred Location */}
                  <div>
                    <label
                      htmlFor="enquiry-location"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Preferred Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="enquiry-location"
                        type="text"
                        value={formData.preferredLocation}
                        onChange={(e) => handleFieldChange('preferredLocation', e.target.value)}
                        placeholder="e.g. Whitefield, Bangalore"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>

                  {/* Unit Requirement */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="enquiry-requirement"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Unit / Requirement Type
                    </label>
                    <input
                      id="enquiry-requirement"
                      type="text"
                      value={formData.requirement}
                      onChange={(e) => handleFieldChange('requirement', e.target.value)}
                      placeholder="e.g. 3 BHK Luxury Apartment"
                      className="w-full px-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Budget Min */}
                  <div>
                    <label
                      htmlFor="enquiry-budget-min"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Budget Min (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
                        <IndianRupee className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="enquiry-budget-min"
                        type="number"
                        min="0"
                        step="50000"
                        value={formData.budgetMin}
                        onChange={(e) => handleFieldChange('budgetMin', e.target.value)}
                        onBlur={() => handleBlur('budgetMin')}
                        placeholder="e.g. 5000000"
                        className={`w-full pl-8 pr-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none transition-colors ${
                          errors.budgetMin
                            ? 'border-status-danger ring-1 ring-status-danger'
                            : 'border-edge focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                        }`}
                      />
                    </div>
                    {errors.budgetMin && (
                      <p className="text-[11px] text-status-danger mt-1">{errors.budgetMin}</p>
                    )}
                  </div>

                  {/* Budget Max */}
                  <div>
                    <label
                      htmlFor="enquiry-budget-max"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Budget Max (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
                        <IndianRupee className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="enquiry-budget-max"
                        type="number"
                        min="0"
                        step="50000"
                        value={formData.budgetMax}
                        onChange={(e) => handleFieldChange('budgetMax', e.target.value)}
                        onBlur={() => handleBlur('budgetMax')}
                        placeholder="e.g. 8500000"
                        className={`w-full pl-8 pr-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none transition-colors ${
                          errors.budgetMax
                            ? 'border-status-danger ring-1 ring-status-danger'
                            : 'border-edge focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                        }`}
                      />
                    </div>
                    {errors.budgetMax && (
                      <p className="text-[11px] text-status-danger mt-1">{errors.budgetMax}</p>
                    )}
                  </div>

                  {/* Lead Source */}
                  <div>
                    <label
                      htmlFor="enquiry-source"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Lead Source
                    </label>
                    <select
                      id="enquiry-source"
                      value={formData.source}
                      onChange={(e) => handleFieldChange('source', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="Website Enquiry">Website Enquiry</option>
                      <option value="Phone Call">Phone Call / Inbound</option>
                      <option value="Walk-in">Walk-in Customer</option>
                      <option value="Referral">Client Referral</option>
                      <option value="Channel Partner">Channel Partner / Broker</option>
                      <option value="Digital Campaign">Digital Ad Campaign</option>
                      <option value="Social Media">Social Media</option>
                    </select>
                  </div>

                  {/* Preferred Timing */}
                  <div>
                    <label
                      htmlFor="enquiry-timing"
                      className="block text-xs font-semibold text-content-primary mb-1"
                    >
                      Preferred Contact Timing
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="enquiry-timing"
                        type="text"
                        value={formData.preferredContactTiming}
                        onChange={(e) => handleFieldChange('preferredContactTiming', e.target.value)}
                        placeholder="e.g. Weekdays 10 AM - 12 PM"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Lead Assignment & Ownership */}
              <div className="pt-2 border-t border-edge">
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-3 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-brand-primary" />
                  Lead Assignment & Ownership
                </h3>

                {role === 'SALES' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-content-primary">Automatic Self-Assignment</span>
                      <p className="text-content-muted text-[11px] mt-0.5">
                        This lead will be automatically assigned to your operational queue ({user?.name}).
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-brand-primary border border-blue-200">
                      Assigned to You
                    </span>
                  </div>
                )}

                {role === 'MANAGER' && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-xs font-semibold text-content-primary block">
                      Choose Lead Assignment:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer flex-1 transition-colors ${
                          managerAssignOption === 'SELF'
                            ? 'bg-blue-50/70 border-brand-primary text-brand-primary font-medium'
                            : 'bg-white border-edge text-content-primary hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="managerAssignOption"
                          value="SELF"
                          checked={managerAssignOption === 'SELF'}
                          onChange={() => setManagerAssignOption('SELF')}
                          className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                        />
                        <div>
                          <span className="block font-medium">Keep Assigned to Myself</span>
                          <span className="text-[10px] text-content-muted">Assign to your own queue ({user?.name})</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer flex-1 transition-colors ${
                          managerAssignOption === 'TEAM_MEMBER'
                            ? 'bg-blue-50/70 border-brand-primary text-brand-primary font-medium'
                            : 'bg-white border-edge text-content-primary hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="managerAssignOption"
                          value="TEAM_MEMBER"
                          checked={managerAssignOption === 'TEAM_MEMBER'}
                          onChange={() => setManagerAssignOption('TEAM_MEMBER')}
                          className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                        />
                        <div>
                          <span className="block font-medium">Assign to Team Member</span>
                          <span className="text-[10px] text-content-muted">Select an active agent from your team</span>
                        </div>
                      </label>
                    </div>

                    {managerAssignOption === 'TEAM_MEMBER' && (
                      <div className="pt-2">
                        <label htmlFor="manager-select-agent" className="block text-xs font-semibold text-content-primary mb-1">
                          Select Team Member <span className="text-status-danger">*</span>
                        </label>
                        <select
                          id="manager-select-agent"
                          value={managerSelectedAgentId}
                          onChange={(e) => {
                            setManagerSelectedAgentId(e.target.value);
                            if (errors.managerSelectedAgentId) {
                              setErrors((prev) => {
                                const n = { ...prev };
                                delete n.managerSelectedAgentId;
                                return n;
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary focus:outline-none transition-colors ${
                            errors.managerSelectedAgentId
                              ? 'border-status-danger ring-1 ring-status-danger'
                              : 'border-edge focus:border-brand-primary'
                          }`}
                        >
                          <option value="">-- Choose active team agent --</option>
                          {managerTeamAgents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.email})
                            </option>
                          ))}
                        </select>
                        {errors.managerSelectedAgentId && (
                          <p className="text-[11px] text-status-danger mt-1">{errors.managerSelectedAgentId}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {role === 'ADMIN' && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-xs font-semibold text-content-primary block">
                      Distribution & Assignment Mode:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer flex-1 transition-colors ${
                          adminAssignOption === 'ROUND_ROBIN'
                            ? 'bg-blue-50/70 border-brand-primary text-brand-primary font-medium'
                            : 'bg-white border-edge text-content-primary hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="adminAssignOption"
                          value="ROUND_ROBIN"
                          checked={adminAssignOption === 'ROUND_ROBIN'}
                          onChange={() => setAdminAssignOption('ROUND_ROBIN')}
                          className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                        />
                        <div>
                          <span className="block font-medium">Round Robin (Property-Wise)</span>
                          <span className="text-[10px] text-content-muted">Assigns sequentially to mapped agents</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer flex-1 transition-colors ${
                          adminAssignOption === 'MANUAL'
                            ? 'bg-blue-50/70 border-brand-primary text-brand-primary font-medium'
                            : 'bg-white border-edge text-content-primary hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="adminAssignOption"
                          value="MANUAL"
                          checked={adminAssignOption === 'MANUAL'}
                          onChange={() => setAdminAssignOption('MANUAL')}
                          className="text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                        />
                        <div>
                          <span className="block font-medium">Manual Assignment</span>
                          <span className="text-[10px] text-content-muted">Directly select any active staff</span>
                        </div>
                      </label>
                    </div>

                    {adminAssignOption === 'ROUND_ROBIN' ? (
                      <p className="text-[11px] text-content-muted bg-white p-2.5 rounded-lg border border-edge">
                        Lead will be assigned to the next eligible active Sales Agent mapped to <strong>{formData.projectName.trim() || 'the specified property'}</strong>. If no active mapped agent exists, the lead will safely enter the Unassigned Queue and alert administrators.
                      </p>
                    ) : (
                      <div className="pt-2">
                        <label htmlFor="admin-select-employee" className="block text-xs font-semibold text-content-primary mb-1">
                          Select Employee (Manager or Sales Agent) <span className="text-status-danger">*</span>
                        </label>
                        <select
                          id="admin-select-employee"
                          value={adminSelectedEmployeeId}
                          onChange={(e) => {
                            setAdminSelectedEmployeeId(e.target.value);
                            if (errors.adminSelectedEmployeeId) {
                              setErrors((prev) => {
                                const n = { ...prev };
                                delete n.adminSelectedEmployeeId;
                                return n;
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 text-xs bg-surface-card border rounded-lg text-content-primary focus:outline-none transition-colors ${
                            errors.adminSelectedEmployeeId
                              ? 'border-status-danger ring-1 ring-status-danger'
                              : 'border-edge focus:border-brand-primary'
                          }`}
                        >
                          <option value="">-- Choose active staff member --</option>
                          {eligibleEmployees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role} - {emp.email})
                            </option>
                          ))}
                        </select>
                        {errors.adminSelectedEmployeeId && (
                          <p className="text-[11px] text-status-danger mt-1">{errors.adminSelectedEmployeeId}</p>
                        )}
                        <p className="text-[10px] text-content-muted mt-1">
                          Manual assignment does not alter or advance the property's Round Robin sequence pointer.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Notes / Description */}
              <div className="pt-2 border-t border-edge">
                <label
                  htmlFor="enquiry-description"
                  className="block text-xs font-semibold text-content-primary mb-1 flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-brand-primary" />
                  Initial Notes / Requirement Description
                </label>
                <textarea
                  id="enquiry-description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Record client specific preferences, timeline to purchase, or site visit intentions..."
                  className="w-full px-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-edge flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={<Plus className="h-4 w-4" />}
                  className="shadow-sm shadow-blue-500/20"
                >
                  {isSubmitting ? 'Registering Enquiry...' : 'Register Enquiry'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
