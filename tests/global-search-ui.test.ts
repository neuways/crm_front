import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Global Search UI: GlobalSearchBar component exists and exports proper React component', () => {
  const searchBarPath = path.join(
    __dirname,
    '../src/components/layout/GlobalSearchBar.tsx'
  );
  assert.ok(fs.existsSync(searchBarPath), 'GlobalSearchBar.tsx exists');
  const content = fs.readFileSync(searchBarPath, 'utf-8');
  assert.ok(
    content.includes('export const GlobalSearchBar'),
    'GlobalSearchBar component is exported'
  );
  assert.ok(
    content.includes('searchLeads'),
    'GlobalSearchBar invokes enquiryService.searchLeads'
  );
});

test('Global Search UI: AppHeader integrates GlobalSearchBar and removes placeholder modal behavior for search', () => {
  const headerPath = path.join(
    __dirname,
    '../src/components/layout/AppHeader.tsx'
  );
  assert.ok(fs.existsSync(headerPath), 'AppHeader.tsx exists');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  // Must import and render GlobalSearchBar
  assert.ok(
    headerContent.includes('GlobalSearchBar'),
    'AppHeader imports and renders GlobalSearchBar'
  );

  // Must NOT trigger placeholder for search
  assert.ok(
    !headerContent.includes("onShowPlaceholderNotice('Global CRM Search')"),
    'AppHeader removed onShowPlaceholderNotice for Global CRM Search'
  );

  // Must preserve desktop container styling and dimension
  assert.ok(
    headerContent.includes('flex-1 max-w-md hidden sm:block'),
    'Preserves desktop container max-w-md hidden sm:block'
  );
});

test('Global Search UI: GlobalSearchBar implements all required UX states and actions', () => {
  const searchBarPath = path.join(
    __dirname,
    '../src/components/layout/GlobalSearchBar.tsx'
  );
  const content = fs.readFileSync(searchBarPath, 'utf-8');

  // Loading state
  assert.ok(
    content.includes('Searching CRM leads and properties') || content.includes('animate-spin'),
    'Implements loading state with spinner'
  );

  // Error state
  assert.ok(
    content.includes('Search Request Failed'),
    'Implements error state'
  );

  // No-results state
  assert.ok(
    content.includes('No matching leads found'),
    'Implements no matching leads state'
  );

  // Clear button action
  assert.ok(
    content.includes('handleClear') && content.includes('Clear search input'),
    'Implements clear search action button'
  );

  // Debouncing
  assert.ok(
    content.includes('setTimeout') && content.includes('clearTimeout'),
    'Implements debounce on user keystrokes'
  );

  // Result routing
  assert.ok(
    content.includes('/sales/completed-deals/') && content.includes('/sales/leads/'),
    'Routes active leads to /sales/leads/:id/workflow and completed deals to /sales/completed-deals/:id'
  );
});

test('Global Search UI: enquiryService defines searchLeads API method with parameters', () => {
  const servicePath = path.join(
    __dirname,
    '../src/services/enquiry.service.ts'
  );
  const content = fs.readFileSync(servicePath, 'utf-8');
  assert.ok(
    content.includes('searchLeads(query: string'),
    'enquiryService defines searchLeads method'
  );
  assert.ok(
    content.includes('excludeCompletedDeals: false'),
    'searchLeads includes both active and completed leads in search query'
  );
});
