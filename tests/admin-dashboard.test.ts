/**
 * Neuways CRM - Admin Dashboard Client Test Suite
 *
 * Verifies:
 * 1. AdminDashboardPage component exports and displays all 8 required organization-wide metrics:
 *    - Active employee count
 *    - Manager count
 *    - Active Sales agent count
 *    - Active lead count
 *    - Leads grouped by workflow stage (01. Follow-up, 02. Meeting Plan, 03. Site Visit Plan, 04. Deal Done)
 *    - Pending follow-up count
 *    - Future follow-up count
 *    - Completed deal count
 * 2. EditEmployeeModal exists and provides editing of name, role, manager assignment, and temp password reset.
 * 3. AddEmployeeModal provides manager assignment dropdown for Sales agents.
 * 4. AppSidebar defines the 5 Admin-specific sidebar sections:
 *    - Overview (/admin/dashboard)
 *    - Employee Management (/admin/employees)
 *    - Leads / Enquiries (/leads)
 *    - Completed Deals (/sales/completed-deals)
 *    - Activities / Timeline (/activities)
 * 5. AppRoutes registers and protects all Admin routes.
 */

import assert from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Admin Dashboard Page: Component exists and exports AdminDashboardPage", () => {
  const pagePath = path.join(__dirname, "../src/features/admin/AdminDashboardPage.tsx");
  assert.ok(fs.existsSync(pagePath), "AdminDashboardPage.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.ok(content.includes("export const AdminDashboardPage"), "Exports AdminDashboardPage component");
});

test("Admin Dashboard Page: Displays all 8 required organization-wide metrics", () => {
  const pagePath = path.join(__dirname, "../src/features/admin/AdminDashboardPage.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // 1. Active employee count
  assert.ok(content.includes("Active Employees"), "Metric 1: Active Employees is present");
  assert.ok(content.includes("activeEmployeeCount"), "Calculates active employee count");

  // 2. Manager count
  assert.ok(content.includes("Managers"), "Metric 2: Managers is present");
  assert.ok(content.includes("managerCount"), "Calculates manager count");

  // 3. Active Sales agent count
  assert.ok(content.includes("Active Sales Agents"), "Metric 3: Active Sales Agents is present");
  assert.ok(content.includes("activeSalesCount"), "Calculates active sales agent count");

  // 4. Active lead count
  assert.ok(content.includes("Active Lead Pipeline"), "Metric 4: Active Lead Pipeline is present");
  assert.ok(content.includes("activeLeadCount"), "Calculates active lead count");

  // 5. Leads grouped by current workflow stage
  assert.ok(content.includes("Leads Grouped by Current Workflow Stage"), "Metric 5: Workflow stage grouping title is present");
  assert.ok(content.includes("01. Follow-up"), "Stage 1: 01. Follow-up is present");
  assert.ok(content.includes("02. Meeting Plan"), "Stage 2: 02. Meeting Plan is present");
  assert.ok(content.includes("03. Site Visit Plan"), "Stage 3: 03. Site Visit Plan is present");
  assert.ok(content.includes("04. Deal Done"), "Stage 4: 04. Deal Done is present");

  // 6. Pending follow-up count
  assert.ok(content.includes("Pending Follow-ups"), "Metric 6: Pending Follow-ups is present");
  assert.ok(content.includes("pendingFollowUpCount"), "Calculates pending follow-up count");

  // 7. Future follow-up count
  assert.ok(content.includes("Future Follow-ups"), "Metric 7: Future Follow-ups is present");
  assert.ok(content.includes("futureFollowUpCount"), "Calculates future follow-up count");

  // 8. Completed deal count
  assert.ok(content.includes("Completed Deals"), "Metric 8: Completed Deals is present");
  assert.ok(content.includes("completedDealCount"), "Calculates completed deal count");
});

test("Employee Management: EditEmployeeModal exists and supports editing details", () => {
  const editModalPath = path.join(__dirname, "../src/features/admin/components/EditEmployeeModal.tsx");
  assert.ok(fs.existsSync(editModalPath), "EditEmployeeModal.tsx must exist");

  const content = fs.readFileSync(editModalPath, "utf-8");
  assert.ok(content.includes("export const EditEmployeeModal"), "Exports EditEmployeeModal");
  assert.ok(content.includes("userService.updateEmployee"), "Calls userService.updateEmployee");
  assert.ok(content.includes("Assign to Manager"), "Supports assigning Sales agents to Managers");
  assert.ok(content.includes("Reset Password"), "Supports resetting temporary password");
});

test("Employee Management: AddEmployeeModal supports manager assignment for Sales agents", () => {
  const addModalPath = path.join(__dirname, "../src/features/admin/components/AddEmployeeModal.tsx");
  const content = fs.readFileSync(addModalPath, "utf-8");
  assert.ok(content.includes("Assign to Manager"), "AddEmployeeModal supports assigning to manager");
  assert.ok(content.includes("managerId"), "Passes managerId in creation payload");
});

test("Sidebar Navigation: AppSidebar defines the 5 Admin-specific sections", () => {
  const sidebarPath = path.join(__dirname, "../src/components/layout/AppSidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.ok(content.includes('name: "Overview"'), "Admin sidebar has Overview");
  assert.ok(content.includes('path: "/admin/dashboard"'), "Overview links to /admin/dashboard");
  assert.ok(content.includes('name: "Employee Management"'), "Admin sidebar has Employee Management");
  assert.ok(content.includes('path: "/admin/employees"'), "Employee Management links to /admin/employees");
  assert.ok(content.includes('currentUser.role === "ADMIN" ? adminNavItems : salesNavItems'), "Switches nav items dynamically for ADMIN");
});

test("AppRoutes: Registers and protects Admin dashboard and sub-routes", () => {
  const routesPath = path.join(__dirname, "../src/routes/AppRoutes.tsx");
  const content = fs.readFileSync(routesPath, "utf-8");

  assert.ok(content.includes('path="admin/dashboard"'), "Registers /admin/dashboard");
  assert.ok(content.includes('path="admin/overview"'), "Registers /admin/overview");
  assert.ok(content.includes('path="admin/employees"'), "Registers /admin/employees");
  assert.ok(content.includes('path="admin/leads"'), "Registers /admin/leads");
  assert.ok(content.includes('path="admin/completed-deals"'), "Registers /admin/completed-deals");
  assert.ok(content.includes('path="admin/activities"'), "Registers /admin/activities");
  assert.ok(content.includes('path="admin/employees/new"'), "Registers /admin/employees/new dedicated page");
  assert.ok(content.includes("allowedRoles={['ADMIN']}"), "Enforces allowedRoles={['ADMIN']}");
});

test("Dedicated Add Employee Page: AddEmployeePage component exists with all required fields and actions", () => {
  const pagePath = path.join(__dirname, "../src/features/admin/AddEmployeePage.tsx");
  assert.ok(fs.existsSync(pagePath), "AddEmployeePage.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.ok(content.includes("export const AddEmployeePage"), "Exports AddEmployeePage component");
  assert.ok(content.includes("Back to Employees"), "Has Back to Employees button");
  assert.ok(content.includes("Full Name"), "Has Full Name field");
  assert.ok(content.includes("Email Address"), "Has Email Address field");
  assert.ok(content.includes("Role Selection"), "Has Role Selection cards");
  assert.ok(content.includes("Assign to Manager"), "Has Manager assignment for Sales agents");
  assert.ok(content.includes("Initial Temporary Password"), "Has Temporary Password field");
  assert.ok(content.includes("Generate"), "Has Password Generator");
  assert.ok(content.includes("userService.createEmployee"), "Calls userService.createEmployee");
  assert.ok(content.includes("handleFinishAndReturn"), "Navigates back to /admin/employees on finish");
});

test("Employee Management Page: Navigates to /admin/employees/new dedicated page", () => {
  const empPagePath = path.join(__dirname, "../src/features/admin/EmployeeManagementPage.tsx");
  const content = fs.readFileSync(empPagePath, "utf-8");
  assert.ok(content.includes("navigate('/admin/employees/new')"), "Add button navigates to /admin/employees/new");
});

test("Clickable Dashboard KPI Cards & URL Query Filter Sync", () => {
  const metricCardPath = path.join(__dirname, "../src/components/ui/MetricCard.tsx");
  const metricCardContent = fs.readFileSync(metricCardPath, "utf-8");
  assert.ok(metricCardContent.includes("onClick?: () => void"), "MetricCard supports onClick");
  assert.ok(metricCardContent.includes("ArrowUpRight"), "MetricCard renders hover ArrowUpRight affordance");
  assert.ok(metricCardContent.includes("tabIndex={isInteractive ? 0 : undefined}"), "MetricCard supports keyboard focus");

  const routesContent = fs.readFileSync(path.join(__dirname, "../src/routes/AppRoutes.tsx"), "utf-8");
  assert.ok(routesContent.includes('path="completed-deals"'), "AppRoutes registers /completed-deals alias");
  assert.ok(routesContent.includes('path="completed-deals/:dealId"'), "AppRoutes registers /completed-deals/:dealId alias");

  const adminContent = fs.readFileSync(path.join(__dirname, "../src/features/admin/AdminDashboardPage.tsx"), "utf-8");
  for (const route of [
    "/admin/employees?status=active",
    "/admin/employees?role=MANAGER",
    "/admin/employees?role=SALES&status=active",
    "/admin/employees",
    "/leads?tab=active",
    "/follow-ups/pending",
    "/follow-ups/future",
    "/completed-deals",
    "/admin/leads?tab=rejected",
    "/leads?tab=active&stage=FOLLOW_UP",
    "/leads?tab=active&stage=MEETING_PLAN",
    "/leads?tab=active&stage=SITE_VISIT_PLAN",
  ]) {
    assert.ok(adminContent.includes(route), `AdminDashboardPage wires card route: ${route}`);
  }

  const managerContent = fs.readFileSync(path.join(__dirname, "../src/features/manager/ManagerDashboardPage.tsx"), "utf-8");
  for (const route of [
    "/manager/team",
    "/leads?tab=active",
    "/leads?tab=unassigned",
    "/follow-ups/pending",
    "/follow-ups/future",
    "/completed-deals",
    "/leads?tab=rejected",
    "/leads?tab=active&stage=FOLLOW_UP",
    "/leads?tab=active&stage=MEETING_PLAN",
    "/leads?tab=active&stage=SITE_VISIT_PLAN",
  ]) {
    assert.ok(managerContent.includes(route), `ManagerDashboardPage wires card route: ${route}`);
  }

  const salesKpiContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/components/SalesKpiCards.tsx"),
    "utf-8"
  );
  assert.ok(salesKpiContent.includes("/leads?tab=active"), "SalesKpiCards wires leads route");
  assert.ok(salesKpiContent.includes("/follow-ups/pending"), "SalesKpiCards wires pending follow-ups route");
  assert.ok(salesKpiContent.includes("/follow-ups/future"), "SalesKpiCards wires future follow-ups route");

  const salesPageContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/SalesDashboardPage.tsx"),
    "utf-8"
  );
  assert.ok(salesPageContent.includes("Meetings / Site Visits"), "SalesDashboardPage renders Meetings / Site Visits card");
  assert.ok(salesPageContent.includes("/leads?tab=active&stage=MEETING_PLAN"), "SalesDashboardPage wires stage route");
  assert.ok(salesPageContent.includes("/completed-deals"), "SalesDashboardPage wires completed deals route");
  assert.ok(salesPageContent.includes("/leads?tab=rejected"), "SalesDashboardPage wires rejected leads route");

  const scorecardContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/components/MyDailyActivityScorecard.tsx"),
    "utf-8"
  );
  for (const route of [
    "/activities?period=today",
    "/activities?period=today&outcome=CONNECTED",
    "/activities?period=today&outcome=CALL_BACK_REQUESTED",
    "/leads?tab=active&stage=MEETING_PLAN",
    "/completed-deals",
    "/follow-ups/pending",
  ]) {
    assert.ok(scorecardContent.includes(route), `MyDailyActivityScorecard wires tile route: ${route}`);
  }

  const empContent = fs.readFileSync(path.join(__dirname, "../src/features/admin/EmployeeManagementPage.tsx"), "utf-8");
  assert.ok(empContent.includes("useSearchParams"), "EmployeeManagementPage uses useSearchParams");
  assert.ok(empContent.includes("searchParams.get('role')"), "EmployeeManagementPage reads ?role=");
  assert.ok(empContent.includes("searchParams.get('status')"), "EmployeeManagementPage reads ?status=");

  const leadsContent = fs.readFileSync(path.join(__dirname, "../src/features/leads/LeadsPage.tsx"), "utf-8");
  assert.ok(leadsContent.includes("searchParams.get('stage')"), "LeadsPage reads ?stage=");
  assert.ok(leadsContent.includes("initialStageFilter={stageFilter}"), "LeadsPage passes initialStageFilter to NewLeadTable");

  const leadTableContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/components/NewLeadTable.tsx"),
    "utf-8"
  );
  assert.ok(leadTableContent.includes("initialStageFilter?: string"), "NewLeadTable accepts initialStageFilter");
});
