/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When set, outbox flushes via POST to `{base}/api/sync/events` and cloud state loads from GET `{base}/api/sync/state`. */
  readonly VITE_SYNC_API_URL?: string;
  /** When `true`, show demo banner and reset fleet + sync localStorage daily (UTC) per browser. */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
