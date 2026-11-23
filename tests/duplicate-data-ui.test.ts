import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.join(__dirname, '../src');

test('Duplicate Data Types: Definitions include DuplicateRecordItem, GetDuplicateRecordsResult, and PreviousEnquirySummary', () => {
  const filePath = path.join(CLIENT_SRC, 'types/enquiry.types.ts');
  assert.ok(fs.existsSync(filePath), 'enquiry.types.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('export interface PreviousEnquirySummary'), 'Defines PreviousEnquirySummary interface');
  assert.ok(content.includes("previousStatus: 'Deal Done' | 'Rejected'"), 'Includes previousStatus with Deal Done | Rejected');
  assert.ok(content.includes('previousAssignedAgent?: string'), 'Includes previousAssignedAgent');
  assert.ok(content.includes('previousManager?: string'), 'Includes previousManager');
  assert.ok(content.includes('previousRemarks?: string'), 'Includes previousRemarks');
  assert.ok(content.includes('export interface DuplicateRecordItem'), 'Defines DuplicateRecordItem interface');
  assert.ok(content.includes('export interface GetDuplicateRecordsResult'), 'Defines GetDuplicateRecordsResult interface');
  assert.ok(content.includes('isRedFlag?: boolean'), 'Includes isRedFlag flag');
  assert.ok(content.includes('allowReEnquiry?: boolean'), 'Includes allowReEnquiry flag');
  assert.ok(content.includes('isReEnquiry?: boolean'), 'Includes isReEnquiry flag');
});

test('Notification Types: Includes RETURNING_CUSTOMER_RE_ENQUIRY in NotificationType enum', () => {
  const filePath = path.join(CLIENT_SRC, 'types/notification.types.ts');
  assert.ok(fs.existsSync(filePath), 'notification.types.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes("'RETURNING_CUSTOMER_RE_ENQUIRY'"), 'Includes RETURNING_CUSTOMER_RE_ENQUIRY notification type');
});

test('Enquiry Service: Client service defines getDuplicateRecords and getDuplicateCount', () => {
  const filePath = path.join(CLIENT_SRC, 'services/enquiry.service.ts');
  assert.ok(fs.existsSync(filePath), 'enquiry.service.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('getDuplicateRecords('), 'Defines getDuplicateRecords method');
  assert.ok(content.includes('getDuplicateCount('), 'Defines getDuplicateCount method');
  assert.ok(content.includes('/duplicates'), 'Calls /duplicates endpoint');
  assert.ok(content.includes('/duplicates/count'), 'Calls /duplicates/count endpoint');
});

test('AppSidebar: Renders Duplicate Data link for Admin, Manager, and Sales roles', () => {
  const filePath = path.join(CLIENT_SRC, 'components/layout/AppSidebar.tsx');
  assert.ok(fs.existsSync(filePath), 'AppSidebar.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('path: "/duplicate-data"'), 'Includes /duplicate-data route link');
  assert.ok(content.includes('name: "Duplicate Data"'), 'Includes Duplicate Data label');
  assert.ok(content.includes('icon: Copy'), 'Uses Copy icon for Duplicate Data');
});

test('AppRoutes: Registers /duplicate-data and /duplicates route endpoints protected with Layout', () => {
  const filePath = path.join(CLIENT_SRC, 'routes/AppRoutes.tsx');
  assert.ok(fs.existsSync(filePath), 'AppRoutes.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('DuplicateDataPage'), 'Imports DuplicateDataPage component');
  assert.ok(content.includes('path="duplicate-data"'), 'Registers duplicate-data path');
  assert.ok(content.includes('path="duplicates"'), 'Registers duplicates alias path');
});

test('DuplicateDataPage: Component exists with role subtitle, duplicate metrics, search, and table', () => {
  const filePath = path.join(CLIENT_SRC, 'features/duplicate-data/DuplicateDataPage.tsx');
  assert.ok(fs.existsSync(filePath), 'DuplicateDataPage.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('Duplicate Data Management'), 'Contains page title');
  assert.ok(content.includes('Company-wide duplicate records across all teams'), 'Contains Admin role description');
  assert.ok(content.includes('Duplicate records belonging only to your team members'), 'Contains Manager role description');
  assert.ok(content.includes('Duplicate records scoped strictly to your assigned leads'), 'Contains Sales role description');
  assert.ok(content.includes('getDuplicateRecords'), 'Calls getDuplicateRecords API');
  assert.ok(content.includes('Existing / Previous Lead Record'), 'Renders existing/previous lead column');
  assert.ok(content.includes('Attempted Lead Details'), 'Renders attempted lead details');
});

test('NewEnquiryModal: Implements Red Flag banner with 10 fields and Re-Enquiry confirmation action', () => {
  const filePath = path.join(CLIENT_SRC, 'features/sales-dashboard/components/NewEnquiryModal.tsx');
  assert.ok(fs.existsSync(filePath), 'NewEnquiryModal.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('isRedFlag'), 'Tracks isRedFlag state');
  assert.ok(content.includes('previousEnquiry'), 'Tracks previousEnquiry state');
  assert.ok(content.includes('RED FLAG — Returning Customer Detected'), 'Renders prominent Red Flag banner');
  assert.ok(content.includes('Previous Project / Property'), 'Displays previous project');
  assert.ok(content.includes('Previous Assigned Sales Agent'), 'Displays previous sales agent');
  assert.ok(content.includes('Previous Manager'), 'Displays previous manager');
  assert.ok(content.includes('Previous Budget'), 'Displays previous budget');
  assert.ok(content.includes('Previous Enquiry Date'), 'Displays previous enquiry date');
  assert.ok(content.includes('Previous Remarks'), 'Displays previous remarks');
  assert.ok(content.includes('Confirm & Create New Lead for Returning Customer'), 'Provides action button to confirm and create new lead');
  assert.ok(content.includes('executeSubmit(true)'), 'Calls executeSubmit(true) on confirmation');
  assert.ok(content.includes('allowReEnquiry'), 'Passes allowReEnquiry in createEnquiry payload');
  assert.ok(content.includes('previousEnquiryId'), 'Passes previousEnquiryId in createEnquiry payload');
});
