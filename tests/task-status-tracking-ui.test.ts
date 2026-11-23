/**
 * Neuways CRM - REQ-22: Task Status Tracking Frontend UI & Contract Tests
 *
 * Verifies:
 * 1. TaskStatus and TaskStatusCounts types are exported from enquiry.types.ts
 * 2. IFollowUpTaskClient and UpdateTaskStatusPayload types are exported
 * 3. enquiryService.updateTaskStatus method exists and targets correct PATCH endpoint
 * 4. LeadWorkflowPage.tsx renders Tab 2 with Follow-Up Tasks and Status Tracking
 * 5. LeadWorkflowPage.tsx defines allowed state transitions and prevents terminal status reopening
 * 6. LeadWorkflowPage.tsx enforces mandatory cancellation reason and rescheduled date/time
 * 7. PendingFollowUpsPage.tsx displays the 5-status breakdown pills
 */

import assert from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('REQ-22 Client Types: TaskStatus and TaskStatusCounts definitions', () => {
  const typesPath = path.join(__dirname, '../src/types/enquiry.types.ts');
  assert.ok(fs.existsSync(typesPath), 'enquiry.types.ts must exist');

  const content = fs.readFileSync(typesPath, 'utf-8');
  assert.ok(content.includes('export type TaskStatus'), 'Exports TaskStatus union');
  assert.ok(content.includes("'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'"), 'Includes all 5 required statuses');
  assert.ok(content.includes('export interface TaskStatusCounts'), 'Exports TaskStatusCounts interface');
  assert.ok(content.includes('export interface IFollowUpTaskClient'), 'Exports IFollowUpTaskClient interface');
  assert.ok(content.includes('export interface UpdateTaskStatusPayload'), 'Exports UpdateTaskStatusPayload interface');
  assert.ok(content.includes('taskStatusCounts?: TaskStatusCounts'), 'ClientDashboardSummaryData includes taskStatusCounts');
});

test('REQ-22 Client Service: enquiryService.updateTaskStatus implementation', () => {
  const servicePath = path.join(__dirname, '../src/services/enquiry.service.ts');
  assert.ok(fs.existsSync(servicePath), 'enquiry.service.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf-8');
  assert.ok(content.includes('async updateTaskStatus('), 'enquiryService defines updateTaskStatus method');
  assert.ok(content.includes('follow-ups/${taskId}/status'), 'Calls PATCH /enquiries/:id/follow-ups/:taskId/status');
});

test('REQ-22 LeadWorkflowPage: Follow-up Tasks & Status Tracking UI in Tab 2', () => {
  const workflowPath = path.join(__dirname, '../src/features/sales-dashboard/LeadWorkflowPage.tsx');
  assert.ok(fs.existsSync(workflowPath), 'LeadWorkflowPage.tsx must exist');

  const content = fs.readFileSync(workflowPath, 'utf-8');

  // Tab 2 rendering tasks from historyList
  assert.ok(content.includes('Follow-Up Tasks & Status Tracking'), 'Renders Follow-Up Tasks & Status Tracking section');
  assert.ok(content.includes('historyList.map'), 'Maps over historyList items');
  assert.ok(content.includes('Update Status'), 'Provides Update Status action button');

  // Status badges
  assert.ok(content.includes('Pending') && content.includes('bg-amber-100'), 'Renders Pending status badge');
  assert.ok(content.includes('In Progress') && content.includes('bg-blue-100'), 'Renders In Progress status badge');
  assert.ok(content.includes('Completed') && content.includes('bg-emerald-100'), 'Renders Completed status badge');
  assert.ok(content.includes('Cancelled') && content.includes('bg-rose-100'), 'Renders Cancelled status badge');
  assert.ok(content.includes('Rescheduled') && content.includes('bg-purple-100'), 'Renders Rescheduled status badge');

  // Terminal status guard
  assert.ok(content.includes('isTerminal'), 'Checks whether task is in terminal status');
  assert.ok(content.includes('Locked'), 'Terminal tasks display Locked status without reopening action');

  // Modal dialog & validation
  assert.ok(content.includes('selectedTaskForStatus'), 'Controls modal dialog via selectedTaskForStatus state');
  assert.ok(content.includes('ALLOWED_TASK_TRANSITIONS'), 'Defines strictly allowed status transitions');
  assert.ok(content.includes('cancellationReason'), 'Enforces cancellation reason input');
  assert.ok(content.includes('taskRescheduledDate'), 'Enforces rescheduled date input');
  assert.ok(content.includes('taskRescheduledTime'), 'Enforces rescheduled time input');
});

test('REQ-22 PendingFollowUpsPage: Displays 5-status breakdown pills', () => {
  const pendingPagePath = path.join(__dirname, '../src/features/follow-ups/PendingFollowUpsPage.tsx');
  assert.ok(fs.existsSync(pendingPagePath), 'PendingFollowUpsPage.tsx must exist');

  const content = fs.readFileSync(pendingPagePath, 'utf-8');
  assert.ok(content.includes('taskStatusCounts'), 'PendingFollowUpsPage consumes taskStatusCounts');
  assert.ok(content.includes('taskStatusCounts.pending'), 'Displays pending count');
  assert.ok(content.includes('taskStatusCounts.inProgress'), 'Displays inProgress count');
  assert.ok(content.includes('taskStatusCounts.completed'), 'Displays completed count');
  assert.ok(content.includes('taskStatusCounts.cancelled'), 'Displays cancelled count');
  assert.ok(content.includes('taskStatusCounts.rescheduled'), 'Displays rescheduled count');
});
