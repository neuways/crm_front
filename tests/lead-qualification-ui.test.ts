import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Lead Qualification UI: Components exist and export proper React components', () => {
  const tablePath = path.join(
    __dirname,
    '../src/features/sales-dashboard/components/LeadQualificationTable.tsx'
  );
  assert.ok(fs.existsSync(tablePath), 'LeadQualificationTable.tsx exists');
  const tableContent = fs.readFileSync(tablePath, 'utf-8');
  assert.ok(
    tableContent.includes('export const LeadQualificationTable'),
    'LeadQualificationTable component is exported'
  );

  const modalPath = path.join(
    __dirname,
    '../src/features/sales-dashboard/components/QualifyLeadModal.tsx'
  );
  assert.ok(fs.existsSync(modalPath), 'QualifyLeadModal.tsx exists');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');
  assert.ok(
    modalContent.includes('export const QualifyLeadModal'),
    'QualifyLeadModal component is exported'
  );
});

test('Lead Qualification UI: LeadQualificationTable supports unscored and populated states', () => {
  const tablePath = path.join(
    __dirname,
    '../src/features/sales-dashboard/components/LeadQualificationTable.tsx'
  );
  const content = fs.readFileSync(tablePath, 'utf-8');

  // Unscored state checks
  assert.ok(
    content.includes('Pipeline Unpopulated'),
    'Preserves Pipeline Unpopulated badge in unscored state'
  );
  assert.ok(
    content.includes('Lead Readiness Scoring Awaiting Configuration'),
    'Preserves Lead Readiness Scoring Awaiting Configuration title in unscored state'
  );

  // Populated matrix checks
  assert.ok(
    content.includes('matrix.percentages.map'),
    'Maps across exact readiness percentage columns'
  );
  assert.ok(
    content.includes('matrix.hotRow.values.map'),
    'Renders Hot row numeric values'
  );
  assert.ok(
    content.includes('matrix.possRow.values.map'),
    'Renders Poss. row numeric values'
  );

  // Scored prospects breakdown
  assert.ok(
    content.includes('Qualified Active Prospects'),
    'Displays qualified prospects breakdown panel'
  );
});

test('Lead Qualification UI: QualifyLeadModal implements BANT 4-dimension scoring', () => {
  const modalPath = path.join(
    __dirname,
    '../src/features/sales-dashboard/components/QualifyLeadModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Budget dimension
  assert.ok(
    content.includes('VERIFIED_BUDGET') && content.includes('LOAN_PRE_APPROVED'),
    'Implements budget readiness options'
  );

  // Timeline dimension
  assert.ok(
    content.includes('IMMEDIATE') && content.includes('WITHIN_30_DAYS'),
    'Implements purchase timeline options'
  );

  // Authority dimension
  assert.ok(
    content.includes('SOLE_DECISION_MAKER') && content.includes('JOINT_DECISION_MAKER'),
    'Implements decision maker authority options'
  );

  // Need clarity dimension
  assert.ok(
    content.includes('SPECIFIC_UNIT_TYPE') && content.includes('GENERAL_REQUIREMENT'),
    'Implements requirement clarity options'
  );

  // Live score calculation
  assert.ok(
    content.includes('Calculated Readiness:'),
    'Displays real-time calculated score preview'
  );
  assert.ok(
    content.includes('enquiryService.qualifyLead'),
    'Persists scoring via enquiryService.qualifyLead'
  );
});

test('Lead Qualification UI: SalesDashboardPage mounts LeadQualificationTable with activeLeads', () => {
  const dashboardPath = path.join(
    __dirname,
    '../src/features/sales-dashboard/SalesDashboardPage.tsx'
  );
  const content = fs.readFileSync(dashboardPath, 'utf-8');
  assert.ok(
    content.includes('<LeadQualificationTable'),
    'SalesDashboardPage mounts LeadQualificationTable'
  );
  assert.ok(
    content.includes('activeLeads={newLeads}'),
    'Passes activeLeads to LeadQualificationTable for dynamic lead qualification'
  );
  assert.ok(
    content.includes('onQualificationSaved={refreshLeads}'),
    'Refreshes dashboard on qualification update'
  );
});
