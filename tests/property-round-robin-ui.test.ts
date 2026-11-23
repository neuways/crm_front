import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientSrc = path.resolve(__dirname, '../src');

test('Property Mapping: Client service and contracts exist', () => {
  const serviceFile = path.join(clientSrc, 'services/property-mapping.service.ts');
  assert.ok(fs.existsSync(serviceFile), 'property-mapping.service.ts exists');

  const content = fs.readFileSync(serviceFile, 'utf-8');
  assert.ok(content.includes('class PropertyMappingService'), 'Exports PropertyMappingService class');
  assert.ok(content.includes('listMappings'), 'Defines listMappings method');
  assert.ok(content.includes('upsertMapping'), 'Defines upsertMapping method');
  assert.ok(content.includes('deleteMapping'), 'Defines deleteMapping method');
});

test('Property Mapping: Admin PropertyMappingModal component exists with controls', () => {
  const modalFile = path.join(clientSrc, 'features/admin/components/PropertyMappingModal.tsx');
  assert.ok(fs.existsSync(modalFile), 'PropertyMappingModal.tsx exists');

  const content = fs.readFileSync(modalFile, 'utf-8');
  assert.ok(content.includes('PropertyMappingModal'), 'Exports PropertyMappingModal component');
  assert.ok(content.includes('handleMoveAgent'), 'Includes agent sequence ordering controls');
  assert.ok(content.includes('handleToggleAgent'), 'Includes agent selection toggles');
  assert.ok(content.includes('handleDelete'), 'Includes mapping deletion action');
});

test('Admin Dashboard: Integrates Property Mappings button and modal', () => {
  const dashboardFile = path.join(clientSrc, 'features/admin/AdminDashboardPage.tsx');
  assert.ok(fs.existsSync(dashboardFile), 'AdminDashboardPage.tsx exists');

  const content = fs.readFileSync(dashboardFile, 'utf-8');
  assert.ok(content.includes('PropertyMappingModal'), 'Imports PropertyMappingModal');
  assert.ok(content.includes('isPropertyMappingModalOpen'), 'Manages property mapping modal open state');
  assert.ok(content.includes('Property Mappings'), 'Includes Property Mappings button');
});

test('New Enquiry Modal: Role-based lead assignment distribution', () => {
  const modalFile = path.join(clientSrc, 'features/sales-dashboard/components/NewEnquiryModal.tsx');
  assert.ok(fs.existsSync(modalFile), 'NewEnquiryModal.tsx exists');

  const content = fs.readFileSync(modalFile, 'utf-8');
  assert.ok(content.includes("role === 'SALES'"), 'Handles SALES role automatic assignment');
  assert.ok(content.includes("role === 'MANAGER'"), 'Handles MANAGER assignment (self vs team)');
  assert.ok(content.includes("role === 'ADMIN'"), 'Handles ADMIN assignment (Round Robin vs manual)');
  assert.ok(content.includes('property-suggestions'), 'Includes property autocomplete datalist');
  assert.ok(content.includes('Unassigned Queue'), 'Informs user if lead is saved in Unassigned Queue');
});

test('New Lead Table & Filters: Unassigned queue display and filtering', () => {
  const tableFile = path.join(clientSrc, 'features/sales-dashboard/components/NewLeadTable.tsx');
  assert.ok(fs.existsSync(tableFile), 'NewLeadTable.tsx exists');

  const tableContent = fs.readFileSync(tableFile, 'utf-8');
  assert.ok(tableContent.includes('Unassigned'), 'Displays Unassigned badge when lead.assignedTo is null');
  assert.ok(tableContent.includes('__UNASSIGNED__'), 'Includes Unassigned Queue option in agent filter');

  const filtersFile = path.join(clientSrc, 'features/sales-dashboard/utils/dashboardFilters.ts');
  const filterContent = fs.readFileSync(filtersFile, 'utf-8');
  assert.ok(filterContent.includes('__UNASSIGNED__'), 'matchesTableFilters handles __UNASSIGNED__');
  assert.ok(filterContent.includes('unassigned'), 'matchesGlobalFilter matches unassigned query');
});
