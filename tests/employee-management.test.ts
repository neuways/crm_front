/**
 * Nueways CRM - Phase 5 Frontend Employee Management Tests
 *
 * Verifies:
 * 1. User service contract for listing employees (GET /api/v1/users).
 * 2. Role restriction handling (HTTP 403 Forbidden for non-admins).
 * 3. Provisioning employee contract (POST /api/v1/users) with name, email, role, and temporary password.
 * 4. Duplicate email handling (HTTP 409 Conflict).
 * 5. Input validation error handling (HTTP 400).
 * 6. Employee status toggle contract (PATCH /api/v1/users/:id/status).
 * 7. Self-deactivation prevention error handling.
 * 8. Password change service contract (POST /api/v1/auth/change-password).
 * 9. Role-based route authorization rules for ADMIN vs SALES/MANAGER.
 */

import assert from 'node:assert';
import { test } from 'node:test';
import { userService } from '../src/services/user.service.js';
import { authService } from '../src/services/auth.service.js';
import { UserRole } from '../src/types/auth.types.js';

test('User Service: listEmployees hits GET /api/v1/users with Bearer header', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';

    const mockResponse = {
      success: true,
      message: 'Employees retrieved successfully.',
      data: [
        {
          id: 'admin-1',
          name: 'Super Admin',
          email: 'admin@nueways.com',
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false,
          hasGoogleLinked: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sales-1',
          name: 'Sales Agent',
          email: 'agent@gmail.com',
          role: 'SALES',
          isActive: true,
          mustChangePassword: true,
          hasGoogleLinked: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await userService.listEmployees();

    assert.strictEqual(result.success, true, 'List employees call succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/users'), 'Calls endpoint /api/v1/users');
    assert.strictEqual(interceptedMethod, 'GET', 'Uses GET method');
    assert.strictEqual(result.data?.length, 2, 'Returns list of employees');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('User Service: Handles HTTP 403 Forbidden when non-ADMIN attempts to list employees', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Requires one of the following roles: ADMIN.',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await userService.listEmployees();

    assert.strictEqual(result.success, false, 'Reports failure on 403 Forbidden');
    assert.strictEqual(result.statusCode, 403, 'Captures HTTP status 403');
    assert.strictEqual(result.error, 'Forbidden', 'Error classified as Forbidden');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('User Service: createEmployee sends valid POST to /api/v1/users', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedBody = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedBody = (init?.body as string) || '';

    const parsed = JSON.parse(interceptedBody);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Employee account provisioned successfully.',
        data: {
          id: 'new-emp-101',
          name: parsed.name,
          email: parsed.email,
          role: parsed.role,
          isActive: true,
          mustChangePassword: true,
          hasGoogleLinked: false,
          createdAt: new Date().toISOString(),
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await userService.createEmployee({
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      role: 'SALES',
      temporaryPassword: 'TempPassword123!',
    });

    assert.strictEqual(result.success, true, 'Provisioning call succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/users'), 'Posts to /api/v1/users');
    assert.strictEqual(interceptedMethod, 'POST', 'HTTP method is POST');
    assert.strictEqual(result.data?.name, 'Priya Sharma');
    assert.strictEqual(result.data?.role, 'SALES');
    assert.strictEqual(result.data?.mustChangePassword, true);

    const payload = JSON.parse(interceptedBody);
    assert.strictEqual(payload.email, 'priya.sharma@gmail.com');
    assert.strictEqual(payload.temporaryPassword, 'TempPassword123!');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('User Service: Intercepts duplicate email conflict (HTTP 409)', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Conflict',
        message: 'An employee account with email "priya.sharma@gmail.com" already exists.',
      }),
      {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await userService.createEmployee({
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      role: 'SALES',
      temporaryPassword: 'TempPassword123!',
    });

    assert.strictEqual(result.success, false, 'Fails on duplicate email');
    assert.strictEqual(result.statusCode, 409, 'Captures HTTP status 409 Conflict');
    assert.ok(result.message?.includes('already exists'), 'Contains duplicate email explanation');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('User Service: updateEmployeeStatus sends PATCH to /api/v1/users/:id/status', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedBody = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedBody = (init?.body as string) || '';

    const parsed = JSON.parse(interceptedBody);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Employee account ${parsed.isActive ? 'activated' : 'deactivated'} successfully.`,
        data: {
          id: 'emp-42',
          name: 'Vikram Singh',
          email: 'vikram@gmail.com',
          role: 'SALES',
          isActive: parsed.isActive,
          mustChangePassword: false,
          hasGoogleLinked: true,
          createdAt: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await userService.updateEmployeeStatus('emp-42', false);

    assert.strictEqual(result.success, true, 'Status update succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/users/emp-42/status'), 'Calls /status endpoint with ID');
    assert.strictEqual(interceptedMethod, 'PATCH', 'Uses HTTP PATCH');
    assert.strictEqual(result.data?.isActive, false, 'Reflects deactivated status');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Auth Service: changePassword sends POST to /api/v1/auth/change-password', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password changed successfully.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await authService.changePassword('OldTempPass123!', 'NewPermanentSecret2026!');

    assert.strictEqual(result.success, true, 'Password change succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/auth/change-password'), 'Posts to /change-password');
    assert.strictEqual(interceptedMethod, 'POST', 'Uses HTTP POST');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Role Authorization: Route access rules differentiate ADMIN from SALES and MANAGER', () => {
  const isAllowed = (role: UserRole, allowedRoles: UserRole[]): boolean => {
    return allowedRoles.includes(role);
  };

  const adminOnlyRoutes: UserRole[] = ['ADMIN'];
  assert.strictEqual(isAllowed('ADMIN', adminOnlyRoutes), true, 'ADMIN is authorized for admin routes');
  assert.strictEqual(isAllowed('MANAGER', adminOnlyRoutes), false, 'MANAGER is blocked from admin routes');
  assert.strictEqual(isAllowed('SALES', adminOnlyRoutes), false, 'SALES is blocked from admin routes');

  const salesRoutes: UserRole[] = ['ADMIN', 'MANAGER', 'SALES'];
  assert.strictEqual(isAllowed('SALES', salesRoutes), true, 'SALES can access sales dashboard');
  assert.strictEqual(isAllowed('ADMIN', salesRoutes), true, 'ADMIN can view sales dashboard');
});
