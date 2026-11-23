import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { AuthorizedLandingPage } from '../features/auth/AuthorizedLandingPage.js';
import { SalesDashboardPage } from '../features/sales-dashboard/SalesDashboardPage.js';
import { LeadWorkflowPage } from '../features/sales-dashboard/LeadWorkflowPage.js';
import { CompletedDealsPage } from '../features/sales-dashboard/CompletedDealsPage.js';
import { CompletedDealDetailPage } from '../features/sales-dashboard/CompletedDealDetailPage.js';
import { EmployeeManagementPage } from '../features/admin/EmployeeManagementPage.js';
import { AddEmployeePage } from '../features/admin/AddEmployeePage.js';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage.js';
import { ManagerDashboardPage } from '../features/manager/ManagerDashboardPage.js';
import { ManagerTeamPage } from '../features/manager/ManagerTeamPage.js';
import { LeadsPage } from '../features/leads/LeadsPage.js';
import { PendingFollowUpsPage } from '../features/follow-ups/PendingFollowUpsPage.js';
import { FutureFollowUpsPage } from '../features/follow-ups/FutureFollowUpsPage.js';
import { ActivitiesTimelinePage } from '../features/activities/ActivitiesTimelinePage.js';
import { NotificationsPage } from '../features/notifications/NotificationsPage.js';
import { DuplicateDataPage } from '../features/duplicate-data/DuplicateDataPage.js';
import { BulkUploadPage } from '../features/bulk-upload/BulkUploadPage.js';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isDemoMode, user } = useAuth();

  // Root redirect destination for authenticated employees
  const getRootDestination = () => {
    if (user?.role === 'ADMIN') {
      return '/admin/dashboard';
    }
    if (user?.role === 'MANAGER') {
      return '/manager/dashboard';
    }
    return '/sales/dashboard';
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getRootDestination()} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Authorized Landing for ADMIN and MANAGER */}
      <Route
        path="/authorized-landing"
        element={
          <ProtectedRoute>
            <AuthorizedLandingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected App Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Index & Generic Dashboard Redirects */}
        <Route index element={<Navigate to={getRootDestination()} replace />} />
        <Route path="dashboard" element={<Navigate to={getRootDestination()} replace />} />

        {/* Sales Agent Dashboard Route */}
        <Route path="sales/dashboard" element={<SalesDashboardPage />} />

        {/* Dedicated Lead Sequential Workflow Page Route */}
        <Route path="sales/leads/:leadId/workflow" element={<LeadWorkflowPage />} />
        <Route path="leads/:leadId/workflow" element={<LeadWorkflowPage />} />

        {/* Completed Deals Register Routes */}
        <Route path="sales/completed-deals" element={<CompletedDealsPage />} />
        <Route path="sales/completed-deals/:dealId" element={<CompletedDealDetailPage />} />

        {/* Pipeline Navigation Routes */}
        <Route path="leads" element={<LeadsPage />} />
        <Route path="sales/leads" element={<LeadsPage />} />
        <Route path="follow-ups/pending" element={<PendingFollowUpsPage />} />
        <Route path="follow-ups/future" element={<FutureFollowUpsPage />} />
        <Route path="activities" element={<ActivitiesTimelinePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="duplicate-data" element={<DuplicateDataPage />} />
        <Route path="duplicates" element={<DuplicateDataPage />} />
        <Route path="bulk-upload" element={<BulkUploadPage />} />
        <Route path="sales/bulk-upload" element={<BulkUploadPage />} />

        {/* Admin Dashboard & Management Routes (ADMIN only) */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/overview"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/employees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <EmployeeManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/employees/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AddEmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/leads"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LeadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/leads/:leadId/workflow"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LeadWorkflowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/completed-deals"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CompletedDealsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/completed-deals/:dealId"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CompletedDealDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/activities"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ActivitiesTimelinePage />
            </ProtectedRoute>
          }
        />

        {/* Manager Dashboard & Team Management Routes (MANAGER only) */}
        <Route
          path="manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/overview"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/team"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerTeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/leads"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <LeadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/leads/:leadId/workflow"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <LeadWorkflowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/follow-ups/pending"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <PendingFollowUpsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/follow-ups/future"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <FutureFollowUpsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/completed-deals"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <CompletedDealsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/completed-deals/:dealId"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <CompletedDealDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/rejected-deals"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <LeadsPage defaultTab="REJECTED" />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/activities"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ActivitiesTimelinePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/activities/:leadId"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ActivitiesTimelinePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route
          path="*"
          element={
            isAuthenticated || isDemoMode ? (
              <Navigate to={getRootDestination()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Route>
    </Routes>
  );
};
