/**
 * Neuways CRM - REQ-31: Meeting / Site Visit Cancellation Frontend UI & Contract Tests
 *
 * Verifies:
 * 1. ICancellationHistoryItem, updated IMeetingPlan and ISiteVisitPlan types exported in enquiry.types.ts
 * 2. WorkflowStepInput contains action, isCancelled, cancellationReason
 * 3. enquiryService.cancelMeetingPlan and enquiryService.cancelSiteVisitPlan methods exist and target correct endpoints
 * 4. LeadWorkflowPage.tsx renders Cancel Meeting, Cancel Site Visit, Cancelled status badges, history banners, and Reschedule actions
 * 5. LeadWorkflowPage.tsx includes mandatory Cancellation Reason modal dialog
 * 6. FollowUpModal.tsx includes Cancel Meeting and Cancel Site Visit actions, Cancelled badges, and Cancellation Reason modal
 */

import assert from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('REQ-31 Client Types: ICancellationHistoryItem and Plan interfaces', () => {
  const typesPath = path.join(__dirname, '../src/types/enquiry.types.ts');
  assert.ok(fs.existsSync(typesPath), 'enquiry.types.ts must exist');

  const content = fs.readFileSync(typesPath, 'utf-8');
  assert.ok(content.includes('export interface ICancellationHistoryItem'), 'Exports ICancellationHistoryItem');
  assert.ok(content.includes('cancellationReason: string;'), 'ICancellationHistoryItem has cancellationReason');
  assert.ok(content.includes('cancelledAt: string | Date;'), 'ICancellationHistoryItem has cancelledAt');
  assert.ok(content.includes('previousDate?: string;'), 'ICancellationHistoryItem has previousDate');
  assert.ok(content.includes('previousTime?: string;'), 'ICancellationHistoryItem has previousTime');

  // IMeetingPlan
  assert.ok(content.includes('isCancelled?: boolean;'), 'Plan includes isCancelled');
  assert.ok(content.includes('cancellationReason?: string;'), 'Plan includes cancellationReason');
  assert.ok(content.includes('cancellationHistory?: ICancellationHistoryItem[];'), 'Plan includes cancellationHistory array');

  // WorkflowStepInput
  assert.ok(content.includes("action?: 'SAVE' | 'CANCEL' | 'RESCHEDULE';"), 'WorkflowStepInput includes action union');
});

test('REQ-31 Client Service: enquiryService cancellation methods', () => {
  const servicePath = path.join(__dirname, '../src/services/enquiry.service.ts');
  assert.ok(fs.existsSync(servicePath), 'enquiry.service.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf-8');
  assert.ok(content.includes('async cancelMeetingPlan('), 'enquiryService defines cancelMeetingPlan method');
  assert.ok(content.includes('/meeting/cancel'), 'Targets /meeting/cancel endpoint');
  assert.ok(content.includes('async cancelSiteVisitPlan('), 'enquiryService defines cancelSiteVisitPlan method');
  assert.ok(content.includes('/site-visit/cancel'), 'Targets /site-visit/cancel endpoint');
});

test('REQ-31 LeadWorkflowPage: Meeting and Site Visit Cancellation UI', () => {
  const workflowPath = path.join(__dirname, '../src/features/sales-dashboard/LeadWorkflowPage.tsx');
  assert.ok(fs.existsSync(workflowPath), 'LeadWorkflowPage.tsx must exist');

  const content = fs.readFileSync(workflowPath, 'utf-8');

  // Meeting Cancellation UI
  assert.ok(content.includes('Cancel Meeting'), 'Renders Cancel Meeting action button');
  assert.ok(content.includes('Meeting Cancelled'), 'Renders Meeting Cancelled badge');
  assert.ok(content.includes('Reschedule Meeting'), 'Renders Reschedule Meeting action');

  // Site Visit Cancellation UI
  assert.ok(content.includes('Cancel Site Visit'), 'Renders Cancel Site Visit action button');
  assert.ok(content.includes('Site Visit Cancelled'), 'Renders Site Visit Cancelled badge');
  assert.ok(content.includes('Reschedule Site Visit'), 'Renders Reschedule Site Visit action');

  // Mandatory Reason Modal
  assert.ok(content.includes('cancelModalState'), 'Defines cancelModalState');
  assert.ok(content.includes('cancelReasonInput'), 'Tracks cancelReasonInput state');
  assert.ok(content.includes('Cancellation reason is mandatory and cannot be empty'), 'Validates non-empty cancellation reason');
  assert.ok(content.includes('handleConfirmCancelPlan'), 'Provides cancellation submit handler');
});

test('REQ-31 FollowUpModal: Step 2 & Step 3 Cancellation UI', () => {
  const modalPath = path.join(__dirname, '../src/features/sales-dashboard/components/FollowUpModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'FollowUpModal.tsx must exist');

  const content = fs.readFileSync(modalPath, 'utf-8');

  // Meeting and Site Visit Actions in FollowUpModal
  assert.ok(content.includes('Cancel Meeting'), 'FollowUpModal includes Cancel Meeting button');
  assert.ok(content.includes('Cancel Site Visit'), 'FollowUpModal includes Cancel Site Visit button');
  assert.ok(content.includes('Meeting Cancelled'), 'FollowUpModal includes Meeting Cancelled badge');
  assert.ok(content.includes('Site Visit Cancelled'), 'FollowUpModal includes Site Visit Cancelled badge');
  assert.ok(content.includes('cancelModalState'), 'FollowUpModal manages cancelModalState');
  assert.ok(content.includes('handleConfirmCancelPlan'), 'FollowUpModal handles cancellation confirmation');
  assert.ok(content.includes('Cancellation reason is mandatory and cannot be empty'), 'FollowUpModal validates mandatory cancellation reason');
});
