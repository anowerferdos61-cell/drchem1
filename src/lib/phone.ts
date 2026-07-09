/**
 * Bangladesh phone number helpers.
 *
 * Accepted inputs:
 *   01XXXXXXXXX (11 digits, starts with 01)
 *   +8801XXXXXXXXX / 8801XXXXXXXXX (with country code)
 *   Spaces/dashes are stripped.
 *
 * Normalized form (what we always store): +8801XXXXXXXXX  (14 chars)
 */

export function normalizeBdPhone(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  // 8801XXXXXXXXX (13 digits)
  if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`;
  // 01XXXXXXXXX (11 digits)
  if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
  return null;
}

export function isValidBdPhone(input: string): boolean {
  return normalizeBdPhone(input) !== null;
}

/** Synthetic auth email for phone-only signups (no real email provided). */
export function syntheticAuthEmailForPhone(normalizedPhone: string): string {
  // strip the leading + so it's a valid local-part
  const local = normalizedPhone.replace(/^\+/, "");
  return `${local}@phone.drchem.local`;
}
