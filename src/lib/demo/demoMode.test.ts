import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_LOCAL_EVENTS,
  STORAGE_OUTBOX
} from '../sync/constants';
import {
  bootstrapDemoIfNeeded,
  clearDemoStorage,
  DEMO_CLEARABLE_STORAGE_KEYS,
  DEMO_DAY_STORAGE_KEY,
  getUtcDayKey
} from './demoMode';

describe('getUtcDayKey', () => {
  it('returns UTC calendar date', () => {
    expect(getUtcDayKey(new Date('2026-07-05T15:30:00.000Z'))).toBe('2026-07-05');
  });
});

describe('demo storage reset', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {
      [DEMO_CLEARABLE_STORAGE_KEYS[0]]: '{"vehicles":[]}',
      [STORAGE_LOCAL_EVENTS]: '[]',
      [STORAGE_OUTBOX]: '[]',
      [DEMO_DAY_STORAGE_KEY]: '2026-07-04'
    };
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        }
      }
    });
    vi.stubEnv('VITE_DEMO_MODE', 'true');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('clears fleet and sync keys on a new UTC day', () => {
    const cleared = bootstrapDemoIfNeeded(new Date('2026-07-05T01:00:00.000Z'));
    expect(cleared).toBe(true);
    expect(store[DEMO_CLEARABLE_STORAGE_KEYS[0]]).toBeUndefined();
    expect(store[STORAGE_LOCAL_EVENTS]).toBeUndefined();
    expect(store[STORAGE_OUTBOX]).toBeUndefined();
    expect(store[DEMO_DAY_STORAGE_KEY]).toBe('2026-07-05');
  });

  it('skips reset when demo day matches', () => {
    store[DEMO_DAY_STORAGE_KEY] = '2026-07-05';
    const cleared = bootstrapDemoIfNeeded(new Date('2026-07-05T23:00:00.000Z'));
    expect(cleared).toBe(false);
    expect(store[DEMO_CLEARABLE_STORAGE_KEYS[0]]).toBe('{"vehicles":[]}');
  });

  it('clearDemoStorage removes all demo keys', () => {
    clearDemoStorage();
    expect(store[DEMO_CLEARABLE_STORAGE_KEYS[0]]).toBeUndefined();
    expect(store[STORAGE_LOCAL_EVENTS]).toBeUndefined();
    expect(store[STORAGE_OUTBOX]).toBeUndefined();
  });
});
