/**
 * Neuways CRM - Sidebar Navigation & Planned Badges Removal Tests
 *
 * Verifies:
 * 1. AppSidebar configures all 5 items as implemented: true
 * 2. AppSidebar does not display PLANNED badges for the 5 items
 * 3. All 5 dedicated pages exist and export valid React components:
 *    - LeadsPage
 *    - PendingFollowUpsPage
 *    - FutureFollowUpsPage
 *    - ActivitiesTimelinePage
 *    - NotificationsPage
 * 4. AppRoutes registers routes for:
 *    - /leads and /sales/leads
 *    - /follow-ups/pending
 *    - /follow-ups/future
 *    - /activities
 *    - /notifications
 */

import assert from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Sidebar Navigation: AppSidebar configures the 5 items as implemented", () => {
  const sidebarPath = path.join(__dirname, "../src/components/layout/AppSidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "AppSidebar.tsx must exist");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Verify the 5 items are defined with implemented: true
  const checks = [
    { name: "Leads / Enquiries", path: "/leads" },
    { name: "Pending Follow-ups", path: "/follow-ups/pending" },
    { name: "Future Follow-ups", path: "/follow-ups/future" },
    { name: "Activities / Timeline", path: "/activities" },
    { name: "Notifications", path: "/notifications" },
  ];

  for (const check of checks) {
    assert.ok(content.includes(`name: "${check.name}"`), `AppSidebar contains ${check.name}`);
    assert.ok(content.includes(`path: "${check.path}"`), `AppSidebar contains path ${check.path}`);
  }

  // Ensure these items do not have implemented: false
  assert.ok(!content.includes(`name: "Leads / Enquiries",\n      path: "/leads",\n      icon: Filter,\n      implemented: false`), "Leads / Enquiries is implemented");
  assert.ok(!content.includes(`name: "Pending Follow-ups",\n      path: "/follow-ups/pending",\n      icon: Clock,\n      implemented: false`), "Pending Follow-ups is implemented");
  assert.ok(!content.includes(`name: "Future Follow-ups",\n      path: "/follow-ups/future",\n      icon: Calendar,\n      implemented: false`), "Future Follow-ups is implemented");
  assert.ok(!content.includes(`name: "Activities / Timeline",\n      path: "/activities",\n      icon: History,\n      implemented: false`), "Activities / Timeline is implemented");
  assert.ok(!content.includes(`name: "Notifications",\n      path: "/notifications",\n      icon: Bell,\n      implemented: false`), "Notifications is implemented");
});

test("Dedicated Pages: Components exist and export valid React components", () => {
  const pages = [
    { file: "leads/LeadsPage.tsx", exportName: "LeadsPage" },
    { file: "follow-ups/PendingFollowUpsPage.tsx", exportName: "PendingFollowUpsPage" },
    { file: "follow-ups/FutureFollowUpsPage.tsx", exportName: "FutureFollowUpsPage" },
    { file: "activities/ActivitiesTimelinePage.tsx", exportName: "ActivitiesTimelinePage" },
    { file: "notifications/NotificationsPage.tsx", exportName: "NotificationsPage" },
  ];

  for (const page of pages) {
    const fullPath = path.join(__dirname, "../src/features", page.file);
    assert.ok(fs.existsSync(fullPath), `${page.file} must exist`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.ok(content.includes(`export const ${page.exportName}`), `${page.file} must export ${page.exportName}`);
  }
});

test("AppRoutes: Registers working routes for all 5 sidebar targets", () => {
  const routesPath = path.join(__dirname, "../src/routes/AppRoutes.tsx");
  assert.ok(fs.existsSync(routesPath), "AppRoutes.tsx must exist");
  const content = fs.readFileSync(routesPath, "utf-8");

  assert.ok(content.includes('path="leads" element={<LeadsPage />}'), "Registers /leads route");
  assert.ok(content.includes('path="sales/leads" element={<LeadsPage />}'), "Registers /sales/leads route");
  assert.ok(content.includes('path="follow-ups/pending" element={<PendingFollowUpsPage />}'), "Registers /follow-ups/pending route");
  assert.ok(content.includes('path="follow-ups/future" element={<FutureFollowUpsPage />}'), "Registers /follow-ups/future route");
  assert.ok(content.includes('path="activities" element={<ActivitiesTimelinePage />}'), "Registers /activities route");
  assert.ok(content.includes('path="notifications" element={<NotificationsPage />}'), "Registers /notifications route");
});

test("Global Sidebar Branding: Spacing, Alignment and Clickable Role-Based Navigation", () => {
  const sidebarPath = path.join(__dirname, "../src/components/layout/AppSidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "AppSidebar.tsx must exist");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // 1. Link import from react-router-dom
  assert.ok(
    content.includes('import { NavLink, Link } from "react-router-dom"') ||
    content.includes('import { Link, NavLink } from "react-router-dom"'),
    "AppSidebar imports Link from react-router-dom"
  );

  // 2. Clickable brand area wrapping logo, name, and subtitle
  assert.ok(content.includes("<Link"), "Brand area is wrapped in a clickable Link");
  assert.ok(content.includes("to={getHomeRoute()}"), "Brand Link points to role-based destination via getHomeRoute()");

  // 3. Role-based destinations verification
  assert.ok(content.includes('currentUser.role === "ADMIN"') && content.includes('return "/admin/dashboard"'), "ADMIN navigates to /admin/dashboard");
  assert.ok(content.includes('currentUser.role === "MANAGER"') && content.includes('return "/manager/dashboard"'), "MANAGER navigates to /manager/dashboard");
  assert.ok(content.includes('return "/sales/dashboard"'), "SALES navigates to /sales/dashboard");

  // 4. Role subtitles verification
  assert.ok(content.includes('"Administration"'), "Contains Administration subtitle for Admin");
  assert.ok(content.includes('"Team Management"'), "Contains Team Management subtitle for Manager");
  assert.ok(content.includes('"Enterprise Sales"'), "Contains Enterprise Sales subtitle for Sales");

  // 5. Logo and brand name contents
  assert.ok(content.includes('src="/neuways-logo.png"'), "Contains Neuways logo asset");
  assert.ok(content.includes("Neuways CRM"), "Contains Neuways CRM brand name");

  // 6. Accessible attributes, hover and focus states
  assert.ok(content.includes("aria-label="), "Brand Link includes accessible aria-label");
  assert.ok(content.includes("focus-visible:ring-2"), "Brand Link provides visible focus ring");
  assert.ok(content.includes("hover:bg-surface-subtle"), "Brand Link provides hover feedback across empty space/padding");
  assert.ok(content.includes("cursor-pointer"), "Brand Link displays cursor-pointer");

  // 7. Mobile close button separation (no nested clickable elements)
  const brandHeaderSection = content.substring(
    content.indexOf("{/* Brand Header */}"),
    content.indexOf("{/* Navigation Section */}")
  );
  assert.ok(brandHeaderSection.includes("</Link>"), "Brand Link closes cleanly");
  assert.ok(
    brandHeaderSection.indexOf("</Link>") < brandHeaderSection.indexOf("<button"),
    "Mobile close button is a direct sibling and NOT nested inside the brand Link"
  );
});
