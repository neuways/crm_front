import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Lead Rejection UI: RejectedLeadTable component exists and exports properly", () => {
  const tablePath = path.join(__dirname, "../src/features/leads/components/RejectedLeadTable.tsx");
  assert.ok(fs.existsSync(tablePath), "RejectedLeadTable.tsx must exist");

  const content = fs.readFileSync(tablePath, "utf-8");
  assert.ok(content.includes("export const RejectedLeadTable"), "Exports RejectedLeadTable component");
});

test("Lead Rejection UI: RejectedLeadTable displays all 7 required columns and actions", () => {
  const tablePath = path.join(__dirname, "../src/features/leads/components/RejectedLeadTable.tsx");
  const content = fs.readFileSync(tablePath, "utf-8");

  // 1. Customer / Lead Name
  assert.ok(content.includes("Customer / Lead Name"), "Column 1: Customer / Lead Name is present");

  // 2. Assigned Sales Agent
  assert.ok(content.includes("Assigned Sales Agent"), "Column 2: Assigned Sales Agent is present");

  // 3. Previous Workflow Stage
  assert.ok(content.includes("Previous Stage"), "Column 3: Previous Stage is present");

  // 4. Rejection Reason
  assert.ok(content.includes("Rejection Reason"), "Column 4: Rejection Reason is present");

  // 5. Remarks
  assert.ok(content.includes("Remarks"), "Column 5: Remarks is present");

  // 6. Rejection Date & Time
  assert.ok(content.includes("Rejection Date"), "Column 6: Rejection Date is present");

  // 7. Action with View Details
  assert.ok(content.includes("Action"), "Column 7: Action is present");
  assert.ok(content.includes("View Details"), "Action button label is View Details");
  assert.ok(content.includes("onViewDetails"), "Calls onViewDetails callback on click");
});

test("Lead Rejection UI: LeadsPage integrates Active and Rejected tabs and URL params", () => {
  const pagePath = path.join(__dirname, "../src/features/leads/LeadsPage.tsx");
  assert.ok(fs.existsSync(pagePath), "LeadsPage.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.ok(content.includes("Active Pipeline"), "Active Pipeline tab is present");
  assert.ok(content.includes("Rejected / Lost Leads"), "Rejected / Lost Leads tab is present");
  assert.ok(content.includes("RejectedLeadTable"), "Mounts RejectedLeadTable component");
  assert.ok(content.includes("useSearchParams"), "Uses useSearchParams for tab query param");
  assert.ok(content.includes("rejected: true"), "Queries backend for rejected leads");
});

test("Lead Rejection UI: LeadWorkflowPage implements Mark Rejected / Lost action, modal, and guards", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Mark Rejected / Lost Button
  assert.ok(content.includes("Mark Rejected / Lost"), "Action button to trigger rejection is present");

  // Rejection Dialog Modal
  assert.ok(content.includes("isRejectDialogOpen"), "Modal dialog state is managed");
  assert.ok(content.includes("PREDEFINED_REJECTION_REASONS"), "Loads predefined rejection reasons");
  assert.ok(content.includes("Mandatory Rejection Reason"), "Displays mandatory reason selector");

  // Remarks requirement for 'Other'
  assert.ok(content.includes("Mandatory for 'Other'") || content.includes("Mandatory for &apos;Other&apos;"), "Enforces mandatory remarks when Other is chosen");

  // Confirmation before submission
  assert.ok(content.includes("isRejectionConfirmed"), "Requires explicit user confirmation checkbox");
  assert.ok(content.includes("Confirm Rejection"), "Confirm Rejection action button is present");

  // Calls rejectLead service
  assert.ok(content.includes("enquiryService.rejectLead"), "Calls enquiryService.rejectLead on submit");

  // Banner for rejected lead
  assert.ok(content.includes("Lead Marked as Rejected / Lost"), "Displays persistent alert banner when lead is rejected");
  assert.ok(content.includes("lead.rejection?.reason"), "Displays saved rejection reason");
  assert.ok(content.includes("lead.rejection?.previousStage"), "Displays saved previous workflow stage");

  // Progression guard
  assert.ok(content.includes("Cannot update workflow or finalize Deal Done on a closed or rejected lead"), "Disables workflow update for rejected leads");
});

test("Lead Rejection UI: AdminDashboardPage displays Rejected / Lost metric card", () => {
  const adminPagePath = path.join(__dirname, "../src/features/admin/AdminDashboardPage.tsx");
  const content = fs.readFileSync(adminPagePath, "utf-8");

  assert.ok(content.includes("Rejected / Lost"), "Rejected / Lost metric card title is present");
  assert.ok(content.includes("rejectedLeadCount"), "Computes rejectedLeadCount from summary");
  assert.ok(content.includes("/admin/leads?tab=rejected"), "Navigates to rejected tab on click");
});

test("Lead Rejection UI: enquiryService defines rejectLead API and rejected query param", () => {
  const servicePath = path.join(__dirname, "../src/services/enquiry.service.ts");
  const content = fs.readFileSync(servicePath, "utf-8");

  assert.ok(content.includes("rejectLead("), "enquiryService defines rejectLead method");
  assert.ok(content.includes("/reject"), "Calls /reject endpoint");
  assert.ok(content.includes("rejected?: boolean"), "getEnquiries accepts rejected query param");
});

test("Lead Rejection UI: LeadsPage persists Rejected / Lost tab count on initial load and refresh", () => {
  const pagePath = path.join(__dirname, "../src/features/leads/LeadsPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // 1. Dedicated rejectedTotalCount state
  assert.ok(
    content.includes("rejectedTotalCount, setRejectedTotalCount"),
    "LeadsPage manages rejectedTotalCount state"
  );

  // 2. Initial data-loading effect calls fetchRejectedLeads on mount (independent of activeTab)
  const mountEffectSection = content.substring(
    content.indexOf("// Load tab-specific or badge summary data on mount"),
    content.indexOf("// Synchronize on reconnection")
  );
  assert.ok(
    mountEffectSection.includes("fetchRejectedLeads()"),
    "Mount useEffect immediately calls fetchRejectedLeads() on page load"
  );
  assert.ok(
    mountEffectSection.includes("fetchDuplicateSummary()"),
    "Mount useEffect calls fetchDuplicateSummary()"
  );

  // 3. fetchRejectedLeads updates both rejectedLeads and rejectedTotalCount from backend pagination.total
  const fetchFnSection = content.substring(
    content.indexOf("const fetchRejectedLeads = useCallback"),
    content.indexOf("const fetchUnassignedLeads = useCallback")
  );
  assert.ok(
    fetchFnSection.includes("setRejectedTotalCount(total)"),
    "fetchRejectedLeads sets rejectedTotalCount from pagination metadata"
  );
  assert.ok(
    fetchFnSection.includes("setRejectedLeads(res.data.enquiries || [])"),
    "fetchRejectedLeads populates rejectedLeads list"
  );
  assert.ok(
    fetchFnSection.includes("res.data.pagination?.total"),
    "Extracts total persisted count from backend response pagination"
  );

  // 4. Tab badge displays rejectedTotalCount, never resetting to zero on refresh
  const tabBadgeSection = content.substring(
    content.indexOf("{/* 4. Rejected / Lost Leads Tab (All Roles) */}"),
    content.indexOf("{/* Main Tab Views */}")
  );
  assert.ok(
    tabBadgeSection.includes("{rejectedTotalCount}"),
    "Rejected tab button badge displays {rejectedTotalCount}"
  );
  assert.ok(
    !tabBadgeSection.includes("{rejectedLeads.length}"),
    "Tab badge does not rely solely on in-memory rejectedLeads.length"
  );

  // 5. Global handleRefreshAll refreshes fetchRejectedLeads
  const refreshAllSection = content.substring(
    content.indexOf("const handleRefreshAll = () => {"),
    content.indexOf("const isGlobalLoading =")
  );
  assert.ok(
    refreshAllSection.includes("fetchRejectedLeads()"),
    "handleRefreshAll re-fetches rejected leads and count"
  );

  // 6. RejectedLeadTable receives totalCount
  assert.ok(
    content.includes("totalCount={rejectedTotalCount}"),
    "Passes totalCount={rejectedTotalCount} to RejectedLeadTable component"
  );
});

test("Lead Rejection UI: RejectedLeadTable supports totalCount in StatusBadge", () => {
  const tablePath = path.join(__dirname, "../src/features/leads/components/RejectedLeadTable.tsx");
  const content = fs.readFileSync(tablePath, "utf-8");

  assert.ok(
    content.includes("totalCount?: number"),
    "RejectedLeadTableProps defines optional totalCount"
  );
  assert.ok(
    content.includes("totalCount !== undefined ? totalCount : leads.length"),
    "StatusBadge displays totalCount when provided, falling back to leads.length"
  );
});
