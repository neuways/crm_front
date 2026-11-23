import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('REQ-38 UI: enquiry.types.ts exports DNC reason constants, labels, and interfaces', () => {
  const typesPath = path.join(__dirname, '../src/types/enquiry.types.ts');
  assert.ok(fs.existsSync(typesPath), 'enquiry.types.ts must exist');

  const content = fs.readFileSync(typesPath, 'utf-8');

  // Reasons & types
  assert.ok(content.includes('export type DncActivationReason ='), 'Exports DncActivationReason type');
  assert.ok(content.includes('export const DNC_ACTIVATION_REASONS ='), 'Exports DNC_ACTIVATION_REASONS array');
  assert.ok(content.includes("'CUSTOMER_EXPLICITLY_REQUESTED'"), 'Includes CUSTOMER_EXPLICITLY_REQUESTED reason');
  assert.ok(content.includes("'LEGAL_REGULATORY_OPT_OUT'"), 'Includes LEGAL_REGULATORY_OPT_OUT reason');
  assert.ok(content.includes("'OTHER'"), 'Includes OTHER reason');

  assert.ok(content.includes('export type DncRevocationReason ='), 'Exports DncRevocationReason type');
  assert.ok(content.includes('export const DNC_REVOCATION_REASONS ='), 'Exports DNC_REVOCATION_REASONS array');
  assert.ok(content.includes("'CUSTOMER_RENEWED_CONSENT'"), 'Includes CUSTOMER_RENEWED_CONSENT reason');
  assert.ok(content.includes("'MANAGER_OVERRIDE'"), 'Includes MANAGER_OVERRIDE reason');

  // Labels
  assert.ok(content.includes('export const DNC_ACTIVATION_REASON_LABELS'), 'Exports DNC_ACTIVATION_REASON_LABELS');
  assert.ok(content.includes('export const DNC_REVOCATION_REASON_LABELS'), 'Exports DNC_REVOCATION_REASON_LABELS');

  // Input & detail interfaces
  assert.ok(content.includes('export interface EnableDoNotContactInput'), 'Exports EnableDoNotContactInput interface');
  assert.ok(content.includes('export interface RevokeDoNotContactInput'), 'Exports RevokeDoNotContactInput interface');
  assert.ok(content.includes('export interface DncDetails'), 'Exports DncDetails interface');
  assert.ok(content.includes('export interface GetDoNotContactResponse'), 'Exports GetDoNotContactResponse interface');

  // Enquiry model extension
  assert.ok(content.includes('isDoNotContact?: boolean'), 'IEnquiry contains isDoNotContact boolean flag');
});

test('REQ-38 UI: enquiry.service.ts provides enableDoNotContact, revokeDoNotContact, and getDoNotContactStatus', () => {
  const servicePath = path.join(__dirname, '../src/services/enquiry.service.ts');
  assert.ok(fs.existsSync(servicePath), 'enquiry.service.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf-8');

  assert.ok(content.includes('enableDoNotContact('), 'enquiryService defines enableDoNotContact');
  assert.ok(content.includes('/do-not-contact/enable'), 'enableDoNotContact calls /do-not-contact/enable');

  assert.ok(content.includes('revokeDoNotContact('), 'enquiryService defines revokeDoNotContact');
  assert.ok(content.includes('/do-not-contact/revoke'), 'revokeDoNotContact calls /do-not-contact/revoke');

  assert.ok(content.includes('getDoNotContactStatus('), 'enquiryService defines getDoNotContactStatus');
  assert.ok(content.includes('/do-not-contact'), 'getDoNotContactStatus calls /do-not-contact');
});

test('REQ-38 UI: LeadWorkflowPage implements DNC header badges, action buttons, banner, and dialogs', () => {
  const pagePath = path.join(__dirname, '../src/features/sales-dashboard/LeadWorkflowPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'LeadWorkflowPage.tsx must exist');

  const content = fs.readFileSync(pagePath, 'utf-8');

  // DNC Header badge
  assert.ok(content.includes('data-testid="dnc-title-badge"'), 'Header renders DNC title badge when lead is restricted');
  assert.ok(content.includes('DO NOT CONTACT (DNC)'), 'Displays DO NOT CONTACT (DNC) badge label');

  // Header action buttons
  assert.ok(content.includes('data-testid="mark-dnc-btn"'), 'Renders Do Not Contact button when DNC is inactive');
  assert.ok(content.includes('data-testid="revoke-dnc-btn"'), 'Renders Revoke DNC button for Manager/Admin when DNC is active');

  // Role gating on Revoke action
  assert.ok(content.includes("user?.role === 'ADMIN' || user?.role === 'MANAGER'"), 'Revoke DNC button is strictly gated to Manager and Admin');

  // Active DNC Banner
  assert.ok(content.includes('data-testid="dnc-active-banner"'), 'Renders prominent active DNC banner');
  assert.ok(content.includes('DO NOT CONTACT (DNC) RESTRICTION ACTIVE'), 'Banner shows restriction title');
  assert.ok(content.includes('data-testid="revoke-dnc-banner-btn"'), 'Banner provides quick Revoke DNC button for authorized roles');

  // Enable DNC Modal
  assert.ok(content.includes('data-testid="enable-dnc-modal"'), 'Renders Enable DNC dialog modal');
  assert.ok(content.includes('data-testid="dnc-reason-select"'), 'Enable modal includes predefined reason select');
  assert.ok(content.includes('data-testid="dnc-remarks-input"'), 'Enable modal includes mandatory remarks textarea');
  assert.ok(content.includes('data-testid="confirm-enable-dnc-btn"'), 'Enable modal includes confirm button');

  // Revoke DNC Modal
  assert.ok(content.includes('data-testid="revoke-dnc-modal"'), 'Renders Revoke DNC dialog modal');
  assert.ok(content.includes('data-testid="revoke-dnc-reason-select"'), 'Revoke modal includes predefined revocation reason select');
  assert.ok(content.includes('data-testid="revoke-dnc-remarks-input"'), 'Revoke modal includes mandatory revocation remarks textarea');
  assert.ok(content.includes('data-testid="confirm-revoke-dnc-btn"'), 'Revoke modal includes confirm button');

  // Communication blocking in workflow
  assert.ok(content.includes('lead.isDoNotContact && activeStep <= 3'), 'Blocks communication & scheduling in steps 1 to 3');
  assert.ok(content.includes('Customer has requested Do Not Contact'), 'Shows descriptive error message when contact is attempted');
});

test('REQ-38 UI: NewLeadTable and PendingFollowUpsPage display DNC badge next to customer name', () => {
  const tablePath = path.join(__dirname, '../src/features/sales-dashboard/components/NewLeadTable.tsx');
  assert.ok(fs.existsSync(tablePath), 'NewLeadTable.tsx must exist');

  const tableContent = fs.readFileSync(tablePath, 'utf-8');
  assert.ok(tableContent.includes('lead.isDoNotContact'), 'NewLeadTable inspects lead.isDoNotContact');
  assert.ok(tableContent.includes('data-testid="lead-dnc-badge"'), 'NewLeadTable renders lead-dnc-badge');

  const followUpsPath = path.join(__dirname, '../src/features/follow-ups/PendingFollowUpsPage.tsx');
  assert.ok(fs.existsSync(followUpsPath), 'PendingFollowUpsPage.tsx must exist');

  const followUpsContent = fs.readFileSync(followUpsPath, 'utf-8');
  assert.ok(followUpsContent.includes('lead.isDoNotContact'), 'PendingFollowUpsPage inspects lead.isDoNotContact');
  assert.ok(followUpsContent.includes('data-testid="lead-dnc-badge"'), 'PendingFollowUpsPage renders lead-dnc-badge');
});
