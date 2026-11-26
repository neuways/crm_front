/**
 * Neuways CRM - Manager Dashboard & Team Management UI Tests
 *
 * Verifies:
 * 1. AppSidebar configures all 8 manager sections + notifications as implemented: true
 * 2. Role header displays 'Team Management' and 'Manager Navigation' for MANAGER
 * 3. AppRoutes routes MANAGER directly to /manager/dashboard from root
 * 4. AppRoutes registers protected /manager/* routes with allowedRoles={['MANAGER']}
 * 5. Manager pages exist, export components, and enforce read-only employee boundaries
 * 6. Enquiry service provides getTeamPerformance and assignLead methods
 */

import assert from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Manager Navigation: AppSidebar defines all 8 manager items + notifications as implemented", () => {
  const sidebarPath = path.join(__dirname, "../src/components/layout/AppSidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "AppSidebar.tsx must exist");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Verify managerNavItems contains all required sections
  const requiredItems = [
    { name: "Overview", path: "/manager/dashboard" },
    { name: "Sales Team", path: "/manager/team" },
    { name: "Leads / Enquiries", path: "/manager/leads" },
    { name: "Pending Follow-ups", path: "/manager/follow-ups/pending" },
    { name: "Future Follow-ups", path: "/manager/follow-ups/future" },
    { name: "Completed Deals", path: "/manager/completed-deals" },
    { name: "Rejected / Lost", path: "/manager/rejected-deals" },
    { name: "Activities / Timeline", path: "/manager/activities" },
    { name: "Notifications", path: "/notifications" },
  ];

  for (const item of requiredItems) {
    assert.ok(content.includes(`"${item.name}"`), `AppSidebar defines manager item: ${item.name}`);
    assert.ok(content.includes(`"${item.path}"`), `AppSidebar defines manager route: ${item.path}`);
  }

  // Verify manager role handling in AppSidebar
  assert.ok(
    content.includes("currentUser.role === \"MANAGER\"") ||
    content.includes("currentUser.role === 'MANAGER'"),
    "AppSidebar checks currentUser.role === 'MANAGER'"
  );
  assert.ok(
    content.includes("Team Management"),
    "AppSidebar displays 'Team Management' subtitle for Manager"
  );
  assert.ok(
    content.includes("Manager Navigation"),
    "AppSidebar displays 'Manager Navigation' header for Manager"
  );
});

test("Manager Routing: AppRoutes configures manager root destination and protected routes", () => {
  const routesPath = path.join(__dirname, "../src/routes/AppRoutes.tsx");
  assert.ok(fs.existsSync(routesPath), "AppRoutes.tsx must exist");
  const content = fs.readFileSync(routesPath, "utf-8");

  // Manager root redirect
  assert.ok(
    content.includes("user?.role === 'MANAGER'") && content.includes("return '/manager/dashboard'"),
    "Manager root destination redirects to /manager/dashboard"
  );

  // Protected manager routes
  const managerRoutes = [
    "manager/dashboard",
    "manager/overview",
    "manager/team",
    "manager/leads",
    "manager/leads/:leadId/workflow",
    "manager/follow-ups/pending",
    "manager/follow-ups/future",
    "manager/completed-deals",
    "manager/completed-deals/:dealId",
    "manager/rejected-deals",
    "manager/activities",
  ];

  for (const route of managerRoutes) {
    assert.ok(content.includes(`path="${route}"`), `AppRoutes registers route: ${route}`);
  }

  // Check role protection
  assert.ok(
    content.includes("allowedRoles={['MANAGER']}"),
    "Manager routes are protected with allowedRoles={['MANAGER']}"
  );
});

test("Manager Components: ManagerDashboardPage and ManagerTeamPage exist and export valid components", () => {
  const dashboardPath = path.join(__dirname, "../src/features/manager/ManagerDashboardPage.tsx");
  assert.ok(fs.existsSync(dashboardPath), "ManagerDashboardPage.tsx must exist");
  const dashboardContent = fs.readFileSync(dashboardPath, "utf-8");
  assert.ok(dashboardContent.includes("export const ManagerDashboardPage"), "ManagerDashboardPage is exported");

  // Verify Overview components: 6 metric cards, pipeline breakdown, summary tables
  assert.ok(dashboardContent.includes("Active Agents"), "Overview includes Active Agents metric card");
  assert.ok(dashboardContent.includes("Active Leads"), "Overview includes Active Leads metric card");
  assert.ok(dashboardContent.includes("Pending Tasks"), "Overview includes Pending Tasks metric card");
  assert.ok(dashboardContent.includes("Future Tasks"), "Overview includes Future Tasks metric card");
  assert.ok(dashboardContent.includes("Completed Deals"), "Overview includes Completed Deals metric card");
  assert.ok(dashboardContent.includes("Rejected / Lost"), "Overview includes Rejected / Lost metric card");
  assert.ok(dashboardContent.includes("4-Stage Pipeline Workload"), "Overview includes 4-stage sequential breakdown");
  assert.ok(dashboardContent.includes("PendingFollowUpTable"), "Overview includes PendingFollowUpTable");
  assert.ok(dashboardContent.includes("FutureFollowUpTable"), "Overview includes FutureFollowUpTable");

  const teamPath = path.join(__dirname, "../src/features/manager/ManagerTeamPage.tsx");
  assert.ok(fs.existsSync(teamPath), "ManagerTeamPage.tsx must exist");
  const teamContent = fs.readFileSync(teamPath, "utf-8");
  assert.ok(teamContent.includes("export const ManagerTeamPage"), "ManagerTeamPage is exported");

  // Verify Team management components
  assert.ok(teamContent.includes("Sales Agents Roster"), "Team page includes Sales Agents Roster");
  assert.ok(teamContent.includes("Stage Workload"), "Team table includes Stage Workload column");
  assert.ok(teamContent.includes("Reassign"), "Team page includes lead reassignment trigger");

  // Strict read-only enforcement: no add employee, edit employee, or deactivate employee
  assert.ok(!teamContent.includes("AddEmployeePage"), "Manager team page does not allow employee addition");
  assert.ok(!teamContent.includes("userService.createEmployee"), "Manager team page cannot create employees");
  assert.ok(!teamContent.includes("userService.deleteEmployee"), "Manager team page cannot delete employees");
  assert.ok(teamContent.includes("managed exclusively by System Administrators"), "Notice informs user of admin boundaries");
});

test("Reassignment Modal: ReassignLeadModal exists and calls assignLead", () => {
  const modalPath = path.join(__dirname, "../src/features/manager/components/ReassignLeadModal.tsx");
  assert.ok(fs.existsSync(modalPath), "ReassignLeadModal.tsx must exist");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  assert.ok(modalContent.includes("export const ReassignLeadModal"), "ReassignLeadModal is exported");
  assert.ok(modalContent.includes("enquiryService.assignLead"), "ReassignLeadModal invokes enquiryService.assignLead");
  assert.ok(modalContent.includes("Select New Assigned Sales Agent"), "ReassignLeadModal includes agent selector");
});

test("Enquiry Service: getTeamPerformance and assignLead methods exist", () => {
  const servicePath = path.join(__dirname, "../src/services/enquiry.service.ts");
  assert.ok(fs.existsSync(servicePath), "enquiry.service.ts must exist");
  const serviceContent = fs.readFileSync(servicePath, "utf-8");

  assert.ok(serviceContent.includes("async getTeamPerformance()"), "enquiryService.getTeamPerformance exists");
  assert.ok(serviceContent.includes("/enquiries/team"), "getTeamPerformance queries /enquiries/team");
  assert.ok(serviceContent.includes("async assignLead("), "enquiryService.assignLead exists");
  assert.ok(serviceContent.includes("/assign"), "assignLead queries /enquiries/:id/assign");
  assert.ok(serviceContent.includes("async getTeamRoster()"), "enquiryService.getTeamRoster exists");
  assert.ok(serviceContent.includes("/enquiries/team/roster"), "getTeamRoster queries /enquiries/team/roster");
  assert.ok(serviceContent.includes("async assignAgentToTeam("), "enquiryService.assignAgentToTeam exists");
  assert.ok(serviceContent.includes("/enquiries/team/assign"), "assignAgentToTeam posts to /enquiries/team/assign");
  assert.ok(serviceContent.includes("async updateTeamMemberStatus("), "enquiryService.updateTeamMemberStatus exists");
  assert.ok(serviceContent.includes("/enquiries/team/members/"), "updateTeamMemberStatus patches membership status");
});

test("Team Membership & Assignment Modal: AssignAgentModal exists and provides membership controls", () => {
  const modalPath = path.join(__dirname, "../src/features/manager/components/AssignAgentModal.tsx");
  assert.ok(fs.existsSync(modalPath), "AssignAgentModal.tsx must exist");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  assert.ok(modalContent.includes("export const AssignAgentModal"), "AssignAgentModal is exported");
  assert.ok(modalContent.includes("enquiryService.getTeamRoster"), "AssignAgentModal calls getTeamRoster");
  assert.ok(modalContent.includes("enquiryService.assignAgentToTeam"), "AssignAgentModal calls assignAgentToTeam");
  assert.ok(modalContent.includes("enquiryService.updateTeamMemberStatus"), "AssignAgentModal calls updateTeamMemberStatus");
  assert.ok(modalContent.includes("Assign to My Team"), "AssignAgentModal provides Assign to My Team button");
  assert.ok(modalContent.includes("Deactivate"), "AssignAgentModal provides Deactivate membership button");
  assert.ok(modalContent.includes("Activate"), "AssignAgentModal provides Activate membership button");
  assert.ok(!modalContent.includes("Admin Transfer Required"), "AssignAgentModal eliminates confusing Admin Transfer Required label to prevent cross-team exposure");
});

test("Manager Team Page: Integrates AssignAgentModal and membership controls", () => {
  const teamPath = path.join(__dirname, "../src/features/manager/ManagerTeamPage.tsx");
  const teamContent = fs.readFileSync(teamPath, "utf-8");

  assert.ok(teamContent.includes("AssignAgentModal"), "ManagerTeamPage imports and renders AssignAgentModal");
  assert.ok(teamContent.includes("Assign Sales Agent"), "ManagerTeamPage has Assign Sales Agent button");
  assert.ok(teamContent.includes("Deactivate"), "ManagerTeamPage has Deactivate team membership action");
  assert.ok(teamContent.includes("handleDeactivateMembership"), "ManagerTeamPage defines handleDeactivateMembership");
});

test("Manager Lead Assignment Enhancements: ReassignLeadModal, AssignLeadsPage & Team Onboarding", () => {
  // 1. ReassignLeadModal excludes target agent leads, shows real owner, filters & multi-select
  const reassignPath = path.join(__dirname, "../src/features/manager/components/ReassignLeadModal.tsx");
  const reassignContent = fs.readFileSync(reassignPath, "utf-8");
  assert.ok(
    reassignContent.includes("if (isLeadHeldBySalesAgent(item, effectiveManagerId)) return false") &&
      (reassignContent.includes("getLeadAssigneeId(item) === selectedAgentId") ||
        reassignContent.includes("getLeadAssigneeId(item) !== selectedAgentId")),
    "ReassignLeadModal strictly excludes sales-agent-held leads and any lead assigned to selectedAgentId"
  );
  assert.ok(
    reassignContent.includes("SELECT LEAD TO REASSIGN (") && reassignContent.includes("AVAILABLE)"),
    "ReassignLeadModal displays dynamic available lead count"
  );
  assert.ok(
    !reassignContent.includes('"Current: Assigned to You"') &&
      !reassignContent.includes("'Current: Assigned to You'") &&
      reassignContent.includes("Assigned to You (Manager)"),
    "ReassignLeadModal shows explicit 'Assigned to You (Manager)' owner label for manager-held leads"
  );
  assert.ok(reassignContent.includes("My Assigned Leads"), "ReassignLeadModal includes My Assigned Leads filter pill");
  assert.ok(reassignContent.includes("Unassigned Only"), "ReassignLeadModal includes Unassigned Only filter pill");
  assert.ok(
    !reassignContent.includes("From Other Agents"),
    "ReassignLeadModal removes 'From Other Agents' filter so managers cannot reassign sales-held leads"
  );
  assert.ok(
    reassignContent.includes("isLeadHeldBySalesAgent") &&
      reassignContent.includes("assignedTo: effectiveManagerId || 'me'"),
    "ReassignLeadModal queries manager-held leads and strictly excludes leads already held by sales agents"
  );
  assert.ok(reassignContent.includes('type="checkbox"'), "ReassignLeadModal supports multi-select checkboxes");
  assert.ok(reassignContent.includes("bulkAssignLeads"), "ReassignLeadModal supports bulk assignment");

  // 2. Standalone Assign Leads nav item removed & consolidated into LeadsPage tabs
  const sidebarContent = fs.readFileSync(
    path.join(__dirname, "../src/components/layout/AppSidebar.tsx"),
    "utf-8"
  );
  assert.ok(!sidebarContent.includes('name: "Assign Leads"'), "AppSidebar removes standalone Assign Leads nav item");
  assert.ok(!sidebarContent.includes('path: "/manager/assign-leads"'), "AppSidebar removes /manager/assign-leads path");

  const routesContent = fs.readFileSync(
    path.join(__dirname, "../src/routes/AppRoutes.tsx"),
    "utf-8"
  );
  assert.ok(routesContent.includes('path="manager/assign-leads"'), "AppRoutes keeps manager/assign-leads fallback redirect");
  assert.ok(routesContent.includes('<Navigate to="/leads" replace />'), "AppRoutes redirects /manager/assign-leads to /leads");

  const leadsPagePath = path.join(__dirname, "../src/features/leads/LeadsPage.tsx");
  assert.ok(fs.existsSync(leadsPagePath), "LeadsPage.tsx exists");
  const leadsPageContent = fs.readFileSync(leadsPagePath, "utf-8");
  assert.ok(!leadsPageContent.includes("'/manager/assign-leads'"), "LeadsPage removes standalone Assign Leads header button");
  assert.ok(
    leadsPageContent.indexOf("<span>{canAccessUnassigned ? 'Assigned Leads' : 'Active Pipeline'}</span>") <
      leadsPageContent.indexOf("<span>Unassigned Leads</span>"),
    "LeadsPage renders Assigned Leads as the first tab before Unassigned Leads"
  );
  assert.ok(leadsPageContent.includes("assignedOnly: true"), "LeadsPage fetches assigned queue with assignedOnly: true");
  assert.ok(leadsPageContent.includes("unassigned: false"), "LeadsPage enforces unassigned: false on Assigned Leads");
  assert.ok(leadsPageContent.includes("unassigned: true"), "LeadsPage fetches unassigned queue with unassigned: true");
  assert.ok(leadsPageContent.includes("assignedOnly: false"), "LeadsPage enforces assignedOnly: false on Unassigned Leads");
  assert.ok(leadsPageContent.includes("hasValidAssignedUser"), "LeadsPage applies defensive assignedTo user guard on Assigned Leads");
  assert.ok(leadsPageContent.includes("fetchTabBadgeCounts"), "LeadsPage fetches independent limit=1 tab badge counts");
  assert.ok(leadsPageContent.includes("unassignedTotalCount") && leadsPageContent.includes("assignedTotalCount"), "LeadsPage tracks independent unassigned and assigned badge totals");
  assert.ok(leadsPageContent.includes("serverPagination"), "LeadsPage wires server pagination for Unassigned & Assigned queues");
  assert.ok(!leadsPageContent.includes("ReassignLeadModal"), "LeadsPage removes ReassignLeadModal from Assigned Leads tab");
  assert.ok(!leadsPageContent.includes("onBulkReassignClick"), "LeadsPage removes bulk reassign from Assigned Leads tab");
  assert.ok(leadsPageContent.includes("QuickCallLogModal") && leadsPageContent.includes("onFollowUpClick={handleOpenUnassignedFollowUp}"), "LeadsPage supports Log Call and Follow-up directly on Unassigned Leads");

  const newLeadTableContent = fs.readFileSync(
    path.join(__dirname, "../src/features/sales-dashboard/components/NewLeadTable.tsx"),
    "utf-8"
  );
  assert.ok(!newLeadTableContent.includes("onReassignClick") && !newLeadTableContent.includes("onBulkReassignClick"), "NewLeadTable removes Reassign action and bulk-reassign bar");
  assert.ok(newLeadTableContent.includes("Log Call") && newLeadTableContent.includes("Follow-up"), "NewLeadTable preserves Log Call and Follow-up actions");

  const unassignedTableContent = fs.readFileSync(
    path.join(__dirname, "../src/features/leads/components/UnassignedLeadTable.tsx"),
    "utf-8"
  );
  assert.ok(
    unassignedTableContent.includes("onLogCallClick") && unassignedTableContent.includes("Log Call") &&
    unassignedTableContent.includes("onFollowUpClick") && unassignedTableContent.includes("Follow-up") &&
    unassignedTableContent.includes("paginatedLeads.length > 0 && (totalCount > 0 || totalPages > 1)"),
    "UnassignedLeadTable displays Log Call and Follow-up actions alongside Assign and hides pagination on 0 rows"
  );

  // 3. AssignAgentModal & ManagerTeamPage support Assign Initial Leads Now during team onboarding
  const assignAgentContent = fs.readFileSync(
    path.join(__dirname, "../src/features/manager/components/AssignAgentModal.tsx"),
    "utf-8"
  );
  assert.ok(
    assignAgentContent.includes("Assign Initial Leads Now"),
    "AssignAgentModal includes optional Assign Initial Leads Now section"
  );
  assert.ok(
    assignAgentContent.includes("selectedLeadIds"),
    "AssignAgentModal supports multi-selecting initial leads"
  );
  assert.ok(
    assignAgentContent.includes("enquiryService.assignAgentToTeam"),
    "AssignAgentModal submits initial leads alongside assignAgentToTeam"
  );
});
