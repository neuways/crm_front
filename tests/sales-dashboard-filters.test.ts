import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isWithinPeriod,
  matchesDatePeriod,
  matchesGlobalFilter,
  matchesTableFilters,
  TableFilterState,
} from '../src/features/sales-dashboard/utils/dashboardFilters.js';
import { NewLeadItem } from '../src/features/sales-dashboard/types/dashboard.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures with known realistic variations
const today = new Date();
const todayIso = today.toISOString();

// Construct a date in the current week (e.g. today or 1 day ago within current week)
const dayOfWeek = today.getDay();
const diffToMonday = (dayOfWeek + 6) % 7;
const currentWeekDate = new Date(today);
currentWeekDate.setDate(today.getDate() - (diffToMonday > 0 ? 1 : 0));
const currentWeekIso = currentWeekDate.toISOString();

// Construct a date in the current month but previous week (or 10 days ago within same month)
const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 2);
const currentMonthIso = currentMonthDate.toISOString();

// Past date outside current month
const lastYearIso = new Date(today.getFullYear() - 1, 5, 15).toISOString();

const sampleLeads: NewLeadItem[] = [
  {
    id: 'lead-1',
    srNo: '01',
    name: 'Aarav Sharma',
    initials: 'AS',
    avatarColor: 'bg-blue-100 text-blue-700',
    mobile: '+91 98765 ••123',
    price: '₹5,000,000',
    remark: 'Looking for 3BHK high-rise in Skyline Towers',
    isMockData: false,
    createdAt: todayIso,
    status: 'ACTIVE',
    currentStage: 'FOLLOW_UP',
    assignedTo: { id: 'agent-1', name: 'Vikram Malhotra', role: 'SALES' },
    nextFollowUpDate: todayIso,
    nextFollowUpTime: '11:00 AM',
    projectName: 'Skyline Towers',
  },
  {
    id: 'lead-2',
    srNo: '02',
    name: 'Deepika Rao',
    initials: 'DR',
    avatarColor: 'bg-purple-100 text-purple-700',
    mobile: '+91 98111 ••456',
    price: '₹8,500,000',
    remark: 'Penthouse luxury requirement with private terrace',
    isMockData: false,
    createdAt: currentWeekIso,
    status: 'ACTIVE',
    currentStage: 'MEETING_PLAN',
    assignedTo: { id: 'agent-2', name: 'Priya Patel', role: 'SALES' },
    nextFollowUpDate: currentWeekIso,
    nextFollowUpTime: '03:00 PM',
    projectName: 'Grand Residency',
  },
  {
    id: 'lead-3',
    srNo: '03',
    name: 'Karan Mehra',
    initials: 'KM',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    mobile: '+91 98222 ••789',
    price: '₹3,200,000',
    remark: 'Investment in retail commercial shop',
    isMockData: false,
    createdAt: currentMonthIso,
    status: 'ACTIVE',
    currentStage: 'SITE_VISIT_PLAN',
    assignedTo: { id: 'agent-1', name: 'Vikram Malhotra', role: 'SALES' },
    nextFollowUpDate: undefined,
    projectName: 'Metro Hub Commercial',
  },
  {
    id: 'lead-4',
    srNo: '04',
    name: 'Sneha Kulkarni',
    initials: 'SK',
    avatarColor: 'bg-indigo-100 text-indigo-700',
    mobile: '+91 98333 ••999',
    price: '₹12,000,000',
    remark: 'Villa deal finalized with documentation complete',
    isMockData: false,
    createdAt: lastYearIso,
    status: 'ACTIVE',
    currentStage: 'DEAL_DONE',
    assignedTo: { id: 'agent-3', name: 'Amit Verma', role: 'SALES' },
    nextFollowUpDate: undefined,
    projectName: 'Palm Meadows',
  },
];

test('Global Filter: Matches by lead/customer name case-insensitively', () => {
  const matchAarav = sampleLeads.filter((l) => matchesGlobalFilter(l, 'aarav'));
  assert.strictEqual(matchAarav.length, 1);
  assert.strictEqual(matchAarav[0].name, 'Aarav Sharma');

  const matchDeepika = sampleLeads.filter((l) => matchesGlobalFilter(l, 'DEEPIKA'));
  assert.strictEqual(matchDeepika.length, 1);
  assert.strictEqual(matchDeepika[0].name, 'Deepika Rao');
});

test('Global Filter: Matches by assigned Sales Agent name', () => {
  const matchVikram = sampleLeads.filter((l) => matchesGlobalFilter(l, 'vikram'));
  assert.strictEqual(matchVikram.length, 2);
  assert.ok(matchVikram.every((l) => l.assignedTo?.name === 'Vikram Malhotra'));

  const matchPriya = sampleLeads.filter((l) => matchesGlobalFilter(l, 'Priya Patel'));
  assert.strictEqual(matchPriya.length, 1);
  assert.strictEqual(matchPriya[0].name, 'Deepika Rao');
});

test('Global Filter: Matches by workflow stage codes and human-readable names', () => {
  // Raw stage enum code
  const matchFollowUpCode = sampleLeads.filter((l) => matchesGlobalFilter(l, 'FOLLOW_UP'));
  assert.strictEqual(matchFollowUpCode.length, 1);

  // Friendly formatted label
  const matchMeetingFriendly = sampleLeads.filter((l) => matchesGlobalFilter(l, 'meeting plan'));
  assert.strictEqual(matchMeetingFriendly.length, 1);
  assert.strictEqual(matchMeetingFriendly[0].currentStage, 'MEETING_PLAN');

  const matchSiteVisit = sampleLeads.filter((l) => matchesGlobalFilter(l, 'site visit'));
  assert.strictEqual(matchSiteVisit.length, 1);
  assert.strictEqual(matchSiteVisit[0].currentStage, 'SITE_VISIT_PLAN');

  const matchDealDone = sampleLeads.filter((l) => matchesGlobalFilter(l, 'deal done'));
  assert.strictEqual(matchDealDone.length, 1);
  assert.strictEqual(matchDealDone[0].currentStage, 'DEAL_DONE');
});

test('Global Filter: Matches by follow-up date and "none scheduled"', () => {
  const todayFormatted = today.toLocaleDateString();
  const matchByDate = sampleLeads.filter((l) => matchesGlobalFilter(l, todayFormatted));
  assert.ok(matchByDate.length >= 1);
  assert.ok(matchByDate.some((l) => l.name === 'Aarav Sharma'));

  const matchNoneScheduled = sampleLeads.filter((l) => matchesGlobalFilter(l, 'none scheduled'));
  assert.strictEqual(matchNoneScheduled.length, 2);
  assert.ok(matchNoneScheduled.every((l) => !l.nextFollowUpDate));
});

test('Global Filter: Matches by project name, mobile, and remark', () => {
  // Project
  const matchProject = sampleLeads.filter((l) => matchesGlobalFilter(l, 'Skyline Towers'));
  assert.strictEqual(matchProject.length, 1);
  assert.strictEqual(matchProject[0].name, 'Aarav Sharma');

  // Mobile digits
  const matchMobile = sampleLeads.filter((l) => matchesGlobalFilter(l, '98111'));
  assert.strictEqual(matchMobile.length, 1);
  assert.strictEqual(matchMobile[0].name, 'Deepika Rao');

  // Remark
  const matchRemark = sampleLeads.filter((l) => matchesGlobalFilter(l, 'penthouse'));
  assert.strictEqual(matchRemark.length, 1);
  assert.strictEqual(matchRemark[0].name, 'Deepika Rao');
});

test('Global Filter: Empty or whitespace query restores all records', () => {
  assert.strictEqual(sampleLeads.filter((l) => matchesGlobalFilter(l, '')).length, 4);
  assert.strictEqual(sampleLeads.filter((l) => matchesGlobalFilter(l, '   ')).length, 4);
});

test('Date Range: isWithinPeriod accurately checks Today, This Week, and This Month', () => {
  assert.strictEqual(isWithinPeriod(todayIso, 'today'), true, 'Today ISO is within today');
  assert.strictEqual(isWithinPeriod(todayIso, 'week'), true, 'Today ISO is within this week');
  assert.strictEqual(isWithinPeriod(todayIso, 'month'), true, 'Today ISO is within this month');

  assert.strictEqual(isWithinPeriod(lastYearIso, 'today'), false, 'Past year is not today');
  assert.strictEqual(isWithinPeriod(lastYearIso, 'week'), false, 'Past year is not this week');
  assert.strictEqual(isWithinPeriod(lastYearIso, 'month'), false, 'Past year is not this month');

  assert.strictEqual(isWithinPeriod(undefined, 'today'), false, 'Undefined date returns false safely');
  assert.strictEqual(isWithinPeriod('invalid-date', 'today'), false, 'Malformed date returns false safely');
});

test('Date Range: matchesDatePeriod preserves demo mode and filters live leads', () => {
  const mockLead: NewLeadItem = { ...sampleLeads[0], isMockData: true, createdAt: lastYearIso };
  assert.strictEqual(matchesDatePeriod(mockLead, 'today'), true, 'Mock leads are preserved in all periods');

  const liveLeadToday: NewLeadItem = { ...sampleLeads[0], isMockData: false, createdAt: todayIso };
  assert.strictEqual(matchesDatePeriod(liveLeadToday, 'today'), true, 'Live lead created today matches today');

  const liveLeadOld: NewLeadItem = { ...sampleLeads[0], isMockData: false, createdAt: lastYearIso, nextFollowUpDate: undefined };
  assert.strictEqual(matchesDatePeriod(liveLeadOld, 'today'), false, 'Old lead without follow-up does not match today');
});

test('Table Filter: Filters by current workflow stage and respects ALL reset', () => {
  const filterState: TableFilterState = {
    stage: 'FOLLOW_UP',
    status: 'ALL',
    agent: 'ALL',
    followUp: 'ALL',
  };

  const followUpLeads = sampleLeads.filter((l) => matchesTableFilters(l, filterState));
  assert.strictEqual(followUpLeads.length, 1);
  assert.strictEqual(followUpLeads[0].currentStage, 'FOLLOW_UP');

  // Reset stage to ALL
  filterState.stage = 'ALL';
  const allLeads = sampleLeads.filter((l) => matchesTableFilters(l, filterState));
  assert.strictEqual(allLeads.length, 4, 'Resetting stage restores all records');
});

test('Table Filter: Filters by assigned agent', () => {
  const filterState: TableFilterState = {
    stage: 'ALL',
    status: 'ALL',
    agent: 'Vikram Malhotra',
    followUp: 'ALL',
  };

  const vikramLeads = sampleLeads.filter((l) => matchesTableFilters(l, filterState));
  assert.strictEqual(vikramLeads.length, 2);
  assert.ok(vikramLeads.every((l) => l.assignedTo?.name === 'Vikram Malhotra'));
});

test('Table Filter: Filters by follow-up status (SCHEDULED vs NONE)', () => {
  const scheduledFilter: TableFilterState = {
    stage: 'ALL',
    status: 'ALL',
    agent: 'ALL',
    followUp: 'SCHEDULED',
  };
  const scheduled = sampleLeads.filter((l) => matchesTableFilters(l, scheduledFilter));
  assert.strictEqual(scheduled.length, 2);
  assert.ok(scheduled.every((l) => Boolean(l.nextFollowUpDate)));

  const noneFilter: TableFilterState = {
    ...scheduledFilter,
    followUp: 'NONE',
  };
  const noneScheduled = sampleLeads.filter((l) => matchesTableFilters(l, noneFilter));
  assert.strictEqual(noneScheduled.length, 2);
  assert.ok(noneScheduled.every((l) => !l.nextFollowUpDate));
});

test('Combined Filtering: Date range, global search, and table filter compose seamlessly', () => {
  // 1. Period: Month
  const inMonth = sampleLeads.filter((l) => matchesDatePeriod(l, 'month'));

  // 2. Global search: "Vikram"
  const vikramInMonth = inMonth.filter((l) => matchesGlobalFilter(l, 'Vikram'));
  assert.strictEqual(vikramInMonth.length, 2);

  // 3. Table filter: Stage FOLLOW_UP
  const tableFilter: TableFilterState = {
    stage: 'FOLLOW_UP',
    status: 'ALL',
    agent: 'ALL',
    followUp: 'ALL',
  };
  const combined = vikramInMonth.filter((l) => matchesTableFilters(l, tableFilter));
  assert.strictEqual(combined.length, 1);
  assert.strictEqual(combined[0].name, 'Aarav Sharma');

  // 4. Clearing table filter restores the 2 leads from Vikram in month
  tableFilter.stage = 'ALL';
  const afterReset = vikramInMonth.filter((l) => matchesTableFilters(l, tableFilter));
  assert.strictEqual(afterReset.length, 2);
});

test('UI File Invariants: SalesDashboardPage has functional global filter input with clear button and period integration', () => {
  const pagePath = path.join(__dirname, '../src/features/sales-dashboard/SalesDashboardPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'SalesDashboardPage.tsx exists');
  const content = fs.readFileSync(pagePath, 'utf-8');

  // Input must NOT be read-only or placeholder modal click
  assert.ok(!content.includes('readOnly'), 'Input is not readOnly');
  assert.ok(!content.includes('onShowPlaceholderNotice("Current View Filter")'), 'Removed placeholder modal for global filter');

  // Controlled input with onChange and state
  assert.ok(content.includes('globalFilterText'), 'Binds globalFilterText state');
  assert.ok(content.includes('setGlobalFilterText'), 'Updates globalFilterText on change');
  assert.ok(content.includes('Filter current view...'), 'Preserves placeholder text');

  // Clear button
  assert.ok(content.includes('Clear filter'), 'Provides clear filter button');

  // Date range and global filter composition
  assert.ok(content.includes('matchesDatePeriod'), 'Filters by selected date period');
  assert.ok(content.includes('matchesGlobalFilter'), 'Filters by global search criteria');
  assert.ok(content.includes('filteredDashboardLeads'), 'Passes filtered leads to NewLeadTable');
});

test('UI File Invariants: NewLeadTable implements interactive filter panel, counts, and reset button', () => {
  const tablePath = path.join(__dirname, '../src/features/sales-dashboard/components/NewLeadTable.tsx');
  assert.ok(fs.existsSync(tablePath), 'NewLeadTable.tsx exists');
  const content = fs.readFileSync(tablePath, 'utf-8');

  // Must NOT trigger placeholder notice on Filter button click
  assert.ok(!content.includes("onShowNotice('New Lead Filter')"), 'Removed placeholder notice for New Lead Filter');

  // Toggle state
  assert.ok(content.includes('isFilterPanelOpen'), 'Manages isFilterPanelOpen toggle state');

  // Supported filter criteria dropdowns
  assert.ok(content.includes('filter-lead-stage'), 'Provides stage filter control');
  assert.ok(content.includes('filter-lead-status'), 'Provides status filter control');
  assert.ok(content.includes('filter-lead-agent'), 'Provides assigned agent filter control');
  assert.ok(content.includes('filter-lead-followup'), 'Provides follow-up date filter control');

  // Reset / Clear option
  assert.ok(content.includes('handleResetFilters') || content.includes('Reset Filters'), 'Provides reset filters option');

  // Dynamic pagination and count badge
  assert.ok(content.includes('displayedLeads.length'), 'Enquiry badge and footer count reflect displayedLeads.length');

  // Role-aware Assigned Agent filter visibility: Hidden for Sales users, preserved for Admin/Manager
  assert.ok(content.includes('isSalesUser'), 'Determines isSalesUser to conditionally display Assigned Agent filter');
  assert.ok(content.includes('!isSalesUser &&'), 'Guards Assigned Agent filter dropdown with !isSalesUser check');
});

test('UI Invariants: Assigned Agent filter removed from Sales Dashboard and Sales Leads page', () => {
  const salesDashboardPath = path.join(__dirname, '../src/features/sales-dashboard/SalesDashboardPage.tsx');
  assert.ok(fs.existsSync(salesDashboardPath), 'SalesDashboardPage.tsx exists');
  const salesDashboardContent = fs.readFileSync(salesDashboardPath, 'utf-8');
  assert.ok(salesDashboardContent.includes('hideAgentFilter={true}'), 'SalesDashboardPage explicitly hides Assigned Agent filter');

  const leadsPagePath = path.join(__dirname, '../src/features/leads/LeadsPage.tsx');
  assert.ok(fs.existsSync(leadsPagePath), 'LeadsPage.tsx exists');
  const leadsPageContent = fs.readFileSync(leadsPagePath, 'utf-8');
  assert.ok(leadsPageContent.includes("hideAgentFilter={currentUser.role === 'SALES'}"), 'LeadsPage hides Assigned Agent filter strictly for SALES role');
});
