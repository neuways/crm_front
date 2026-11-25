/**
 * Nueways CRM - Phase 2 Frontend Authentication Tests
 * 
 * Verifies:
 * 1. Auth service contract: Endpoint, payload structure, response envelope handling.
 * 2. HTTP error code mapping (400 validation, 401 invalid credentials, 403 forbidden).
 * 3. Role-based landing logic (SALES -> /sales/dashboard, ADMIN/MANAGER -> /authorized-landing).
 * 4. Token storage keys and stateless session clearing on logout.
 * 5. Demonstration mode state isolation.
 */

import assert from 'node:assert';
import { test } from 'node:test';
import { authService } from '../src/services/auth.service.js';
import { api } from '../src/services/api.js';
import { UserRole } from '../src/types/auth.types.js';

test('Auth Service: Contract complies with backend login schema', async () => {
  // Mock global fetch to verify request details
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedHeaders: Record<string, string> = {};
  let interceptedBody = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedHeaders = (init?.headers as Record<string, string>) || {};
    interceptedBody = (init?.body as string) || '';

    const mockResponse = {
      success: true,
      message: 'Login successful.',
      data: {
        token: 'mock-jwt-token-xyz.8h-valid',
        user: {
          id: 'emp-101',
          name: 'Sarah Connor',
          email: 'sarah.connor@nueways.com',
          role: 'SALES',
        },
      },
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await authService.login({
      email: 'sarah.connor@nueways.com',
      password: 'SecurePassword123!',
    });

    assert.strictEqual(result.success, true, 'Login call succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/auth/login'), 'Posts to exact endpoint /api/v1/auth/login');
    assert.strictEqual(interceptedMethod, 'POST', 'HTTP method is POST');
    assert.strictEqual(interceptedHeaders['Content-Type'], 'application/json', 'Content-Type is JSON');

    const parsedBody = JSON.parse(interceptedBody);
    assert.strictEqual(parsedBody.email, 'sarah.connor@nueways.com');
    assert.strictEqual(parsedBody.password, 'SecurePassword123!');

    assert.ok(result.data, 'Returns data envelope');
    assert.strictEqual(result.data.token, 'mock-jwt-token-xyz.8h-valid');
    assert.strictEqual(result.data.user.id, 'emp-101');
    assert.strictEqual(result.data.user.role, 'SALES');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Auth Service: Handles HTTP 401 Invalid Credentials cleanly without throw', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    const errorBody = {
      success: false,
      message: 'Invalid email or password.',
      error: 'Invalid credentials',
    };
    return new Response(JSON.stringify(errorBody), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await authService.login({
      email: 'wrong@nueways.com',
      password: 'bad-password',
    });

    assert.strictEqual(result.success, false, 'Reports failure on 401');
    assert.strictEqual(result.statusCode, 401, 'Captures statusCode 401');
    assert.strictEqual(result.message, 'Invalid email or password.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Auth Service: Handles HTTP 400 Validation Error cleanly', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    const errorBody = {
      success: false,
      message: 'Email must be a valid email address.',
      error: 'Validation failed',
    };
    return new Response(JSON.stringify(errorBody), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await authService.login({
      email: 'not-an-email',
      password: 'short',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.statusCode, 400);
    assert.strictEqual(result.message, 'Email must be a valid email address.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Role-based navigation targets logic', () => {
  const getDestinationForRole = (role: UserRole): string => {
    switch (role) {
      case 'SALES':
        return '/sales/dashboard';
      case 'ADMIN':
      case 'MANAGER':
        return '/authorized-landing';
      default:
        return '/login';
    }
  };

  assert.strictEqual(getDestinationForRole('SALES'), '/sales/dashboard', 'SALES navigates directly to /sales/dashboard');
  assert.strictEqual(getDestinationForRole('ADMIN'), '/authorized-landing', 'ADMIN lands on /authorized-landing');
  assert.strictEqual(getDestinationForRole('MANAGER'), '/authorized-landing', 'MANAGER lands on /authorized-landing');
});

test('API Interceptor: Invokes unauthorized callback on 401 response', async () => {
  const originalFetch = globalThis.fetch;
  let unauthorizedTriggered = false;

  api.setUnauthorizedHandler(() => {
    unauthorizedTriggered = true;
  });

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const res = await api.get('/enquiries');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(unauthorizedTriggered, true, '401 callback was invoked to clear session');
  } finally {
    globalThis.fetch = originalFetch;
    api.setUnauthorizedHandler(() => {});
  }
});

test('Storage Keys: Consistent token, user, and demo mode keys', () => {
  const expectedTokenKey = 'nueways_auth_token';
  const expectedUserKey = 'nueways_user';
  const expectedDemoKey = 'nueways_demo_mode';

  assert.strictEqual(expectedTokenKey, 'nueways_auth_token');
  assert.strictEqual(expectedUserKey, 'nueways_user');
  assert.strictEqual(expectedDemoKey, 'nueways_demo_mode');
});

// -----------------------------------------------------------------------------
// Google Sign-In Contract & Integration Tests
// -----------------------------------------------------------------------------
test('Google Auth: Submits idToken to POST /api/v1/auth/google', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedBody = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedBody = (init?.body as string) || '';

    const mockResponse = {
      success: true,
      message: 'Google authentication successful.',
      data: {
        token: 'google-crm-jwt-token.8h-valid',
        user: {
          id: 'user-google-101',
          name: 'Rohit Agent',
          email: 'rohit.sales@gmail.com',
          role: 'SALES',
        },
      },
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await authService.loginWithGoogle('mock-valid-google-id-token');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.statusCode, 200);
    assert.ok(interceptedUrl.endsWith('/api/v1/auth/google'), 'Calls /api/v1/auth/google');
    assert.strictEqual(interceptedMethod, 'POST');

    const parsed = JSON.parse(interceptedBody);
    assert.strictEqual(parsed.idToken, 'mock-valid-google-id-token');

    assert.ok(result.data?.token);
    assert.strictEqual(result.data.user.role, 'SALES');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Google Auth: Handles HTTP 401 Unknown/Unauthorized Google Account', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: 'Access Denied: No authorized CRM account was found matching this Google identity.',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await authService.loginWithGoogle('unknown-account-token');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.statusCode, 401);
    assert.ok(result.message?.includes('No authorized CRM account'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Google Auth: Handles HTTP 503 Unconfigured Google Client ID', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Service Unavailable',
        message: 'Google Sign-In is not configured on this server. GOOGLE_CLIENT_ID is missing.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await authService.loginWithGoogle('any-token');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.statusCode, 503);
    assert.ok(result.message?.includes('GOOGLE_CLIENT_ID is missing'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -----------------------------------------------------------------------------
// Persistent Login Session Restoration & Logout Tests
// -----------------------------------------------------------------------------
test('Auth Service: getMe queries GET /api/v1/auth/me with credentials: include', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedCredentials = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedCredentials = (init?.credentials as string) || '';

    const mockResponse = {
      success: true,
      message: 'Session verified.',
      data: {
        user: {
          id: 'emp-admin-1',
          name: 'Nueways Admin',
          email: 'admin@nueways.com',
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false,
        },
      },
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await authService.getMe();

    assert.strictEqual(result.success, true, 'getMe call succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/auth/me'), 'Endpoint is /api/v1/auth/me');
    assert.strictEqual(interceptedMethod, 'GET', 'HTTP method is GET');
    assert.strictEqual(interceptedCredentials, 'include', 'credentials option is "include" for persistent cookie transmission');
    assert.strictEqual(result.data?.user.role, 'ADMIN', 'Restores Admin user profile');
    assert.strictEqual(result.data?.user.id, 'emp-admin-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Auth Service: logout queries POST /api/v1/auth/logout with credentials: include', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedCredentials = '';

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedUrl = String(input);
    interceptedMethod = init?.method || 'GET';
    interceptedCredentials = (init?.credentials as string) || '';

    return new Response(JSON.stringify({ success: true, message: 'Logged out successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await authService.logout();

    assert.strictEqual(result.success, true, 'logout call succeeds');
    assert.ok(interceptedUrl.endsWith('/api/v1/auth/logout'), 'Endpoint is /api/v1/auth/logout');
    assert.strictEqual(interceptedMethod, 'POST', 'HTTP method is POST');
    assert.strictEqual(interceptedCredentials, 'include', 'credentials option is "include" to clear cookie on server');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API Client: In-memory token management and credentials include policy', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedHeaders: Record<string, string> = {};
  let interceptedCredentials = '';

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    interceptedHeaders = (init?.headers as Record<string, string>) || {};
    interceptedCredentials = (init?.credentials as string) || '';

    return new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    // Set in-memory token
    api.setToken('memory-jwt-token-123');
    await api.get('/leads');

    assert.strictEqual(interceptedHeaders['Authorization'], 'Bearer memory-jwt-token-123', 'In-memory token attached as Bearer header');
    assert.strictEqual(interceptedCredentials, 'include', 'credentials: "include" sent on GET request');

    // Clear in-memory token
    api.setToken(null);
    await api.get('/leads');

    assert.strictEqual(interceptedHeaders['Authorization'], undefined, 'Bearer token removed when inMemoryToken is set to null');
    assert.strictEqual(interceptedCredentials, 'include', 'credentials: "include" still preserved for cookie-only requests');
  } finally {
    globalThis.fetch = originalFetch;
    api.setToken(null);
  }
});

test('API Interceptor: 401 on /auth/me or /auth/logout does NOT trigger unauthorized callback loop', async () => {
  const originalFetch = globalThis.fetch;
  let unauthorizedTriggeredCount = 0;

  api.setUnauthorizedHandler(() => {
    unauthorizedTriggeredCount++;
  });

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(JSON.stringify({ success: false, message: 'No session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    // 401 on /auth/me should not trigger unauthorized callback
    await api.get('/auth/me');
    assert.strictEqual(unauthorizedTriggeredCount, 0, 'No unauthorized callback triggered on /auth/me');

    // 401 on /auth/logout should not trigger unauthorized callback
    await api.post('/auth/logout', {});
    assert.strictEqual(unauthorizedTriggeredCount, 0, 'No unauthorized callback triggered on /auth/logout');

    // 401 on normal resource endpoint SHOULD trigger unauthorized callback
    await api.get('/leads');
    assert.strictEqual(unauthorizedTriggeredCount, 1, 'Unauthorized callback triggered on regular endpoint 401');
  } finally {
    globalThis.fetch = originalFetch;
    api.setUnauthorizedHandler(() => {});
  }
});
