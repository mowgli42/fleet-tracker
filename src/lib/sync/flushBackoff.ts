/** Exponential backoff for outbox flush: 1s, 2s, 4s … capped at 60s. */
const BASE_MS = 1000;
const MAX_MS = 60_000;

export function computeBackoffMs(attempt: number): number {
  if (attempt <= 0) return 0;
  const exp = BASE_MS * 2 ** (attempt - 1);
  return Math.min(MAX_MS, exp);
}

export type FlushBackoffState = {
  attempt: number;
  nextFlushAt: number;
};

export function createFlushBackoffState(): FlushBackoffState {
  return { attempt: 0, nextFlushAt: 0 };
}

/** Call after a failed flush; returns updated state. */
export function recordFlushFailure(state: FlushBackoffState, now = Date.now()): FlushBackoffState {
  const attempt = state.attempt + 1;
  return { attempt, nextFlushAt: now + computeBackoffMs(attempt) };
}

/** Call after a successful flush. */
export function recordFlushSuccess(): FlushBackoffState {
  return createFlushBackoffState();
}

export function shouldAttemptFlush(state: FlushBackoffState, now = Date.now()): boolean {
  return now >= state.nextFlushAt;
}
