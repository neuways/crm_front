import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.join(__dirname, '../src');

test('Bulk Import Types: Definitions include BulkImportStatus, IImportRowError, ParseFileResult, and PreviewImportResult', () => {
  const filePath = path.join(CLIENT_SRC, 'types/bulk-import.types.ts');
  assert.ok(fs.existsSync(filePath), 'bulk-import.types.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('export type BulkImportStatus'), 'Defines BulkImportStatus type');
  assert.ok(content.includes("'PENDING_CONFIRMATION'"), 'Includes PENDING_CONFIRMATION');
  assert.ok(content.includes("'QUEUED'"), 'Includes QUEUED');
  assert.ok(content.includes("'PROCESSING'"), 'Includes PROCESSING');
  assert.ok(content.includes("'COMPLETED'"), 'Includes COMPLETED');
  assert.ok(content.includes("'FAILED'"), 'Includes FAILED');
  assert.ok(content.includes("'CANCELLED'"), 'Includes CANCELLED');
  assert.ok(content.includes('export interface IImportRowError'), 'Defines IImportRowError interface');
  assert.ok(content.includes('export interface ParseFileResult'), 'Defines ParseFileResult interface');
  assert.ok(content.includes('export interface PreviewImportResult'), 'Defines PreviewImportResult interface');
  assert.ok(content.includes('export interface BulkImportJobStatus'), 'Defines BulkImportJobStatus interface');
});

test('Bulk Import Client Service: Defines all required API integration methods', () => {
  const filePath = path.join(CLIENT_SRC, 'services/bulk-import.service.ts');
  assert.ok(fs.existsSync(filePath), 'bulk-import.service.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('uploadFile('), 'Defines uploadFile method');
  assert.ok(content.includes('previewImport('), 'Defines previewImport method');
  assert.ok(content.includes('confirmImport('), 'Defines confirmImport method');
  assert.ok(content.includes('getStatus('), 'Defines getStatus method');
  assert.ok(content.includes('cancelImport('), 'Defines cancelImport method');
  assert.ok(content.includes('listHistory('), 'Defines listHistory method');
  assert.ok(content.includes('downloadReport('), 'Defines downloadReport method');
  assert.ok(content.includes('downloadTemplate('), 'Defines downloadTemplate method');
  assert.ok(content.includes('/bulk-import/upload'), 'Routes to /bulk-import/upload');
  assert.ok(content.includes('/bulk-import/preview'), 'Routes to /bulk-import/preview');
  assert.ok(content.includes('/bulk-import/confirm'), 'Routes to /bulk-import/confirm');
});

test('AppSidebar: Renders Bulk Data Upload link for Admin, Manager, and Sales roles', () => {
  const filePath = path.join(CLIENT_SRC, 'components/layout/AppSidebar.tsx');
  assert.ok(fs.existsSync(filePath), 'AppSidebar.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('UploadCloud'), 'Imports UploadCloud icon from lucide-react');

  // Verify in salesNavItems
  const salesSection = content.split('const salesNavItems = [')[1]?.split('];')[0];
  assert.ok(salesSection?.includes('Bulk Data Upload'), 'Sales nav contains Bulk Data Upload');
  assert.ok(salesSection?.includes('/bulk-upload'), 'Sales nav links to /bulk-upload');

  // Verify in adminNavItems
  const adminSection = content.split('const adminNavItems = [')[1]?.split('];')[0];
  assert.ok(adminSection?.includes('Bulk Data Upload'), 'Admin nav contains Bulk Data Upload');
  assert.ok(adminSection?.includes('/bulk-upload'), 'Admin nav links to /bulk-upload');

  // Verify in managerNavItems
  const managerSection = content.split('const managerNavItems = [')[1]?.split('];')[0];
  assert.ok(managerSection?.includes('Bulk Data Upload'), 'Manager nav contains Bulk Data Upload');
  assert.ok(managerSection?.includes('/bulk-upload'), 'Manager nav links to /bulk-upload');
});

test('AppRoutes: Registers /bulk-upload route', () => {
  const filePath = path.join(CLIENT_SRC, 'routes/AppRoutes.tsx');
  assert.ok(fs.existsSync(filePath), 'AppRoutes.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('BulkUploadPage'), 'Imports BulkUploadPage component');
  assert.ok(content.includes('path="bulk-upload"'), 'Registers path="bulk-upload" route');
});

test('BulkUploadPage: Implements 5-step wizard, limits, duplicate exclusion, and report download', () => {
  const filePath = path.join(CLIENT_SRC, 'features/bulk-upload/BulkUploadPage.tsx');
  assert.ok(fs.existsSync(filePath), 'BulkUploadPage.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('export const BulkUploadPage'), 'Exports BulkUploadPage component');

  // Limits
  assert.ok(content.includes('500'), 'Enforces or informs 500 records limit');
  assert.ok(content.includes('5 MB'), 'Informs 5 MB size limit');

  // Duplicate exclusion & missing property policy
  assert.ok(content.includes('Duplicate Protection'), 'Mentions duplicate protection banner');
  assert.ok(content.includes('Unassigned Queue'), 'Handles routing missing properties to Unassigned Queue');

  // Role based assignment
  assert.ok(content.includes('Property-wise Round Robin'), 'Includes Property-wise Round Robin option for Admin');
  assert.ok(content.includes('Manual Assignment'), 'Includes Manual Assignment option');
  assert.ok(content.includes('Sales Agent Ownership'), 'Displays Sales Agent self-ownership banner');

  // Reports & View Sample Template
  assert.ok(content.includes('downloadReport'), 'Wires report download actions');
  assert.ok(content.includes('View Sample Template'), 'Renders View Sample Template button');
  assert.ok(content.includes('Sample Upload Template'), 'Renders Sample Upload Template modal');
  assert.ok(content.includes('Excel (.xlsx)'), 'Modal includes Excel (.xlsx) tab');
  assert.ok(content.includes('CSV (.csv)'), 'Modal includes CSV (.csv) tab');

  // Approved Stitch Five-Step Floating Cards Progress Stepper
  assert.ok(content.includes('ACTIVE STEP'), 'Renders ACTIVE STEP badge for current step');
  assert.ok(content.includes('PENDING'), 'Renders PENDING badge for upcoming steps');
  assert.ok(content.includes('STEP 0'), 'Renders STEP 0X badge for completed steps');
  assert.ok(content.includes('Select File'), 'Stepper includes Step 1: Select File');
  assert.ok(content.includes('Map Columns'), 'Stepper includes Step 2: Map Columns');
  assert.ok(content.includes('Preview & Rules'), 'Stepper includes Step 3: Preview & Rules');
  assert.ok(content.includes('Batch Import'), 'Stepper includes Step 4: Batch Import');
  assert.ok(content.includes('Summary Report'), 'Stepper includes Step 5: Summary Report');
  assert.ok(content.includes('ChevronRight'), 'Stepper uses subtle right chevron connectors');
});

test('Bulk Data Upload Navigation Buttons: Rendered beside New Lead Enquiry on all 4 dashboards and pages', () => {
  // 1. Admin Dashboard
  const adminPath = path.join(CLIENT_SRC, 'features/admin/AdminDashboardPage.tsx');
  const adminContent = fs.readFileSync(adminPath, 'utf-8');
  assert.ok(adminContent.includes('New Lead Enquiry'), 'Admin Dashboard contains New Lead Enquiry button');
  assert.ok(adminContent.includes('Bulk Data Upload'), 'Admin Dashboard contains Bulk Data Upload button');
  assert.ok(adminContent.includes('/bulk-upload'), 'Admin Dashboard button navigates to /bulk-upload');
  assert.ok(adminContent.includes('Excel / CSV'), 'Admin Dashboard button includes Excel / CSV label');
  assert.ok(adminContent.includes('FileSpreadsheet'), 'Admin Dashboard button uses FileSpreadsheet icon');

  // 2. Manager Dashboard
  const managerPath = path.join(CLIENT_SRC, 'features/manager/ManagerDashboardPage.tsx');
  const managerContent = fs.readFileSync(managerPath, 'utf-8');
  assert.ok(managerContent.includes('New Team Lead'), 'Manager Dashboard contains New Team Lead button');
  assert.ok(managerContent.includes('Bulk Data Upload'), 'Manager Dashboard contains Bulk Data Upload button');
  assert.ok(managerContent.includes('/bulk-upload'), 'Manager Dashboard button navigates to /bulk-upload');
  assert.ok(managerContent.includes('Excel / CSV'), 'Manager Dashboard button includes Excel / CSV label');
  assert.ok(managerContent.includes('FileSpreadsheet'), 'Manager Dashboard button uses FileSpreadsheet icon');

  // 3. Sales Dashboard
  const salesPath = path.join(CLIENT_SRC, 'features/sales-dashboard/SalesDashboardPage.tsx');
  const salesContent = fs.readFileSync(salesPath, 'utf-8');
  assert.ok(salesContent.includes('New Lead Enquiry'), 'Sales Dashboard contains New Lead Enquiry button');
  assert.ok(salesContent.includes('Bulk Data Upload'), 'Sales Dashboard contains Bulk Data Upload button');
  assert.ok(salesContent.includes('/bulk-upload'), 'Sales Dashboard button navigates to /bulk-upload');
  assert.ok(salesContent.includes('Excel / CSV'), 'Sales Dashboard button includes Excel / CSV label');
  assert.ok(salesContent.includes('FileSpreadsheet'), 'Sales Dashboard button uses FileSpreadsheet icon');

  // 4. Dedicated Leads Page
  const leadsPath = path.join(CLIENT_SRC, 'features/leads/LeadsPage.tsx');
  const leadsContent = fs.readFileSync(leadsPath, 'utf-8');
  assert.ok(leadsContent.includes('New Lead Enquiry'), 'Leads Page contains New Lead Enquiry button');
  assert.ok(leadsContent.includes('Bulk Data Upload'), 'Leads Page contains Bulk Data Upload button');
  assert.ok(leadsContent.includes('/bulk-upload'), 'Leads Page button navigates to /bulk-upload');
  assert.ok(leadsContent.includes('Excel / CSV'), 'Leads Page button includes Excel / CSV label');
  assert.ok(leadsContent.includes('FileSpreadsheet'), 'Leads Page button uses FileSpreadsheet icon');
});
