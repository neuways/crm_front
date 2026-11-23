/**
 * Neuways CRM - Operational Sales Workflow Diagram Specification Tests
 *
 * Verifies that the workflow diagram component properly displays all 4 pipeline stages:
 * 1. Follow-up (with all 6 required items: Contact Method, Enquiry Detail Update, Remark, Next Follow-up Date & Time, Follow-up Outcome, Follow-up History)
 * 2. Meeting Plan
 * 3. Site Visit Plan
 * 4. Deal Done
 */

import assert from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Workflow Diagram: File existence and correct component export", () => {
  const filePath = path.join(__dirname, "../src/features/sales-dashboard/components/WorkflowDiagram.tsx");
  assert.ok(fs.existsSync(filePath), "WorkflowDiagram.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("export const WorkflowDiagram"), "Exports WorkflowDiagram component");
});

test("Workflow Diagram: 4-stage pipeline sequence preserved", () => {
  const filePath = path.join(__dirname, "../src/features/sales-dashboard/components/WorkflowDiagram.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Verify all 4 stages are present in sequence
  assert.ok(content.includes("Follow-up"), "Step 01 Follow-up must be present");
  assert.ok(content.includes("Meeting Plan"), "Step 02 Meeting Plan must be present");
  assert.ok(content.includes("Site Visit Plan"), "Step 03 Site Visit Plan must be present");
  assert.ok(content.includes("Deal Done"), "Step 04 Deal Done must be present");

  const followUpIndex = content.indexOf("Follow-up");
  const meetingIndex = content.indexOf("Meeting Plan");
  const siteVisitIndex = content.indexOf("Site Visit Plan");
  const dealDoneIndex = content.indexOf("Deal Done");

  assert.ok(followUpIndex < meetingIndex, "Follow-up precedes Meeting Plan");
  assert.ok(meetingIndex < siteVisitIndex, "Meeting Plan precedes Site Visit Plan");
  assert.ok(siteVisitIndex < dealDoneIndex, "Site Visit Plan precedes Deal Done");
});

test("Workflow Diagram Step 1: All 6 required Follow-up details are explicitly displayed", () => {
  const filePath = path.join(__dirname, "../src/features/sales-dashboard/components/WorkflowDiagram.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // 1. Contact Method: WhatsApp, Call, Email
  assert.ok(content.includes("Contact Method"), "Requirement 1: Contact Method header must be displayed");
  assert.ok(content.includes("WhatsApp"), "Requirement 1: WhatsApp option must be displayed");
  assert.ok(content.includes("Call"), "Requirement 1: Call option must be displayed");
  assert.ok(content.includes("Email"), "Requirement 1: Email option must be displayed");

  // 2. Enquiry Detail Update
  assert.ok(
    content.includes("Enquiry Detail Update"),
    "Requirement 2: Enquiry Detail Update header must be displayed"
  );
  assert.ok(
    content.includes("customer enquiry") || content.includes("requirement details"),
    "Requirement 2: Description for enquiry/requirement updates must be present"
  );

  // 3. Remark
  assert.ok(content.includes("Remark"), "Requirement 3: Remark header must be displayed");
  assert.ok(
    content.includes("Record the conversation") || content.includes("customer response"),
    "Requirement 3: Description for remarks/conversation logging must be present"
  );

  // 4. Next Follow-up Date & Time
  assert.ok(
    content.includes("Next Follow-up Date & Time"),
    "Requirement 4: Next Follow-up Date & Time header must be displayed"
  );
  assert.ok(
    content.includes("scheduled"),
    "Requirement 4: Explanation of scheduled callback timing must be present"
  );

  // 5. Follow-up Outcome
  assert.ok(
    content.includes("Follow-up Outcome"),
    "Requirement 5: Follow-up Outcome header must be displayed"
  );
  assert.ok(content.includes("Connected"), "Requirement 5: Connected outcome must be displayed");
  assert.ok(content.includes("Call Back Requested"), "Requirement 5: Call Back Requested outcome must be displayed");
  assert.ok(content.includes("No Answer"), "Requirement 5: No Answer outcome must be displayed");

  // 6. Follow-up History
  assert.ok(
    content.includes("Follow-up History"),
    "Requirement 6: Follow-up History header must be displayed"
  );
  assert.ok(
    content.includes("separate") || content.includes("immutable"),
    "Requirement 6: History persistence explanation must be present"
  );
  assert.ok(
    content.includes("preserved"),
    "Requirement 6: Preservation of previous remarks and activities must be explicit"
  );
});

test("Sales Dashboard: Workflow diagram is removed from dashboard view per strict requirement", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/SalesDashboardPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Invariant: Do not display workflow diagram as large cards on the dashboard
  assert.ok(!content.includes("<WorkflowDiagram"), "SalesDashboardPage must NOT mount <WorkflowDiagram />");
  assert.ok(content.includes("FollowUpModal"), "SalesDashboardPage mounts FollowUpModal for selected lead workflow");
});

test("Sequential Lead Workflow Modal: FollowUpModal implements 4-step pipeline with progression guards", () => {
  const modalPath = path.join(__dirname, "../src/features/sales-dashboard/components/FollowUpModal.tsx");
  assert.ok(fs.existsSync(modalPath), "FollowUpModal.tsx must exist");

  const content = fs.readFileSync(modalPath, "utf-8");

  // Step 1: Follow-up / Discussion
  assert.ok(content.includes("Follow-up / Customer Discussion") || content.includes("FOLLOW_UP"), "Step 1 Follow-up must be present");
  assert.ok(content.includes("purpose") && (content.includes("CALL") || content.includes("WHATSAPP")), "Step 1: Contact method selection");
  assert.ok(content.includes("outcome"), "Step 1: Outcome selection");
  assert.ok(content.includes("notes") || content.includes("remarks"), "Step 1: Remarks field");

  // Step 2: Meeting Plan
  assert.ok(content.includes("Meeting Plan") || content.includes("MEETING_PLAN"), "Step 2 Meeting Plan must be present");
  assert.ok(content.includes("meetingPlace"), "Step 2: Meeting place field");
  assert.ok(content.includes("isMeetingCompleted") || content.includes("isCompleted"), "Step 2: Completion guard");

  // Step 3: Site Visit Plan
  assert.ok(content.includes("Site Visit Plan") || content.includes("SITE_VISIT_PLAN"), "Step 3 Site Visit Plan must be present");
  assert.ok(content.includes("siteVisitAddress") || content.includes("siteAddress"), "Step 3: Site address field");

  // Step 4: Deal Done
  assert.ok(content.includes("Deal Done") || content.includes("DEAL_DONE"), "Step 4 Deal Done must be present");
  assert.ok(content.includes("dealPrice"), "Step 4: Deal price");
  assert.ok(content.includes("isDealConfirmed") || content.includes("dealConfirmed"), "Step 4: Agent confirmation checkbox");
});

test("Sales Dashboard: Table renders Current Stage column and contextual Action Buttons", () => {
  const tablePath = path.join(__dirname, "../src/features/sales-dashboard/components/NewLeadTable.tsx");
  assert.ok(fs.existsSync(tablePath), "NewLeadTable.tsx must exist");

  const content = fs.readFileSync(tablePath, "utf-8");
  assert.ok(content.includes("Current Stage"), "Table header includes Current Stage");
  assert.ok(content.includes("Next Follow-up"), "Table header includes Next Follow-up");
  assert.ok(content.includes("onFollowUpClick"), "Table triggers workflow action on button click");
});
