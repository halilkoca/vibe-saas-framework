// Shared server-side validation helpers.
// All public-facing inputs should flow through these before reaching DB/API.

export const LIMITS = {
  fullName: { min: 1, max: 100 },
  companyName: { min: 1, max: 100 },
  title: { min: 1, max: 150 },
  email: { min: 1, max: 254 },
  phone: { min: 0, max: 30 },
  source: { min: 0, max: 50 },
  notes: { min: 0, max: 2000 },
  message: { min: 10, max: 2000 },
  password: { min: 8, max: 72 },
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/**
 * Strips control characters and trims whitespace.
 */
export function sanitizeText(value: string, maxLen: number): string {
  return value.replace(CONTROL_CHARS, "").trim().slice(0, maxLen);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate amount for deals/billing: finite, non-negative, capped.
 */
export function isValidAmount(value: unknown): value is number {
  if (typeof value !== "number") return false;
  if (!Number.isFinite(value)) return false;
  if (value < 0) return false;
  if (value > 999_999_999.99) return false;
  return true;
}

/**
 * Validate password length.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= LIMITS.password.min && password.length <= LIMITS.password.max;
}

/**
 * Generic server-side parse + validate helper for request bodies.
 * Returns a structured result instead of raw Error-throw.
 */
export function parseJSON(bodyText: string): { ok: false; error: string } | { ok: true; data: unknown } {
  try {
    const data = JSON.parse(bodyText);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Invalid JSON body." };
  }
}