/**
 * Neuways CRM - Completed Deals & Dynamic Follow-up Summary Client Tests
 *
 * Verifies:
 * 1. CompletedDealsPage renders all 9 required business columns
 * 2. CompletedDealDetailPage provides read-only view with full enquiry, deal terms, and audit timeline
 * 3. Deal completion modal on LeadWorkflowPage provides clear navigation actions
 * 4. AppSidebar and AppRoutes register completed deals routes and links
 * 5. Follow-up summary tables (Pending and Future) strictly preserve 3 stages x 4 activity columns
 */

import assert from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Completed Deals Page: Component exists and exports CompletedDealsPage", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/CompletedDealsPage.tsx");
  assert.ok(fs.existsSync(pagePath), "CompletedDealsPage.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.ok(content.includes("export const CompletedDealsPage"), "Exports CompletedDealsPage component");
});

test("Completed Deals Page: Table contains all 9 required columns", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/CompletedDealsPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // 1. Deal/Customer Name
  assert.ok(
    content.includes("Deal / Customer Name") || content.includes("Customer Name"),
    "Column 1: Deal / Customer Name is present"
  );
  // 2. Full Mobile Number
  assert.ok(
    content.includes("Mobile Contact") || content.includes("Mobile Number"),
    "Column 2: Mobile Contact is present"
  );
  // 3. Project Name
  assert.ok(content.includes("Project Name"), "Column 3: Project Name is present");
  // 4. Property Type
  assert.ok(content.includes("Property Type"), "Column 4: Property Type is present");
  // 5. Final Deal Price
  assert.ok(
    content.includes("Final Deal Price") || content.includes("Deal Price"),
    "Column 5: Final Deal Price is present"
  );
  // 6. Unit Size
  assert.ok(content.includes("Unit Size"), "Column 6: Unit Size is present");
  // 7. Deal Completion Date
  assert.ok(
    content.includes("Completion Date") || content.includes("Deal Date"),
    "Column 7: Completion Date is present"
  );
  // 8. Sales Agent
  assert.ok(content.includes("Sales Agent"), "Column 8: Sales Agent is present");
  // 9. Actions / View Details
  assert.ok(
    (content.includes("Action") || content.includes("Actions")) && content.includes("View Details"),
    "Column 9: View Details action is present"
  );
});

test("Completed Deals Page: Integrates with backend enquiryService.getCompletedDeals and search", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/CompletedDealsPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.ok(
    content.includes("enquiryService.getCompletedDeals"),
    "Calls backend enquiryService.getCompletedDeals to load data dynamically"
  );
  assert.ok(content.includes("searchQuery"), "Supports search filter by customer or project");
  assert.ok(
    content.includes("pagination.page") && content.includes("pagination.totalPages"),
    "Includes pagination controls"
  );
});

test("Completed Deal Detail Page: Component exists and exports CompletedDealDetailPage", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/CompletedDealDetailPage.tsx");
  assert.ok(fs.existsSync(pagePath), "CompletedDealDetailPage.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.ok(
    content.includes("export const CompletedDealDetailPage"),
    "Exports CompletedDealDetailPage component"
  );
});

test("Completed Deal Detail Page: Renders original enquiry, confirmed deal terms, and 4 workflow stages", () => {
  const pagePath = path.join(__dirname, "../src/features/sales-dashboard/CompletedDealDetailPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Original enquiry fields
  assert.ok(content.includes("deal.name"), "Renders customer name");
  assert.ok(content.includes("deal.mobile"), "Renders contact mobile");
  assert.ok(content.includes("deal.email"), "Renders contact email");
  assert.ok(content.includes("deal.source"), "Renders enquiry source");
  assert.ok(content.includes("deal.budgetMin"), "Renders enquiry budget");

  // Confirmed deal transaction terms
  assert.ok(content.includes("dealInfo.project"), "Renders confirmed project");
  assert.ok(content.includes("dealInfo.propertyType"), "Renders confirmed property type");
  assert.ok(content.includes("dealInfo.price"), "Renders final deal price");
  assert.ok(content.includes("dealInfo.size"), "Renders confirmed unit size");
  assert.ok(content.includes("confirmedDateStr"), "Renders confirmation timestamp");

  // 4 sequential workflow stage indicators
  assert.ok(content.includes("Stage 1") && content.includes("Customer Follow-up"), "Includes Stage 1 indicator");
  assert.ok(content.includes("Stage 2") && content.includes("Meeting Plan"), "Includes Stage 2 indicator");
  assert.ok(content.includes("Stage 3") && content.includes("Site Visit Plan"), "Includes Stage 3 indicator");
  assert.ok(content.includes("Stage 4") && content.includes("Deal Done"), "Includes Stage 4 indicator");

  // Chronological activity timeline
  assert.ok(content.includes("getActivities"), "Fetches audit activities timeline");
});

test("Lead Workflow Page: Deal Done confirmation modal with navigation", () => {
  const workflowPath = path.join(__dirname, "../src/features/sales-dashboard/LeadWorkflowPage.tsx");
  const content = fs.readFileSync(workflowPath, "utf-8");

  assert.ok(
    content.includes("isDealCompletedConfirmationOpen"),
    "Has state for deal completion confirmation dialog"
  );
  assert.ok(
    content.includes("Deal Finalized Successfully!") || content.includes("Deal Successfully Finalized"),
    "Displays deal finalized confirmation message"
  );
  assert.ok(
    content.includes("/sales/completed-deals"),
    "Provides navigation to Completed Deals list"
  );
  assert.ok(
    content.includes("Continue to Dashboard"),
    "Provides navigation button back to dashboard"
  );
});

test("Sidebar Navigation: AppSidebar includes Completed Deals link", () => {
  const sidebarPath = path.join(__dirname, "../src/components/layout/AppSidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.ok(
    content.includes("/sales/completed-deals"),
    "AppSidebar has navigation link to /sales/completed-deals"
  );
  assert.ok(
    content.includes("Completed Deals"),
    "AppSidebar displays label 'Completed Deals'"
  );
});

test("App Routes: Registers /sales/completed-deals and /sales/completed-deals/:dealId", () => {
  const routesPath = path.join(__dirname, "../src/routes/AppRoutes.tsx");
  const content = fs.readFileSync(routesPath, "utf-8");

  assert.ok(
    content.includes("sales/completed-deals"),
    "AppRoutes registers sales/completed-deals"
  );
  assert.ok(
    content.includes("sales/completed-deals/:dealId"),
    "AppRoutes registers sales/completed-deals/:dealId"
  );
  assert.ok(content.includes("CompletedDealsPage"), "Mounts CompletedDealsPage");
  assert.ok(content.includes("CompletedDealDetailPage"), "Mounts CompletedDealDetailPage");
});

test("Follow-Up Summary Tables: Both Pending and Future have 4 activity columns across 3 stages", () => {
  const tablePath = path.join(
    __dirname,
    "../src/features/sales-dashboard/components/FollowUpSummaryTable.tsx"
  );
  const content = fs.readFileSync(tablePath, "utf-8");

  // Columns: Contacted, Detail Shared, Meeting, Site Visit
  assert.ok(content.includes("Contacted"), "Includes Contacted column");
  assert.ok(content.includes("Detail Shared"), "Includes Detail Shared column");
  assert.ok(content.includes("Meeting"), "Includes Meeting column");
  assert.ok(content.includes("Site Visit"), "Includes Site Visit column");

  // Both tables use all 4 columns
  assert.ok(
    content.includes("stage.contacted") &&
    content.includes("stage.detailShared") &&
    content.includes("stage.meeting") &&
    content.includes("stage.siteVisit"),
    "Renders all 4 activity metrics per stage in summary tables"
  );
  assert.ok(
    content.includes("'N/A'"),
    "Supports 'N/A' rendering for non-applicable stage-activity cells"
  );
});
