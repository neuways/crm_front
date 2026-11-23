import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  IndianRupee,
  Calendar,
  User,
  Tag,
  History,
  Layers,
  Check,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { enquiryService } from "../../services/enquiry.service.js";
import { IEnquiry, IDealDone } from "../../types/enquiry.types.js";

export const CompletedDealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<IEnquiry | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDealDetails = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [enquiryRes, activitiesRes] = await Promise.all([
        enquiryService.getEnquiryById(dealId),
        enquiryService.getActivities(dealId),
      ]);

      if (!enquiryRes.success || !enquiryRes.data?.enquiry) {
        setError(enquiryRes.message || "Failed to load deal record from database.");
        return;
      }

      setDeal(enquiryRes.data.enquiry);

      if (activitiesRes.success && activitiesRes.data?.activities) {
        setActivities(activitiesRes.data.activities);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error loading deal details.");
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadDealDetails();
  }, [loadDealDetails]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
        <span className="text-xs font-semibold text-content-secondary">
          Loading finalized deal details...
        </span>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-surface-card border border-edge rounded-card text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-content-primary">Unable to Load Deal</h2>
        <p className="text-xs text-content-muted leading-relaxed">
          {error || "The requested deal record could not be found or you are not authorized to view it."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/sales/completed-deals")}>
            Back to Completed Deals
          </Button>
          <Button variant="primary" size="sm" onClick={loadDealDetails}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const dealInfo: Partial<IDealDone> = deal.dealDone || {};
  const agent = (deal as any).assignedTo;
  const meeting = deal.meetingPlan;
  const siteVisit = deal.siteVisitPlan;

  const confirmedDateStr = dealInfo.confirmedAt
    ? new Date(dealInfo.confirmedAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date(deal.updatedAt || deal.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* -------------------------------------------------------------
       * Top Breadcrumbs & Back Navigation
       * ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-edge">
        <div>
          <button
            type="button"
            onClick={() => navigate("/sales/completed-deals")}
            className="flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-brand-primary mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Completed Deals</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              {deal.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalized & Confirmed
            </span>
          </div>
          <p className="text-xs text-content-muted mt-1">
            Confirmed on {confirmedDateStr} • Managed by {agent?.name || "Assigned Agent"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadDealDetails}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/sales/dashboard")}
          >
            Sales Dashboard
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Two-Column Summary Grid: Finalized Deal Specs + Assigned Agent
       * ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Specs Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-50/70 via-white to-surface-card border border-emerald-200 rounded-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Finalized Transaction Terms</h2>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Legally Confirmed Property Deal
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Final Deal Value
              </span>
              <span className="text-2xl font-black text-emerald-700">
                ₹{Number(dealInfo.price || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Project</span>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {dealInfo.project || deal.projectName || "Standard Project"}
              </span>
            </div>
            <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Property Type</span>
              <span className="text-xs font-bold text-slate-900">
                {dealInfo.propertyType || deal.requirement || "Residential"}
              </span>
            </div>
            <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Unit Size</span>
              <span className="text-xs font-bold text-slate-900">
                {dealInfo.size || "Standard Area"}
              </span>
            </div>
            <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Confirmation Status</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Explicitly Confirmed
              </span>
            </div>
            <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Confirmation Date & Time</span>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {confirmedDateStr}
              </span>
            </div>
          </div>

          {dealInfo.remarks && (
            <div className="pt-2 border-t border-emerald-100/70">
              <span className="text-[11px] font-bold text-slate-600 block mb-1">
                Closing Remarks & Booking Reference
              </span>
              <p className="text-xs text-slate-700 leading-relaxed italic bg-white/60 p-3 rounded-lg border border-emerald-100">
                "{dealInfo.remarks}"
              </p>
            </div>
          )}
        </div>

        {/* Assigned Sales Agent Card */}
        <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-edge">
            <div className="p-2 bg-blue-50 text-brand-primary rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Assigned Sales Agent</h2>
              <span className="text-[11px] text-content-muted">Owner of this client record</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-content-muted block">Agent Name</span>
              <span className="text-sm font-bold text-content-primary">
                {agent?.name || "Unassigned"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-content-muted block">Email Address</span>
              <span className="text-xs font-mono text-content-secondary">
                {agent?.email || "No email on record"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-content-muted block">Organization Role</span>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-blue-50 text-brand-primary font-semibold text-xs rounded-full border border-blue-200">
                {agent?.role || "SALES"}
              </span>
            </div>
            <div className="pt-2 border-t border-edge text-[11px] text-content-muted">
              Record managed with strict role-based access control.
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Complete Original Customer Enquiry Card
       * ------------------------------------------------------------- */}
      <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-edge pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">
                Original Prospect Enquiry Information
              </h2>
              <span className="text-[11px] text-content-muted">
                Complete customer submitted enquiry details backed by database record
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200">
            Status: {deal.status || "ACTIVE"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Customer Full Name
            </span>
            <span className="font-bold text-content-primary text-sm">{deal.name}</span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Full Mobile Contact
            </span>
            <span className="font-mono font-bold text-content-primary text-sm flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-primary" />
              {deal.mobile}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Email Address
            </span>
            <span className="font-mono text-content-primary flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-content-muted" />
              {deal.email || "Not provided"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Contact Preference
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold inline-flex items-center gap-1 border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" />
              {deal.preferredContactMethod || "CALL"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Enquiry Project Name
            </span>
            <span className="font-semibold text-content-primary">
              {deal.projectName || "Not provided"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Requirement Description
            </span>
            <span className="font-semibold text-content-primary">
              {deal.requirement || "Not provided"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Original Budget Range
            </span>
            <span className="font-bold text-emerald-700">
              {deal.budgetMin && deal.budgetMax
                ? `₹${deal.budgetMin.toLocaleString()} - ₹${deal.budgetMax.toLocaleString()}`
                : deal.budgetMin
                ? `From ₹${deal.budgetMin.toLocaleString()}`
                : deal.budgetMax
                ? `Up to ₹${deal.budgetMax.toLocaleString()}`
                : "Not provided"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Enquiry Source
            </span>
            <span className="font-semibold text-content-primary flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-content-muted" />
              {deal.source || "Direct Walk-in / Website"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Preferred Timing
            </span>
            <span className="font-medium text-content-primary">
              {deal.preferredContactTiming || "Anytime"}
            </span>
          </div>

          <div>
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Enquiry Date
            </span>
            <span className="font-medium text-content-primary">
              {new Date(deal.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-content-muted block text-[11px] font-semibold mb-0.5">
              Notes / Location Preferences
            </span>
            <p className="text-content-secondary leading-relaxed">
              {deal.description || "No specific notes provided during initial creation."}
            </p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * 4-Stage Sequential Workflow Progression Cards
       * ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-content-primary">
          Completed 4-Stage Sales Journey
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-surface-card border border-emerald-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                Stage 1
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" /> Done
              </span>
            </div>
            <h4 className="font-bold text-xs text-content-primary">Customer Follow-up</h4>
            <p className="text-[11px] text-content-muted">
              Client requirements qualified, discussion logged, and preferences confirmed.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-card border border-emerald-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                Stage 2
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" /> Done
              </span>
            </div>
            <h4 className="font-bold text-xs text-content-primary">Meeting Plan</h4>
            <p className="text-[11px] text-content-muted">
              {meeting?.meetingPlace
                ? `Meeting at ${meeting.meetingPlace} on ${meeting.meetingDate} with ${meeting.managerName || "Manager"}.`
                : "Meeting successfully coordinated and finalized."}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-card border border-emerald-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                Stage 3
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" /> Done
              </span>
            </div>
            <h4 className="font-bold text-xs text-content-primary">Site Visit Plan</h4>
            <p className="text-[11px] text-content-muted">
              {siteVisit?.siteVisitAddress
                ? `Site inspection at ${siteVisit.siteVisitAddress} on ${siteVisit.siteVisitDate}. Outcome: ${siteVisit.visitOutcome || "Approved"}.`
                : "Property inspection successfully performed and approved."}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-surface-card border border-emerald-300 ring-1 ring-emerald-400 bg-emerald-50/20 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Stage 4
              </span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Deal Done
              </span>
            </div>
            <h4 className="font-bold text-xs text-emerald-950">Deal Finalized</h4>
            <p className="text-[11px] text-emerald-800">
              Contract signed at ₹{Number(dealInfo.price || 0).toLocaleString()} for {dealInfo.size || "property"}.
            </p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Chronological Audit & Activity Timeline
       * ------------------------------------------------------------- */}
      <div className="bg-surface-card border border-edge rounded-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-edge">
          <div className="p-2 bg-blue-50 text-brand-primary rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary">
              Immutable Activity Audit History
            </h3>
            <span className="text-[11px] text-content-muted">
              Full chronological timeline of interactions, stage transitions, and deal finalization
            </span>
          </div>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-content-muted py-4 text-center">
            No activity records found for this deal.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act._id || act.id}
                className="p-3.5 bg-surface-subtle/50 border border-edge rounded-xl text-xs space-y-1 hover:bg-surface-subtle transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-content-primary">
                      {act.performedByName || act.createdByName || "System Employee"}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {act.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-[11px] text-content-muted">
                    {new Date(act.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-content-secondary leading-relaxed pt-0.5">{act.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
