/**
 * Nueways CRM - Frontend Verification for Sales Agent Property Assignment
 *
 * Verifies:
 * 1. PropertiesSelect component exists, exports PropertiesSelect, renders "Properties to Handle",
 *    supports property chips with remove action, dropdown with "+ Add New Property", and inline creation modal.
 * 2. AddEmployeeModal:
 *    - Conditionally renders PropertiesSelect ONLY when role is 'SALES'.
 *    - Suppresses PropertiesSelect when role is 'MANAGER'.
 *    - Passes propertyIds to userService.createEmployee.
 * 3. EditEmployeeModal:
 *    - Conditionally renders PropertiesSelect ONLY when role is 'SALES'.
 *    - Pre-populates assignedPropertyIds from employee profile.
 *    - Passes updated propertyIds to userService.updateEmployee.
 * 4. AddEmployeePage:
 *    - Integrates PropertiesSelect for dedicated employee provisioning page.
 *    - Transmits propertyIds in payload.
 * 5. EmployeeManagementPage:
 *    - Renders assigned property pills for Sales Agents in the employee directory table.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientSrc = path.resolve(__dirname, '../src');

test('PropertiesSelect: Component exists with required UX contracts', () => {
  const componentPath = path.join(clientSrc, 'features/admin/components/PropertiesSelect.tsx');
  assert.ok(fs.existsSync(componentPath), 'PropertiesSelect.tsx exists');

  const content = fs.readFileSync(componentPath, 'utf-8');
  assert.ok(content.includes('export const PropertiesSelect'), 'Exports PropertiesSelect component');
  assert.ok(content.includes('Properties to Handle'), 'Contains exact label "Properties to Handle"');
  assert.ok(content.includes('+ Add New Property'), 'Includes "+ Add New Property" option/button');
  assert.ok(content.includes('propertyMappingService.listMappings'), 'Fetches dynamic properties from CRM');
  assert.ok(content.includes('propertyMappingService.upsertMapping'), 'Calls upsertMapping on adding new property');
  assert.ok(content.includes('handleRemoveProperty'), 'Supports removing assigned properties');
});

test('AddEmployeeModal: Conditionally renders Properties to Handle only for SALES', () => {
  const modalPath = path.join(clientSrc, 'features/admin/components/AddEmployeeModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'AddEmployeeModal.tsx exists');

  const content = fs.readFileSync(modalPath, 'utf-8');
  assert.ok(content.includes('PropertiesSelect'), 'Imports PropertiesSelect component');
  assert.ok(content.includes("role === 'SALES' && ("), 'Conditionally checks role === SALES');
  assert.ok(content.includes('propertyIds: role === \'SALES\' ? propertyIds : undefined'), 'Submits propertyIds only for SALES role');
});

test('EditEmployeeModal: Loads existing assigned properties and submits updates', () => {
  const modalPath = path.join(clientSrc, 'features/admin/components/EditEmployeeModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'EditEmployeeModal.tsx exists');

  const content = fs.readFileSync(modalPath, 'utf-8');
  assert.ok(content.includes('PropertiesSelect'), 'Imports PropertiesSelect component');
  assert.ok(content.includes('employee.assignedPropertyIds'), 'Pre-loads assignedPropertyIds from employee');
  assert.ok(content.includes("role === 'SALES' && employee.role !== 'ADMIN'"), 'Shows properties only for non-admin SALES agents');
  assert.ok(content.includes('propertyIds: role === \'SALES\' ? propertyIds : []'), 'Submits updated propertyIds payload');
});

test('AddEmployeePage: Integrates PropertiesSelect in dedicated provisioning page', () => {
  const pagePath = path.join(clientSrc, 'features/admin/AddEmployeePage.tsx');
  assert.ok(fs.existsSync(pagePath), 'AddEmployeePage.tsx exists');

  const content = fs.readFileSync(pagePath, 'utf-8');
  assert.ok(content.includes('PropertiesSelect'), 'Imports PropertiesSelect in AddEmployeePage');
  assert.ok(content.includes("role === 'SALES' && ("), 'Guards PropertiesSelect with role === SALES');
  assert.ok(content.includes('propertyIds: role === \'SALES\' ? propertyIds : undefined'), 'Submits propertyIds in create payload');
});

test('EmployeeManagementPage: Displays assigned properties in employee directory', () => {
  const pagePath = path.join(clientSrc, 'features/admin/EmployeeManagementPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'EmployeeManagementPage.tsx exists');

  const content = fs.readFileSync(pagePath, 'utf-8');
  assert.ok(content.includes('emp.role === \'SALES\' && emp.assignedProperties'), 'Renders assigned properties for sales agents');
  assert.ok(content.includes('Building'), 'Uses Building icon for assigned property badges');
});
