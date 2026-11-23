import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.resolve(__dirname, '../src');

test('TASK 1: Unassigned Leads Tab in LeadsPage', () => {
  const filePath = path.join(CLIENT_SRC, 'features/leads/LeadsPage.tsx');
  assert.ok(fs.existsSync(filePath), 'LeadsPage.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('canAccessUnassigned'), 'Guards unassigned tab with canAccessUnassigned');
  assert.ok(content.includes("currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'"), 'Restricts unassigned leads to Admin and Manager only');
  assert.ok(content.includes('Unassigned Leads'), 'Renders Unassigned Leads tab label');
  assert.ok(content.includes('UnassignedLeadTable'), 'Renders UnassignedLeadTable component');
  assert.ok(content.includes('AssignLeadModal'), 'Integrates AssignLeadModal');
  assert.ok(content.includes('unassignedTotalCount'), 'Renders unassigned count badge');
});

test('TASK 1 & 2: UnassignedLeadTable and AssignLeadModal Implementation', () => {
  const tablePath = path.join(CLIENT_SRC, 'features/leads/components/UnassignedLeadTable.tsx');
  const modalPath = path.join(CLIENT_SRC, 'features/leads/components/AssignLeadModal.tsx');
  assert.ok(fs.existsSync(tablePath), 'UnassignedLeadTable.tsx must exist');
  assert.ok(fs.existsSync(modalPath), 'AssignLeadModal.tsx must exist');

  const tableContent = fs.readFileSync(tablePath, 'utf-8');
  assert.ok(tableContent.includes('Property/project not selected'), 'Supports reason 1');
  assert.ok(tableContent.includes('Property mapping unavailable'), 'Supports reason 2');
  assert.ok(tableContent.includes('No eligible active Sales Agent'), 'Supports reason 3');
  assert.ok(tableContent.includes('Assignment failed'), 'Supports reason 4');
  assert.ok(tableContent.includes('Assignment pending manual review'), 'Supports reason 5');
  assert.ok(tableContent.includes('onAssignClick'), 'Supports single assign action');
  assert.ok(tableContent.includes('onBulkAssignClick'), 'Supports bulk assign action');
  assert.ok(tableContent.includes('selectedLeadIds'), 'Supports selection checkboxes');

  const modalContent = fs.readFileSync(modalPath, 'utf-8');
  assert.ok(modalContent.includes('bulkAssignLeads'), 'Calls bulkAssignLeads API');
  assert.ok(modalContent.includes('ROUND_ROBIN'), 'Supports Round Robin method');
  assert.ok(modalContent.includes('MANUAL'), 'Supports Manual agent designation');
  assert.ok(modalContent.includes("currentUser.role === 'MANAGER'"), 'Supports team filtering for Manager');
});

test('TASK 4: Duplicate Data Tab & DuplicateDataPage enhancements', () => {
  const filePath = path.join(CLIENT_SRC, 'features/duplicate-data/DuplicateDataPage.tsx');
  assert.ok(fs.existsSync(filePath), 'DuplicateDataPage.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('includeBulk: true'), 'Passes includeBulk: true to include bulk upload duplicates');
  assert.ok(content.includes('sourceFilter'), 'Implements Source filter');
  assert.ok(content.includes('isEmbedded'), 'Supports isEmbedded prop for embedding in LeadsPage');
  assert.ok(content.includes('Deal Done (Can Reopen)'), 'Renders Deal Done review badge');
  assert.ok(content.includes('Rejected (Can Reopen)'), 'Renders Rejected review badge');
  assert.ok(content.includes('Active in Pipeline'), 'Renders Active in Pipeline review badge');
  assert.ok(content.includes('Reopen'), 'Renders Reopen action button');
  assert.ok(content.includes('View Lead'), 'Renders View Lead action button');
});

test('TASK 5 & 6: Bulk Upload Step 5 Interactive Navigation and Invalid Records Management', () => {
  const filePath = path.join(CLIENT_SRC, 'features/bulk-upload/BulkUploadPage.tsx');
  assert.ok(fs.existsSync(filePath), 'BulkUploadPage.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes("navigate('/leads?tab=active')"), 'Interactive metric navigates to Active Pipeline');
  assert.ok(content.includes("navigate('/leads?tab=unassigned')"), 'Interactive metric navigates to Unassigned Queue');
  assert.ok(content.includes("navigate('/duplicate-data')"), 'Interactive metric navigates to Duplicate Data');
  assert.ok(content.includes('Invalid Records Management'), 'Dedicated tab/view for Invalid Records');
  assert.ok(content.includes('Action Required: Fix'), 'Resolution status badge on invalid records');
  assert.ok(content.includes("downloadReport(currentJob.importId, 'INVALID')"), 'Provides CSV download for invalid records');
});

test('TASK 8: User Management Permissions (ADMIN only)', () => {
  const appRoutesPath = path.join(CLIENT_SRC, 'routes/AppRoutes.tsx');
  const appSidebarPath = path.join(CLIENT_SRC, 'components/layout/AppSidebar.tsx');

  const routesContent = fs.readFileSync(appRoutesPath, 'utf-8');
  assert.ok(routesContent.includes("allowedRoles={['ADMIN']}"), 'Employee management routes protected strictly for ADMIN role');

  const sidebarContent = fs.readFileSync(appSidebarPath, 'utf-8');
  assert.ok(sidebarContent.includes('adminNavItems'), 'Defines Admin nav items');
  assert.ok(sidebarContent.includes('Employee Management'), 'Contains Employee Management in Admin nav');
  assert.ok(sidebarContent.includes('currentUser.role === "ADMIN" ? adminNavItems'), 'Employee Management sidebar link restricted to ADMIN only');
});
