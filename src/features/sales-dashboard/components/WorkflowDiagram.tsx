import React from "react";
import {
  PhoneCall,
  CalendarCheck2,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  Mail,
  FileEdit,
  MessageSquareQuote,
  Clock,
  CheckSquare,
  History,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card } from "../../../components/ui/Card.js";

export const WorkflowDiagram: React.FC = () => {
  return (
    <Card className="mb-6 overflow-hidden border-blue-100 bg-white shadow-sm" noPadding>
      {/* Header Bar */}
      <div className="p-5 sm:px-6 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white border-b border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary text-white rounded-lg shadow-xs shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-content-primary tracking-tight">
                Nueways CRM — Operational Sales Workflow
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-brand-primary px-2 py-0.5 rounded-full">
                Pipeline Stages
              </span>
            </div>
            <p className="text-xs text-content-muted mt-0.5">
              Structured customer engagement lifecycle from initial enquiry follow-up to final deal closure.
            </p>
          </div>
        </div>

        {/* Step Sequence Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-content-muted bg-white px-3 py-1.5 rounded-lg border border-edge shadow-xs">
          <span className="text-brand-primary font-bold">4-Stage Workflow:</span>
          <span>01. Follow-up</span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span>02. Meeting Plan</span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span>03. Site Visit Plan</span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span className="text-emerald-700">04. Deal Done</span>
        </div>
      </div>

      {/* 4-Step Diagram Container */}
      <div className="p-5 sm:p-6 bg-slate-50/40">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          
          {/* =========================================================================
           * STEP 1: FOLLOW-UP (EXPANDED WITH ALL 6 DETAILS)
           * ========================================================================= */}
          <div className="relative flex flex-col rounded-xl border-2 border-blue-300 bg-white shadow-sm transition-all hover:shadow-md">
            {/* Step Header */}
            <div className="p-4 rounded-t-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-md backdrop-blur-xs">
                  Step 01
                </span>
                <span className="text-[11px] font-semibold text-blue-100">
                  Initial Touchpoint
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-white shrink-0" />
                <h3 className="text-base font-extrabold tracking-tight">
                  Follow-up
                </h3>
              </div>
              <p className="text-[11px] text-blue-100 mt-1 leading-snug">
                Engage prospect, understand requirement, schedule callbacks, and log complete conversation history.
              </p>
            </div>

            {/* Step 1 Expanded Details (6 Items) */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5 text-xs text-content-secondary">
              
              {/* 1. Contact Method */}
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                  <span>1. Contact Method</span>
                </div>
                <p className="text-[11px] text-content-muted mb-2">
                  Multi-channel outreach configured for sales agents:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    <MessageCircle className="h-3 w-3 text-emerald-600" />
                    WhatsApp
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                    <Phone className="h-3 w-3 text-blue-600" />
                    Call
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
                    <Mail className="h-3 w-3 text-purple-600" />
                    Email
                  </span>
                </div>
              </div>

              {/* 2. Enquiry Detail Update */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-content-primary mb-1">
                  <FileEdit className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>2. Enquiry Detail Update</span>
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Update the latest customer enquiry or requirement details (budget range, preferred configuration, property location, and specific buyer criteria).
                </p>
              </div>

              {/* 3. Remark */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-content-primary mb-1">
                  <MessageSquareQuote className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>3. Remark</span>
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Record the conversation, customer response, buyer sentiment, and next action clearly for team visibility.
                </p>
              </div>

              {/* 4. Next Follow-up Date & Time */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-content-primary mb-1">
                  <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>4. Next Follow-up Date & Time</span>
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Specify exact calendar date and time when the next follow-up callback is scheduled. Automatically queues pending follow-up alerts.
                </p>
              </div>

              {/* 5. Follow-up Outcome */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-content-primary mb-1">
                  <CheckSquare className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>5. Follow-up Outcome</span>
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed mb-1.5">
                  Standardized disposition tags supported by the application:
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
                  <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    Connected
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Call Back Requested
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    No Answer
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Busy / Switched Off
                  </span>
                </div>
              </div>

              {/* 6. Follow-up History */}
              <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-1">
                  <History className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
                  <span>6. Follow-up History</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                  Every new follow-up is saved as a separate immutable record; previous remarks, timestamps, agent identities, and activities remain preserved in full.
                </p>
              </div>

            </div>

            {/* Bottom Status / Next Step Hint */}
            <div className="px-4 py-2.5 bg-blue-50/50 rounded-b-xl border-t border-blue-100 flex items-center justify-between text-[11px] font-semibold text-brand-primary">
              <span>Ready for consultation</span>
              <span className="flex items-center gap-1">
                Advance to Step 2 <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* =========================================================================
           * STEP 2: MEETING PLAN
           * ========================================================================= */}
          <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
            {/* Step Header */}
            <div className="p-4 rounded-t-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-md backdrop-blur-xs">
                  Step 02
                </span>
                <span className="text-[11px] font-semibold text-purple-100">
                  Consultation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5 text-white shrink-0" />
                <h3 className="text-base font-extrabold tracking-tight">
                  Meeting Plan
                </h3>
              </div>
              <p className="text-[11px] text-purple-100 mt-1 leading-snug">
                Coordinate and conduct structured in-person or virtual consultation with qualified prospects.
              </p>
            </div>

            {/* Step 2 Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs text-content-secondary">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  1. Meeting Scheduling & Venue
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Fix mutually agreed appointment date, time, and mode (office conference, video call, or client location).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  2. Project Presentation & Floor Plans
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Present tailored project brochures, unit inventory, architectural drawings, and customized pricing sheets.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  3. Financial & Budget Alignment
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Evaluate client financing options, down-payment readiness, pre-approved bank loans, and purchase timeline.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  4. Meeting Minutes & Decisions
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Document key discussion highlights, client preferences, objections addressed, and agreed next milestones.
                </p>
              </div>
            </div>

            {/* Bottom Status / Next Step Hint */}
            <div className="px-4 py-2.5 bg-purple-50/50 rounded-b-xl border-t border-purple-100 flex items-center justify-between text-[11px] font-semibold text-purple-700">
              <span>Shortlisted units confirmed</span>
              <span className="flex items-center gap-1">
                Advance to Step 3 <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* =========================================================================
           * STEP 3: SITE VISIT PLAN
           * ========================================================================= */}
          <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
            {/* Step Header */}
            <div className="p-4 rounded-t-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-md backdrop-blur-xs">
                  Step 03
                </span>
                <span className="text-[11px] font-semibold text-amber-100">
                  Physical Tour
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-white shrink-0" />
                <h3 className="text-base font-extrabold tracking-tight">
                  Site Visit Plan
                </h3>
              </div>
              <p className="text-[11px] text-amber-100 mt-1 leading-snug">
                Organize accompanied property inspections, sample unit walkthroughs, and locality tours.
              </p>
            </div>

            {/* Step 3 Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs text-content-secondary">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  1. Visit Logistics & Agent Escort
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Schedule on-site arrival, designate host sales executive, and arrange property access or cab pickup if required.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  2. Sample Flat & Amenity Walkthrough
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Conduct comprehensive walkthrough of demo flats, clubhouses, parking allocations, and construction progress.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  3. Locality & Infrastructure Briefing
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Highlight connectivity, nearby metro stations, schools, hospitals, commercial hubs, and future road expansion.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  4. Site Visit Feedback & Intent
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Log customer rating, preferred tower and floor number, spot objections, and willingness to initiate booking.
                </p>
              </div>
            </div>

            {/* Bottom Status / Next Step Hint */}
            <div className="px-4 py-2.5 bg-amber-50/50 rounded-b-xl border-t border-amber-100 flex items-center justify-between text-[11px] font-semibold text-amber-800">
              <span>Property verified by buyer</span>
              <span className="flex items-center gap-1">
                Advance to Step 4 <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* =========================================================================
           * STEP 4: DEAL DONE
           * ========================================================================= */}
          <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
            {/* Step Header */}
            <div className="p-4 rounded-t-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-md backdrop-blur-xs">
                  Step 04
                </span>
                <span className="text-[11px] font-semibold text-emerald-100">
                  Closure & Onboarding
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                <h3 className="text-base font-extrabold tracking-tight">
                  Deal Done
                </h3>
              </div>
              <p className="text-[11px] text-emerald-100 mt-1 leading-snug">
                Finalize commercial negotiation, secure booking deposit, execute agreements, and welcome customer.
              </p>
            </div>

            {/* Step 4 Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs text-content-secondary">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  1. Commercials & Discounts Approval
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Finalize all-inclusive pricing, payment installment schedule, bank discounts, and obtain management sign-off.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  2. Token Deposit & Allotment
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Collect booking advance / token payment, generate official receipt, and lock chosen unit against duplicate reservation.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-content-primary mb-1">
                  3. Agreement Execution & KYC
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Complete buyer KYC verification, prepare Builder-Buyer Agreement (BBA), and schedule formal execution/registration.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="font-bold text-emerald-950 mb-1">
                  4. Post-Sales Handover
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                  Enquiry status successfully marked as CLOSED (Deal Won). Handover lead to customer relationship manager for construction updates.
                </p>
              </div>
            </div>

            {/* Bottom Status / Completion Banner */}
            <div className="px-4 py-2.5 bg-emerald-50/50 rounded-b-xl border-t border-emerald-100 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Pipeline Closed Won
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                100% Complete
              </span>
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
};
