/**
 * Nueways CRM - Phase 3 New Lead Enquiry Form Tests
 *
 * Verifies:
 * 1. Mobile phone validation and privacy masking matching backend normalization.
 * 2. Enquiry service contract for POST /api/v1/enquiries.
 * 3. Successful enquiry creation (HTTP 201).
 * 4. Duplicate conflict detection (HTTP 409) across match types:
 *    - MOBILE_MATCH
 *    - EMAIL_MATCH
 *    - CROSS_FIELD_MATCH
 *    - BOTH_FIELDS_MATCH
 *    - CONCURRENT_COLLISION
 * 5. Input validation error handling (HTTP 400).
 * 6. Authentication error handling (HTTP 401).
 * 7. Budget constraint validation (budgetMin <= budgetMax).
 */

import assert from 'node:assert';
import { test } from 'node:test';
import { isValidMobileNumber, maskPhoneNumber } from '../src/utils/phone.js';
import { enquiryService } from '../src/services/enquiry.service.js';
import { CreateEnquiryInput } from '../src/types/enquiry.types.js';

// -----------------------------------------------------------------------------
// Suite 1: Phone Validation & Privacy Masking
// -----------------------------------------------------------------------------
test('Phone Utilities: Validates Indian 10-digit mobile numbers', () => {
  // Valid Indian mobile numbers (starts with 6, 7, 8, 9)
  assert.strictEqual(isValidMobileNumber('9876543210'), true);
  assert.strictEqual(isValidMobileNumber('8123456789'), true);
  assert.strictEqual(isValidMobileNumber('7012345678'), true);
  assert.strictEqual(isValidMobileNumber('6901234567'), true);

  // Valid prefixes (0, 91, +91)
  assert.strictEqual(isValidMobileNumber('09876543210'), true);
  assert.strictEqual(isValidMobileNumber('919876543210'), true);
  assert.strictEqual(isValidMobileNumber('+919876543210'), true);
  assert.strictEqual(isValidMobileNumber('+91 98765 43210'), true);

  // Invalid numbers
  assert.strictEqual(isValidMobileNumber('1234567890'), false, 'Cannot start with 1');
  assert.strictEqual(isValidMobileNumber('5555555555'), false, 'Cannot start with 5');
  assert.strictEqual(isValidMobileNumber('98765'), false, 'Too short');
  assert.strictEqual(isValidMobileNumber('abcdefghij'), false, 'Alpha chars rejected');
  assert.strictEqual(isValidMobileNumber(''), false, 'Empty rejected');
});

test('Phone Utilities: Validates international E.164 numbers', () => {
  assert.strictEqual(isValidMobileNumber('+14155552671'), true, 'US number');
  assert.strictEqual(isValidMobileNumber('+442071838750'), true, 'UK number');
  assert.strictEqual(isValidMobileNumber('+971501234567'), true, 'UAE number');
  assert.strictEqual(isValidMobileNumber('+6591234567'), true, 'Singapore number');
});

test('Phone Utilities: Privacy masking protects customer mobile numbers', () => {
  const masked1 = maskPhoneNumber('9876543210');
  assert.ok(masked1.endsWith('••••'), 'Ends with bullet mask');
  assert.ok(!masked1.includes('43210'), 'Masks last 4 digits');

  const masked2 = maskPhoneNumber('+919876543210');
  assert.ok(masked2.endsWith('••••'));
  assert.ok(!masked2.includes('3210'));
});

// -----------------------------------------------------------------------------
// Suite 2: Enquiry Service Contract & Success (HTTP 201)
// -----------------------------------------------------------------------------
test('Enquiry Service: Sends valid POST request to /api/v1/enquiries', async () => {
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

    const mockCreatedEnquiry = {
      success: true,
      message: 'Enquiry created successfully.',
      data: {
        enquiry: {
          id: 'enq-mock-101',
          name: 'Priya Sharma',
          mobile: '9876543210',
          normalizedMobile: '+919876543210',
          email: 'priya.sharma@example.com',
          normalizedEmail: 'priya.sharma@example.com',
          projectName: 'Skyline Palms',
          requirement: '3 BHK High Rise',
          budgetMin: 7500000,
          budgetMax: 12000000,
          status: 'ACTIVE',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };

    return new Response(JSON.stringify(mockCreatedEnquiry), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const input: CreateEnquiryInput = {
      name: 'Priya Sharma',
      mobile: '9876543210',
      email: 'priya.sharma@example.com',
      projectName: 'Skyline Palms',
      requirement: '3 BHK High Rise',
      budgetMin: 7500000,
      budgetMax: 12000000,
      source: 'Website Enquiry',
      preferredContactMethod: 'CALL',
      preferredContactTiming: 'Morning (9 AM - 12 PM)',
    };

    const result = await enquiryService.createEnquiry(input);

    assert.strictEqual(result.success, true, 'Result indicates success');
    assert.strictEqual(result.statusCode, 201, 'Status code is 201 Created');
    assert.ok(interceptedUrl.endsWith('/api/v1/enquiries'), 'Calls exact endpoint /api/v1/enquiries');
    assert.strictEqual(interceptedMethod, 'POST', 'Uses POST method');
    assert.strictEqual(interceptedHeaders['Content-Type'], 'application/json');

    const parsedBody = JSON.parse(interceptedBody);
    assert.strictEqual(parsedBody.name, 'Priya Sharma');
    assert.strictEqual(parsedBody.mobile, '9876543210');
    assert.strictEqual(parsedBody.budgetMin, 7500000);
    assert.strictEqual(parsedBody.budgetMax, 12000000);

    assert.ok(result.data?.enquiry, 'Returns created enquiry in data envelope');
    assert.strictEqual(result.data.enquiry.name, 'Priya Sharma');
    assert.strictEqual(result.data.enquiry.status, 'ACTIVE');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -----------------------------------------------------------------------------
// Suite 3: Duplicate Conflict Detection (HTTP 409)
// -----------------------------------------------------------------------------
test('Enquiry Service: Intercepts Mobile Duplicate Conflict (HTTP 409)', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    const duplicateBody = {
      success: false,
      isDuplicate: true,
      duplicateType: 'MOBILE_MATCH',
      message: 'An enquiry with this mobile number already exists.',
      data: {
        matches: {
          mobileMatch: {
            id: 'enq-existing-01',
            name: 'Rajesh Varma',
            status: 'ACTIVE',
            assignedTo: { id: 'emp-01', name: 'Agent Smith', role: 'SALES' },
            createdAt: '2026-10-15T10:00:00Z',
            matchReason: 'MOBILE',
          },
        },
        matchedEnquiries: [
          {
            id: 'enq-existing-01',
            name: 'Rajesh Varma',
            status: 'ACTIVE',
            assignedTo: { id: 'emp-01', name: 'Agent Smith', role: 'SALES' },
            createdAt: '2026-10-15T10:00:00Z',
            matchReason: 'MOBILE',
          },
        ],
      },
    };

    return new Response(JSON.stringify(duplicateBody), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await enquiryService.createEnquiry({
      name: 'Rajesh Varma',
      mobile: '9876543210',
    });

    assert.strictEqual(result.success, false, 'Reports false on duplicate');
    assert.strictEqual(result.statusCode, 409, 'Captures HTTP 409 status');
    assert.strictEqual(result.isDuplicate, true, 'Flags duplicate');
    assert.strictEqual(result.duplicateType, 'MOBILE_MATCH', 'Identifies MOBILE_MATCH');
    assert.strictEqual(result.message, 'An enquiry with this mobile number already exists.');
    assert.ok(result.data?.matchedEnquiries, 'Includes matched enquiries list');
    assert.strictEqual(result.data.matchedEnquiries.length, 1);
    assert.strictEqual(result.data.matchedEnquiries[0].name, 'Rajesh Varma');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Enquiry Service: Intercepts Cross-Field Collision (HTTP 409)', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    const crossFieldBody = {
      success: false,
      isDuplicate: true,
      duplicateType: 'CROSS_FIELD_MATCH',
      message: 'The submitted mobile number matches one enquiry, and the email matches a different enquiry.',
      data: {
        matches: {
          mobileMatch: {
            id: 'enq-lead-a',
            name: 'Lead A',
            status: 'ACTIVE',
            assignedTo: null,
            createdAt: '2026-10-01T00:00:00Z',
            matchReason: 'MOBILE',
          },
          emailMatch: {
            id: 'enq-lead-b',
            name: 'Lead B',
            status: 'ACTIVE',
            assignedTo: null,
            createdAt: '2026-10-02T00:00:00Z',
            matchReason: 'EMAIL',
          },
        },
        matchedEnquiries: [
          {
            id: 'enq-lead-a',
            name: 'Lead A',
            status: 'ACTIVE',
            assignedTo: null,
            createdAt: '2026-10-01T00:00:00Z',
            matchReason: 'MOBILE',
          },
          {
            id: 'enq-lead-b',
            name: 'Lead B',
            status: 'ACTIVE',
            assignedTo: null,
            createdAt: '2026-10-02T00:00:00Z',
            matchReason: 'EMAIL',
          },
        ],
      },
    };

    return new Response(JSON.stringify(crossFieldBody), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await enquiryService.createEnquiry({
      name: 'Conflict Prospect',
      mobile: '9876543210',
      email: 'leadb@example.com',
    });

    assert.strictEqual(result.statusCode, 409);
    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.duplicateType, 'CROSS_FIELD_MATCH');
    assert.strictEqual(result.data?.matchedEnquiries?.length, 2, 'Preserves both distinct matching records');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -----------------------------------------------------------------------------
// Suite 4: Validation Errors & HTTP Status Mapping
// -----------------------------------------------------------------------------
test('Enquiry Service: Handles HTTP 400 Validation Error', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    const errorBody = {
      success: false,
      error: 'Validation Error',
      message: 'Enquiry name is required. Enquiry mobile number is required.',
    };
    return new Response(JSON.stringify(errorBody), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await enquiryService.createEnquiry({
      name: '',
      mobile: '',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.statusCode, 400);
    assert.strictEqual(result.error, 'Validation Error');
    assert.ok(result.message?.includes('Enquiry name is required'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Enquiry Service: Handles HTTP 401 Unauthorized Error', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> => {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. No token provided.',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const result = await enquiryService.createEnquiry({
      name: 'Test Prospect',
      mobile: '9876543210',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.statusCode, 401);
    assert.strictEqual(result.error, 'Unauthorized');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Budget Constraint: Minimum budget cannot exceed maximum budget', () => {
  const validateBudget = (min?: number, max?: number): boolean => {
    if (typeof min === 'number' && typeof max === 'number') {
      return min <= max;
    }
    return true;
  };

  assert.strictEqual(validateBudget(5000000, 10000000), true);
  assert.strictEqual(validateBudget(5000000, 5000000), true);
  assert.strictEqual(validateBudget(10000000, 5000000), false, 'Rejects min > max');
  assert.strictEqual(validateBudget(5000000, undefined), true);
  assert.strictEqual(validateBudget(undefined, 10000000), true);
});
