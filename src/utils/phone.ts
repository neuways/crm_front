/**
 * Phone number validation and privacy masking utilities for client-side forms.
 * Synchronized with server/src/utils/normalization.ts.
 */

const INDIAN_10_DIGIT_REGEX = /^[6-9]\d{9}$/;
const INDIAN_WITH_ZERO_REGEX = /^0[6-9]\d{9}$/;
const INDIAN_WITH_91_REGEX = /^(?:\+91|91)[6-9]\d{9}$/;
const GENERAL_E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Validates mobile phone number syntax against Indian and E.164 formats.
 */
export const isValidMobileNumber = (mobile: string): boolean => {
  if (!mobile || typeof mobile !== 'string') return false;

  const trimmed = mobile.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  // Indian numbers
  if (INDIAN_10_DIGIT_REGEX.test(digitsOnly)) return true;
  if (INDIAN_WITH_ZERO_REGEX.test(digitsOnly)) return true;
  if (INDIAN_WITH_91_REGEX.test(digitsOnly)) return true;
  if (trimmed.startsWith('+91') && INDIAN_10_DIGIT_REGEX.test(digitsOnly.slice(2))) return true;

  // International format with '+' prefix
  if (trimmed.startsWith('+')) {
    const internationalNormalized = `+${digitsOnly}`;
    return GENERAL_E164_REGEX.test(internationalNormalized);
  }

  return false;
};

/**
 * Masks customer phone number to protect privacy in the UI (e.g. "+91 98765•••••").
 */
export const maskPhoneNumber = (mobile: string): string => {
  if (!mobile) return '';
  const clean = mobile.trim();
  if (clean.length <= 4) return clean;
  const visiblePrefix = clean.slice(0, Math.max(3, clean.length - 4));
  return `${visiblePrefix}••••`;
};
