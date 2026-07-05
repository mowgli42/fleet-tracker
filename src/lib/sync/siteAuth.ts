import { DEMO_SITE_ID, DEMO_SITE_KEY, STORAGE_SITE_KEY } from './constants';

/**
 * Registry of site_id → shared secret for sync ingress (demo: one site).
 * Production: replace with secure config (env, KMS, etc.).
 */
const SITE_KEY_BY_ID = new Map<string, string>([[DEMO_SITE_ID, DEMO_SITE_KEY]]);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Whether site_id is registered for sync (demo registry). */
export function isKnownSiteId(siteId: string): boolean {
  return SITE_KEY_BY_ID.has(siteId);
}

/** Expected key for a site, or null if unknown site. */
export function expectedSiteKey(siteId: string): string | null {
  return SITE_KEY_BY_ID.get(siteId) ?? null;
}

/**
 * Validate caller-provided secret for a given site_id (e.g. X-Site-Key header).
 * False for missing/unknown site/wrong key (caller should not distinguish in logs).
 */
export function validateSiteKey(siteId: string, providedKey: string | null | undefined): boolean {
  if (providedKey == null || !providedKey.trim()) return false;
  const expected = SITE_KEY_BY_ID.get(siteId);
  if (expected == null) return false;
  return timingSafeEqual(providedKey.trim(), expected);
}

/** Browser: persisted demo key for flush; defaults to DEMO_SITE_KEY. */
export function getConfiguredSiteKey(): string {
  if (typeof window === 'undefined') return DEMO_SITE_KEY;
  const s = window.localStorage.getItem(STORAGE_SITE_KEY);
  return s != null && s.trim() !== '' ? s.trim() : DEMO_SITE_KEY;
}
