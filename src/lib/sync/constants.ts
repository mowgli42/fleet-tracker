/** Demo site id for single-site Phase 1. */
export const DEMO_SITE_ID = 'demo-site-1';
/** Secret for DEMO_SITE_ID at sync ingress (demo; replace in production). */
export const DEMO_SITE_KEY = 'demo-local-key';
/** localStorage: client copy of site key used when flushing outbox to cloud. */
export const STORAGE_SITE_KEY = 'fleet-sync-site-key-v1';
export const STORAGE_LOCAL_EVENTS = 'fleet-sync-local-events-v1';
export const STORAGE_CLOUD_EVENTS = 'fleet-sync-cloud-events-v1';
export const STORAGE_OUTBOX = 'fleet-sync-outbox-v1';
export const STORAGE_CAUSAL = 'fleet-sync-causal-v1';
export const STORAGE_CLOUD_ONLINE = 'fleet-sync-cloud-online-v1';

/** PM at-risk window (matches design doc default). */
export const PM_AT_RISK_DAYS = 7;

/** Max events per remote sync batch (demo / test plan §7). */
export const MAX_SYNC_BATCH = 50;
