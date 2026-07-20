import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'quote_admin_session';

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'changeme';
}

export function isDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

// The session token is an HMAC derived from the admin password, so changing
// the password invalidates all existing sessions. No secrets are stored.
export function sessionToken() {
  return createHmac('sha256', getAdminPassword()).update('admin-session-v1').digest('hex');
}

export function checkPassword(password) {
  const expected = Buffer.from(getAdminPassword());
  const given = Buffer.from(String(password || ''));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function isAuthenticated() {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return false;
  const expected = Buffer.from(sessionToken());
  const given = Buffer.from(value);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
