import { bootstrapDemoIfNeeded } from './demoMode';
import { bootstrapFleetData } from '$lib/stores/fleetData';
import { initSyncRuntime } from '$lib/stores/syncRuntime';

let fleetBootstrapped = false;
let syncStarted = false;

function bootstrapFleetOnce(): void {
  if (fleetBootstrapped || typeof window === 'undefined') return;
  fleetBootstrapped = true;
  bootstrapDemoIfNeeded();
  bootstrapFleetData();
}

/** Client entry: demo day gate, fleet hydrate, then sync runtime. */
export function initClientApp(): void {
  bootstrapFleetOnce();
  if (syncStarted || typeof window === 'undefined') return;
  syncStarted = true;
  initSyncRuntime();
}

// Hydrate fleet before first paint when the layout module loads on the client.
bootstrapFleetOnce();
