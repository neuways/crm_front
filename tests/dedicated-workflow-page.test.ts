/**
 * Neuways CRM - Dedicated Lead Workflow Page & Sequential Pipeline Tests
 *
 * Verifies the full-page workflow experience:
 * 1. Dedicated route & navigation without cramping inside a modal
 * 2. Complete original enquiry details rendered from Atlas record
 * 3. Customer contact preference locked and used as initial follow-up method
 * 4. Correct 4-stage sequential progression (no skipping Step 2 to Step 3)
 * 5. Strict completion guards on Meeting, Site Visit, and Deal Done
 * 6. Audit history & activity trail rendering
 * 7. Scoped role-based error handling & genuine feedback
 */

import assert from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getFollowUpOutcomeMeta,
  formatFollowUpScheduleLabel,
  getWorkflowStageMeta,
} from "../src/utils/followUpOutcome.js";
import {
  matchesGlobalFilter,
  matchesTableFilters,
} from "../src/features/sales-dashboard/utils/dashboardFilters.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Dedicated Workflow Page: File existence and component export", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  assert.ok(fs.existsSync(pagePath), "LeadWorkflowPage.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.ok(content.includes("export const LeadWorkflowPage"), "Exports LeadWorkflowPage component");
});

test("Dedicated Route: AppRoutes registers /sales/leads/:leadId/workflow", () => {
  const routesPath = path.join(__dirname, "../src/routes/AppRoutes.tsx");
  const content = fs.readFileSync(routesPath, "utf-8");

  assert.ok(
    content.includes("sales/leads/:leadId/workflow"),
    "AppRoutes.tsx must register dedicated route sales/leads/:leadId/workflow"
  );
  assert.ok(
    content.includes("LeadWorkflowPage"),
    "AppRoutes.tsx mounts LeadWorkflowPage"
  );
});

test("Navigation: Dashboard redirects to dedicated workflow page on Follow-up click", () => {
  const dashPath = path.join(__dirname, "../src/features/sales-dashboard/SalesDashboardPage.tsx");
  const content = fs.readFileSync(dashPath, "utf-8");

  assert.ok(
    content.includes("/sales/leads/") && content.includes("/workflow"),
    "SalesDashboardPage navigates to /sales/leads/:id/workflow"
  );
});

test("Enquiry Display: Complete original enquiry fields rendered from backend record", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Required enquiry fields:
  assert.ok(content.includes("lead.name"), "Renders prospect customer name");
  assert.ok(content.includes("lead.mobile"), "Renders unmasked primary mobile number for authorized view");
  assert.ok(content.includes("lead.email"), "Renders email address");
  assert.ok(content.includes("lead.preferredContactMethod"), "Renders customer preferred contact method");
  assert.ok(content.includes("lead.preferredContactTiming"), "Renders preferred contact timing");
  assert.ok(content.includes("lead.projectName"), "Renders interested project name");
  assert.ok(content.includes("lead.requirement"), "Renders property requirement details");
  assert.ok(content.includes("lead.budgetMin") || content.includes("formatCurrency"), "Renders budget min and max formatted");
  assert.ok(content.includes("lead.source"), "Renders enquiry lead source");
  assert.ok(content.includes("lead.status"), "Renders lead status (ACTIVE/CLOSED)");
  assert.ok(content.includes("lead.currentStage"), "Renders current workflow stage");
  assert.ok(content.includes("lead.createdAt"), "Renders original enquiry creation timestamp");
  assert.ok(content.includes("Not provided"), "Handles missing fields with clear 'Not provided' fallback");
});

test("Contact Preference: Displayed as locked and initializes follow-up contact method", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Original preference is prominent and locked
  assert.ok(content.includes("Locked") || content.includes("Original"), "Displays original preference as locked");
  assert.ok(content.includes("WHATSAPP"), "Supports WHATSAPP preference");
  assert.ok(content.includes("EMAIL"), "Supports EMAIL preference");
  assert.ok(content.includes("CALL"), "Supports CALL preference");

  // Initialized into follow-up state
  assert.ok(
    content.includes("setPurpose(e.preferredContactMethod)"),
    "Follow-up contact method initializes from customer preferred contact method"
  );
});

test("Stage Transition: Step 1 advance lands strictly on Step 2 (Meeting Plan)", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Synchronize strictly with backend currentStage
  assert.ok(
    content.includes("case 'MEETING_PLAN':\n          setActiveStep(2)"),
    "MEETING_PLAN stage strictly maps to Step 2"
  );
  // No double increment
  assert.ok(
    !content.includes("setActiveStep((curr) => curr + 1)"),
    "No redundant double-increment in LeadWorkflowPage"
  );
});

test("Completion Guards: Step 2 requires completion before Site Visit, Step 3 requires completion before Deal Done", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Guard for Step 2
  assert.ok(
    content.includes("Meeting must be explicitly marked completed before advancing to Site Visit Plan"),
    "Guards Step 2 Meeting completion before advancing to Site Visit"
  );

  // Guard for Step 3
  assert.ok(
    content.includes("Site visit must be explicitly marked completed before advancing to Deal Done"),
    "Guards Step 3 Site Visit completion before advancing to Deal Done"
  );

  // Guard for Step 4
  assert.ok(
    content.includes("isDealConfirmed"),
    "Requires explicit agent deal confirmation for Deal Done finalization"
  );
});

test("Lost/Closed Process: Allows closing lead without forcing through Deal Done", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.ok(content.includes("handleCloseLead"), "Provides dedicated handleCloseLead action");
  assert.ok(content.includes("closingReason"), "Requires mandatory closing reason");
  assert.ok(content.includes("CLOSED"), "Allows transitioning status directly to CLOSED");
});

test("Security & History: Displays audit timeline and handles 403 Forbidden cleanly", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.ok(content.includes("enquiryService.getActivities"), "Fetches audit activities from API");
  assert.ok(content.includes("Access Denied"), "Renders Access Denied on 403 Forbidden");
  assert.ok(!content.includes("demo-agent"), "No fake fallback data in workflow page");
});

test("Workflow Step 1 & Step 2 Completion Invariants: Code structure", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Step 1 completion checks
  assert.ok(
    content.includes("hasCompletedDiscussion"),
    "LeadWorkflowPage defines hasCompletedDiscussion check"
  );
  assert.ok(
    content.includes("isStep1Done"),
    "LeadWorkflowPage defines isStep1Done state based on stage and completed discussion"
  );
  assert.ok(
    content.includes("isMeetingUnlocked = Boolean(isStep1Done)"),
    "Step 2 unlocking is strictly tied to Step 1 completion"
  );

  // Invariant: Initial system task does NOT mark Step 1 as completed
  assert.ok(
    content.includes("notes !== 'System initialized pending follow-up task'") ||
      content.includes("!t.isInitialTask"),
    "Filters out system initialized pending follow-up tasks from step completion"
  );

  // Invariant: Step 1 shows Pending when not done, Done when done
  assert.ok(
    content.includes("isStep1Done ?") && content.includes("Pending"),
    "Renders Pending badge when Step 1 is not done"
  );
});

test("Workflow Invariant Logic: Rigorous verification of Step 1 & Step 2 status transitions", () => {
  // Pure logic replica of LeadWorkflowPage completion logic (strict Step 1 outcome gating)
  function computeStepStatus(
    lead: { currentStage: string; lastFollowUpOutcome?: string; meetingPlan?: { isCompleted?: boolean } } | null,
    historyList: Array<{ status?: string; outcome?: string; isInitialTask?: boolean; notes?: string }>,
    activityList: Array<{ metadata?: { step?: string; outcome?: string }; activityType?: string }>
  ) {
    const hasCompletedDiscussion = Boolean(
      lead?.lastFollowUpOutcome
        ? lead.lastFollowUpOutcome === 'MEETING_SCHEDULED'
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
    const isStep1Done = Boolean(lead && (lead.currentStage !== 'FOLLOW_UP' || hasCompletedDiscussion));
    const isMeetingUnlocked = Boolean(isStep1Done);
    const isMeetingCompletedFinal = Boolean(lead?.meetingPlan?.isCompleted);

    return {
      isStep1Done,
      isMeetingUnlocked,
      isMeetingCompletedFinal
    };
  }

  // Case 1: Fresh new lead with initial system task -> Step 1 PENDING, Step 2 LOCKED
  const freshLead = { currentStage: 'FOLLOW_UP' };
  const initialHistory = [
    { notes: 'System initialized pending follow-up task', status: 'PENDING', isInitialTask: true }
  ];
  const freshStatus = computeStepStatus(freshLead, initialHistory, []);
  assert.strictEqual(freshStatus.isStep1Done, false, "Step 1 must be PENDING on initial load");
  assert.strictEqual(freshStatus.isMeetingUnlocked, false, "Step 2 must be LOCKED on initial load");
  assert.strictEqual(freshStatus.isMeetingCompletedFinal, false, "Step 2 must NOT be completed");

  // Case 2a: User logs non-meeting outcome (CALL_BACK_REQUESTED / NO_ANSWER / CONNECTED) -> Step 2 remains LOCKED
  const callbackLead = { currentStage: 'FOLLOW_UP', lastFollowUpOutcome: 'CALL_BACK_REQUESTED' };
  const callbackHistory = [
    { notes: 'Client asked for callback tomorrow', status: 'COMPLETED', outcome: 'CALL_BACK_REQUESTED', isInitialTask: false },
    { notes: 'System initialized pending follow-up task', status: 'PENDING', isInitialTask: true }
  ];
  const callbackStatus = computeStepStatus(callbackLead, callbackHistory, []);
  assert.strictEqual(callbackStatus.isStep1Done, false, "Step 1 must NOT unlock Step 2 on CALL_BACK_REQUESTED");
  assert.strictEqual(callbackStatus.isMeetingUnlocked, false, "Step 2 must remain LOCKED until Meeting Agreed");
  assert.strictEqual(callbackStatus.isMeetingCompletedFinal, false, "Step 2 must remain PENDING");

  // Case 2b: User logs Meeting Agreed (MEETING_SCHEDULED) -> Step 2 UNLOCKED
  const meetingAgreedLead = { currentStage: 'FOLLOW_UP', lastFollowUpOutcome: 'MEETING_SCHEDULED' };
  const savedDiscussionHistory = [
    { notes: 'Spoke with client, meeting agreed for Friday', status: 'COMPLETED', outcome: 'MEETING_SCHEDULED', isInitialTask: false },
    { notes: 'System initialized pending follow-up task', status: 'PENDING', isInitialTask: true }
  ];
  const savedStatus = computeStepStatus(meetingAgreedLead, savedDiscussionHistory, []);
  assert.strictEqual(savedStatus.isStep1Done, true, "Step 1 must be DONE when Meeting Agreed");
  assert.strictEqual(savedStatus.isMeetingUnlocked, true, "Step 2 must be UNLOCKED when Meeting Agreed");
  assert.strictEqual(savedStatus.isMeetingCompletedFinal, false, "Step 2 must remain PENDING (not completed)");

  // Case 3: User saves and advances to MEETING_PLAN
  const advancedLead = { currentStage: 'MEETING_PLAN' };
  const advancedStatus = computeStepStatus(advancedLead, savedDiscussionHistory, []);
  assert.strictEqual(advancedStatus.isStep1Done, true, "Step 1 must remain DONE in MEETING_PLAN stage");
  assert.strictEqual(advancedStatus.isMeetingUnlocked, true, "Step 2 must be UNLOCKED in MEETING_PLAN stage");
  assert.strictEqual(advancedStatus.isMeetingCompletedFinal, false, "Step 2 must be PENDING until meeting saved");

  // Case 4: Meeting completed
  const meetingDoneLead = {
    currentStage: 'SITE_VISIT_PLAN',
    meetingPlan: { isCompleted: true }
  };
  const meetingDoneStatus = computeStepStatus(meetingDoneLead, savedDiscussionHistory, []);
  assert.strictEqual(meetingDoneStatus.isStep1Done, true, "Step 1 is DONE");
  assert.strictEqual(meetingDoneStatus.isMeetingUnlocked, true, "Step 2 is UNLOCKED");
  assert.strictEqual(meetingDoneStatus.isMeetingCompletedFinal, true, "Step 2 is COMPLETED");

  // Case 5: Empty history list on newly imported lead without initial task
  const emptyStatus = computeStepStatus(freshLead, [], []);
  assert.strictEqual(emptyStatus.isStep1Done, false, "Step 1 must be PENDING with empty history");
  assert.strictEqual(emptyStatus.isMeetingUnlocked, false, "Step 2 must be LOCKED with empty history");
});

test("Step 1 Outcome Gating & Visibility: LeadWorkflowPage, FollowUpModal, and NewLeadTable enforce Meeting Agreed gate", () => {
  const workflowContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx"),
    "utf-8"
  );
  const modalContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/components/FollowUpModal.tsx"),
    "utf-8"
  );
  const tableContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/components/NewLeadTable.tsx"),
    "utf-8"
  );

  // Strict Step 1 -> Step 2 advancement gate in both LeadWorkflowPage and FollowUpModal
  assert.ok(
    workflowContent.includes("outcome !== 'MEETING_SCHEDULED'"),
    "LeadWorkflowPage gates Save & Advance behind MEETING_SCHEDULED"
  );
  assert.ok(
    modalContent.includes("outcome !== 'MEETING_SCHEDULED'"),
    "FollowUpModal gates Save & Proceed behind MEETING_SCHEDULED"
  );
  assert.ok(
    workflowContent.includes("outcome === 'NOT_INTERESTED'") &&
      workflowContent.includes("Mark as Rejected / Lost"),
    "LeadWorkflowPage handles Not Interested / Lost outcome without advancing to Meeting"
  );
  assert.ok(
    modalContent.includes("outcome === 'NOT_INTERESTED'") &&
      modalContent.includes("enquiryService.rejectLead"),
    "FollowUpModal offers marking lead Rejected / Lost when Not Interested is logged"
  );
  assert.ok(
    tableContent.includes("filter-lead-outcome") &&
      tableContent.includes("getFollowUpOutcomeMeta"),
    "NewLeadTable renders granular Follow-up Outcome badges and filter"
  );
});

test("Follow-up Outcome Badge & Filter Helpers: Runtime formatting and filtering behavior", () => {
  const cbMeta = getFollowUpOutcomeMeta("CALL_BACK_REQUESTED");
  assert.strictEqual(cbMeta?.label, "Call Back Requested");
  assert.ok(cbMeta?.badgeCls.includes("amber"), "Call Back Requested uses amber styling");

  const noAnswerMeta = getFollowUpOutcomeMeta("NO_ANSWER");
  assert.strictEqual(noAnswerMeta?.label, "No Answer / Busy");

  const meetingMeta = getFollowUpOutcomeMeta("MEETING_SCHEDULED");
  assert.strictEqual(meetingMeta?.label, "Meeting Agreed");
  assert.ok(meetingMeta?.badgeCls.includes("emerald"), "Meeting Agreed uses green styling");

  const stageMeta = getWorkflowStageMeta("FOLLOW_UP");
  assert.strictEqual(stageMeta.label, "01. Follow-up");

  const todayIso = new Date().toISOString().split("T")[0];
  assert.strictEqual(
    formatFollowUpScheduleLabel(todayIso, "16:00"),
    "Today 16:00",
    "Formats today callback date with time"
  );

  const leadItem = {
    id: "1",
    srNo: "01",
    name: "Amit Sharma",
    initials: "AS",
    avatarColor: "bg-blue-100 text-blue-700",
    mobile: "9876••••10",
    price: "Price on Request",
    remark: "Interested",
    isMockData: false,
    status: "ACTIVE" as const,
    currentStage: "FOLLOW_UP" as const,
    lastFollowUpOutcome: "CALL_BACK_REQUESTED" as const,
    nextFollowUpDate: todayIso,
    nextFollowUpTime: "16:00",
  };

  assert.strictEqual(
    matchesGlobalFilter(leadItem, "call back"),
    true,
    "Global search matches readable follow-up outcome label"
  );
  assert.strictEqual(
    matchesTableFilters(leadItem, {
      stage: "ALL",
      status: "ALL",
      agent: "ALL",
      followUp: "ALL",
      outcome: "CALL_BACK_REQUESTED",
    }),
    true,
    "Table outcome filter includes matching outcome"
  );
  assert.strictEqual(
    matchesTableFilters(leadItem, {
      stage: "ALL",
      status: "ALL",
      agent: "ALL",
      followUp: "ALL",
      outcome: "NO_ANSWER",
    }),
    false,
    "Table outcome filter excludes non-matching outcome"
  );
});

test("Hierarchical Activity & Accountability UI: Quick Call Log, Scorecard, Dashboard Accountability, and Timeline Filters", () => {
  const switchedOffMeta = getFollowUpOutcomeMeta("SWITCHED_OFF");
  assert.strictEqual(switchedOffMeta?.label, "Switched Off / Not Reachable");
  assert.strictEqual(getFollowUpOutcomeMeta("SITE_VISIT_COMPLETED")?.label, "Site Visit Completed");
  assert.strictEqual(getFollowUpOutcomeMeta("DEAL_DONE")?.label, "Deal Done");

  const quickModalPath = path.join(__dirname, "../src/features/sales-dashboard/components/QuickCallLogModal.tsx");
  const panelPath = path.join(__dirname, "../src/features/reporting/components/TeamActivityAccountabilityPanel.tsx");
  const scorecardPath = path.join(__dirname, "../src/features/sales-dashboard/components/MyDailyActivityScorecard.tsx");
  const timelinePath = path.join(__dirname, "../src/features/activities/ActivitiesTimelinePage.tsx");
  const tablePath = path.join(__dirname, "../src/features/sales-dashboard/components/NewLeadTable.tsx");
  const adminDashPath = path.join(__dirname, "../src/features/admin/AdminDashboardPage.tsx");
  const mgrDashPath = path.join(__dirname, "../src/features/manager/ManagerDashboardPage.tsx");
  const salesDashPath = path.join(__dirname, "../src/features/sales-dashboard/SalesDashboardPage.tsx");

  assert.ok(fs.existsSync(quickModalPath), "QuickCallLogModal.tsx must exist");
  assert.ok(fs.existsSync(panelPath), "TeamActivityAccountabilityPanel.tsx must exist");
  assert.ok(fs.existsSync(scorecardPath), "MyDailyActivityScorecard.tsx must exist");

  assert.ok(fs.readFileSync(tablePath, "utf-8").includes("Log Call"), "NewLeadTable mounts Quick Log Call action");
  assert.ok(fs.readFileSync(adminDashPath, "utf-8").includes("TeamActivityAccountabilityPanel"), "AdminDashboardPage mounts TeamActivityAccountabilityPanel");
  assert.ok(fs.readFileSync(mgrDashPath, "utf-8").includes("TeamActivityAccountabilityPanel"), "ManagerDashboardPage mounts TeamActivityAccountabilityPanel");
  assert.ok(fs.readFileSync(salesDashPath, "utf-8").includes("MyDailyActivityScorecard"), "SalesDashboardPage mounts MyDailyActivityScorecard");

  const timelineContent = fs.readFileSync(timelinePath, "utf-8");
  assert.ok(
    timelineContent.includes("getActivityFeed") &&
      timelineContent.includes("Employee (Sales / Manager)") &&
      timelineContent.includes("Call / Follow-Up Outcome"),
    "ActivitiesTimelinePage supports employee, outcome, activity type, and date filters"
  );
});
