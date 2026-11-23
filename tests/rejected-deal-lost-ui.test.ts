import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('REQ-36 UI: enquiry.types.ts exports ClosureType, reasons, and DealLost interfaces', () => {
  const typesPath = path.join(__dirname, '../src/types/enquiry.types.ts');
  assert.ok(fs.existsSync(typesPath), 'enquiry.types.ts must exist');

  const content = fs.readFileSync(typesPath, 'utf-8');
  assert.ok(content.includes("export type ClosureType = 'REJECTED' | 'DEAL_LOST'"), 'Defines ClosureType union');
  assert.ok(content.includes('export const REJECTED_REASONS'), 'Exports REJECTED_REASONS array');
  assert.ok(content.includes('export const DEAL_LOST_REASONS'), 'Exports DEAL_LOST_REASONS array');
  assert.ok(content.includes('export interface DealLostInput'), 'Exports DealLostInput interface');
  assert.ok(content.includes('closureType?: ClosureType'), 'IRejectionDetails includes closureType');
  assert.ok(content.includes('dealLostCount?: number'), 'ClientDashboardSummaryData includes dealLostCount');
});

test('REQ-36 UI: enquiry.service.ts provides markDealLost and closureType filtering', () => {
  const servicePath = path.join(__dirname, '../src/services/enquiry.service.ts');
  assert.ok(fs.existsSync(servicePath), 'enquiry.service.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf-8');
  assert.ok(content.includes('markDealLost('), 'enquiryService defines markDealLost method');
  assert.ok(content.includes('/deal-lost'), 'markDealLost calls /deal-lost endpoint');
  assert.ok(content.includes('closureType?: ClosureType'), 'getEnquiries accepts closureType query param');
});

test('REQ-36 UI: LeadWorkflowPage implements separate Rejected and Deal Lost actions and modals', () => {
  const pagePath = path.join(__dirname, '../src/features/sales-dashboard/LeadWorkflowPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'LeadWorkflowPage.tsx must exist');

  const content = fs.readFileSync(pagePath, 'utf-8');

  // Separate header action buttons
  assert.ok(content.includes('Mark as Rejected'), 'Separate Mark as Rejected action button is present');
  assert.ok(content.includes('Mark as Deal Lost'), 'Separate Mark as Deal Lost action button is present');

  // State management
  assert.ok(content.includes('isRejectDialogOpen'), 'Rejection dialog state exists');
  assert.ok(content.includes('isDealLostDialogOpen'), 'Deal lost dialog state exists');
  assert.ok(content.includes('dealLostReason'), 'Deal lost reason state exists');
  assert.ok(content.includes('dealLostRemarks'), 'Deal lost remarks state exists');
  assert.ok(content.includes('isDealLostConfirmed'), 'Deal lost confirmation state exists');

  // Modal Dialogs
  assert.ok(content.includes('DEAL_LOST_REASONS'), 'Deal lost modal uses DEAL_LOST_REASONS taxonomy');
  assert.ok(content.includes('Confirm Deal Lost'), 'Confirm Deal Lost submission button is present');
  assert.ok(content.includes('enquiryService.markDealLost'), 'Invokes enquiryService.markDealLost on submission');

  // Mandatory Remarks requirement
  assert.ok(content.includes('Mandatory remarks required'), 'Mandatory remarks indicator displayed in dialog');

  // Step 4 Actions: Finalize Deal Done and Mark Deal Lost are separate
  assert.ok(content.includes('Finalize & Confirm Deal Done'), 'Step 4 retains Finalize Deal Done action');
  assert.ok(content.includes('Mark Deal as Lost'), 'Step 4 provides dedicated Mark Deal as Lost button');

  // Distinct Closed Card Banners
  assert.ok(content.includes('closureType === \'DEAL_LOST\''), 'Renders dedicated styling for DEAL_LOST leads');
  assert.ok(content.includes('DEAL LOST'), 'Displays DEAL LOST badge for lost deals');
  assert.ok(content.includes('REJECTED'), 'Displays REJECTED badge for rejected leads');
});

test('REQ-36 UI: RejectedLeadTable renders outcome filter pills and distinct badges', () => {
  const tablePath = path.join(__dirname, '../src/features/leads/components/RejectedLeadTable.tsx');
  assert.ok(fs.existsSync(tablePath), 'RejectedLeadTable.tsx must exist');

  const content = fs.readFileSync(tablePath, 'utf-8');

  // Outcome filter pills
  assert.ok(content.includes('All Closed'), 'Outcome filter includes All Closed pill');
  assert.ok(content.includes('Rejected Only'), 'Outcome filter includes Rejected Only pill');
  assert.ok(content.includes('Deal Lost Only'), 'Outcome filter includes Deal Lost Only pill');

  // Outcome badges
  assert.ok(content.includes('lead.rejection?.closureType === \'DEAL_LOST\''), 'Inspects closureType for deal lost');
  assert.ok(content.includes('Deal Lost'), 'Renders Deal Lost label');
  assert.ok(content.includes('Rejected'), 'Renders Rejected label');

  // Preserved columns
  assert.ok(content.includes('Customer / Lead Name'), 'Customer / Lead Name column preserved');
  assert.ok(content.includes('Assigned Sales Agent'), 'Assigned Sales Agent column preserved');
  assert.ok(content.includes('Previous Stage'), 'Previous Stage column preserved');
  assert.ok(content.includes('Rejection Reason'), 'Rejection Reason column preserved');
  assert.ok(content.includes('Remarks'), 'Remarks column preserved');
  assert.ok(content.includes('Rejection Date & Time'), 'Rejection Date & Time column preserved');
  assert.ok(content.includes('Action'), 'Action column preserved');
});

test('REQ-36 UI: Admin and Manager Dashboards display separated metrics and breakdowns', () => {
  const adminPagePath = path.join(__dirname, '../src/features/admin/AdminDashboardPage.tsx');
  const adminContent = fs.readFileSync(adminPagePath, 'utf-8');
  assert.ok(adminContent.includes('dealLostCount'), 'Admin dashboard reads dealLostCount from summary');

  const managerPagePath = path.join(__dirname, '../src/features/manager/ManagerDashboardPage.tsx');
  const managerContent = fs.readFileSync(managerPagePath, 'utf-8');
  assert.ok(managerContent.includes('dealLostCount'), 'Manager dashboard reads dealLostCount from summary');
});
