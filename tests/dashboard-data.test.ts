/**
 * Neuways CRM - Frontend Foundation & Sales Dashboard Invariant Tests
 *
 * Verifies design tokens, exact company dashboard structure, KPI metrics,
 * and data invariants following the review corrections.
 */

import assert from "node:assert";
import { test } from "node:test";
import { lightTheme } from "../src/theme/theme.js";
import {
  mockKpiMetrics,
  mockNewLeads,
  mockPendingFollowUps,
  mockFutureFollowUps,
  mockLeadQualification,
} from "../src/features/sales-dashboard/data/mockDashboardData.js";

test("Theme Tokens: Complete centralized token definitions", () => {
  assert.strictEqual(
    lightTheme.primary,
    "#2563eb",
    "Primary brand color is #2563eb",
  );
  assert.strictEqual(
    lightTheme.pageBg,
    "#f8fafc",
    "Page canvas background is #f8fafc",
  );
  assert.strictEqual(lightTheme.cardBg, "#ffffff", "Card surface is #ffffff");
  assert.strictEqual(
    lightTheme.textPrimary,
    "#0f172a",
    "Text primary is high-contrast #0f172a",
  );
  assert.ok(lightTheme.border, "Border token is defined");
  assert.ok(lightTheme.success, "Success token is defined");
  assert.ok(lightTheme.warning, "Warning token is defined");
  assert.ok(lightTheme.danger, "Danger token is defined");
});

test("KPI Cards: 4 distinct metrics reflecting Stitch layout", () => {
  assert.strictEqual(mockKpiMetrics.length, 4, "Exactly 4 KPI cards exist");

  const [card1, card2, card3, card4] = mockKpiMetrics;

  // Card 1: Daily Velocity
  assert.strictEqual(card1.subtitle, "Daily Velocity");
  assert.strictEqual(card1.title, "New enquiries");
  assert.strictEqual(card1.value, 7);
  assert.strictEqual(card1.isMockData, true, "Explicitly marked as mock data");

  // Card 2: Action Pipeline
  assert.strictEqual(card2.subtitle, "Action Pipeline");
  assert.strictEqual(card2.title, "Pending follow-ups");
  assert.strictEqual(card2.value, 85);
  assert.strictEqual(card2.isMockData, true);

  // Card 3: Calendar Bookings
  assert.strictEqual(card3.subtitle, "Calendar Bookings");
  assert.strictEqual(card3.title, "Scheduled future calls");
  assert.strictEqual(card3.value, 74);
  assert.strictEqual(card3.isMockData, true);

  // Card 4: Portfolio Scope
  assert.strictEqual(card4.subtitle, "Portfolio Scope");
  assert.strictEqual(card4.title, "Total active lead pipeline");
  assert.strictEqual(card4.value, 269);
  assert.strictEqual(card4.isMockData, true);
});

test("Section 1: New Lead table structure & phone privacy", () => {
  assert.strictEqual(mockNewLeads.length, 5, "Contains 5 demonstration leads");

  mockNewLeads.forEach((lead) => {
    assert.ok(lead.srNo, "Has sequential serial number");
    assert.ok(lead.name, "Has contact name");
    assert.ok(lead.initials, "Has avatar initials");
    assert.ok(lead.price, "Has price estimate");
    assert.ok(lead.remark, "Has initial remark");
    // Verify phone privacy masking: Never expose full phone number
    assert.ok(
      lead.mobile.includes("••"),
      `Phone number ${lead.mobile} must be privacy-masked`,
    );
  });
});

test("Section 2: Pending Follow-up preserves exact columns without invented names", () => {
  assert.strictEqual(
    mockPendingFollowUps.stages.length,
    3,
    "Contains 3 stages",
  );

  const expectedStages = ["Stage 1", "Stage 2", "Stage 3"];
  mockPendingFollowUps.stages.forEach((s, idx) => {
    assert.strictEqual(
      s.stage,
      expectedStages[idx],
      "Stage label is neutral, no invented names",
    );
    assert.ok(typeof s.contacted === "number", "Has contacted metric");
    assert.ok(typeof s.detailShared === "number", "Has detailShared metric");
    assert.ok(typeof s.meeting === "number", "Has meeting metric");
    assert.ok(typeof s.siteVisit === "number", "Has siteVisit metric");
  });

  // Verify no unrequested totals object exists on pending follow-up
  assert.strictEqual(
    (mockPendingFollowUps as any).totals,
    undefined,
    "No unrequested summary totals object",
  );
});

test("Section 3: Future Follow-up preserves exact columns without invented names", () => {
  assert.strictEqual(
    mockFutureFollowUps.stages.length,
    3,
    "Contains 3 scheduled stages",
  );

  const expectedStages = ["Stage 1", "Stage 2", "Stage 3"];
  mockFutureFollowUps.stages.forEach((s, idx) => {
    assert.strictEqual(
      s.stage,
      expectedStages[idx],
      "Stage label is neutral, no invented names",
    );
    assert.ok(typeof s.contacted === "number", "Has contacted metric");
    assert.ok(typeof s.detailShared === "number", "Has detailShared metric");
  });

  // Verify no unrequested totals object exists on future follow-up
  assert.strictEqual(
    (mockFutureFollowUps as any).totals,
    undefined,
    "No unrequested summary totals object",
  );
});

test("Section 4: Lead Qualification Matrix exact percentages & Hot/Poss. labels", () => {
  const matrix = mockLeadQualification;

  // Exact 6 percentage columns
  const expectedPercentages = ["10%", "20%", "50%", "70%", "80%", "100%"];
  assert.deepStrictEqual(
    matrix.percentages,
    expectedPercentages,
    "Preserves exact 6 percentage columns including 80%",
  );

  // Hot row
  assert.strictEqual(
    matrix.hotRow.values.length,
    6,
    "Hot row has exactly 6 percentage cells",
  );
  assert.deepStrictEqual(matrix.hotRow.values, [12, 18, 24, 31, 19, 15]);

  // Poss. row
  assert.strictEqual(
    matrix.possRow.values.length,
    6,
    "Poss. row has exactly 6 percentage cells",
  );
  assert.deepStrictEqual(matrix.possRow.values, [28, 34, 42, 22, 16, 8]);

  // Verify no unrequested Total column or summary pool row
  assert.strictEqual(
    (matrix as any).hotRow.total,
    undefined,
    "No extra Total column on Hot row",
  );
  assert.strictEqual(
    (matrix as any).possRow.total,
    undefined,
    "No extra Total column on Poss row",
  );
  assert.strictEqual(
    (matrix as any).totalPool,
    undefined,
    "No unrequested summary pool row",
  );
});
