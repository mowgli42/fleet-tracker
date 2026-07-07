<script lang="ts">
  import { get } from 'svelte/store';
  import { fleetDataStore } from '$lib/stores/fleetData';

  const fleet = $derived.by(() => get(fleetDataStore));
  const ready = $derived(fleet.vehicles.filter((v) => v.status === 'ready').length);
  const inMx = $derived(fleet.vehicles.filter((v) => v.status === 'maintenance').length);
  const recent = $derived(
    [...fleet.vehicles]
      .filter((v) => v.intakeAt)
      .sort((a, b) => (b.intakeAt ?? '').localeCompare(a.intakeAt ?? ''))
      .slice(0, 4)
  );
</script>

<div class="space-y-6">
  <div>
    <h1 class="font-display text-xl font-semibold" style="color: var(--proto-text);">Today</h1>
    <p class="mt-1 text-sm" style="color: var(--proto-muted);">
      Quick actions for intake, inspection, and vehicle status. Same fleet data as the main app.
    </p>
  </div>

  <div class="grid grid-cols-2 gap-3">
    <a href="/tablet/intake" class="proto-card proto-btn-primary flex min-h-[5.5rem] flex-col items-start justify-center !p-4 no-underline">
      <span class="text-base font-semibold">Intake / inspect</span>
      <span class="mt-1 text-xs font-normal opacity-90">VIN or pick unit</span>
    </a>
    <a href="/tablet/fleet" class="proto-card flex min-h-[5.5rem] flex-col items-start justify-center border p-4 no-underline transition hover:opacity-95" style="border-color: var(--proto-border); color: var(--proto-text); background: var(--proto-surface-elevated);">
      <span class="text-base font-semibold">Fleet list</span>
      <span class="mt-1 text-xs" style="color: var(--proto-muted);">Status & handoff</span>
    </a>
  </div>

  <div class="proto-card p-4">
    <h2 class="font-display text-sm font-semibold" style="color: var(--proto-text);">Lot snapshot</h2>
    <div class="mt-3 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-lg py-2" style="background: var(--proto-accent-dim);">
        <p class="m-0 text-2xl font-semibold tabular-nums" style="color: var(--proto-accent);">{ready}</p>
        <p class="m-0 text-[10px] uppercase tracking-wide" style="color: var(--proto-muted);">Ready</p>
      </div>
      <div class="rounded-lg py-2" style="background: var(--proto-surface-elevated);">
        <p class="m-0 text-2xl font-semibold tabular-nums" style="color: var(--proto-warn);">{inMx}</p>
        <p class="m-0 text-[10px] uppercase tracking-wide" style="color: var(--proto-muted);">Service</p>
      </div>
      <div class="rounded-lg py-2" style="background: var(--proto-surface-elevated);">
        <p class="m-0 text-2xl font-semibold tabular-nums" style="color: var(--proto-text);">{fleet.vehicles.length}</p>
        <p class="m-0 text-[10px] uppercase tracking-wide" style="color: var(--proto-muted);">Total</p>
      </div>
    </div>
  </div>

  {#if recent.length > 0}
    <div>
      <h2 class="mb-2 font-display text-sm font-semibold" style="color: var(--proto-text);">Recent intake</h2>
      <ul class="space-y-2">
        {#each recent as v}
          <li>
            <a
              href="/tablet/vehicle/{v.id}"
              class="proto-card flex items-center justify-between gap-3 p-3 no-underline transition hover:opacity-95"
              style="color: var(--proto-text);"
            >
              <span class="font-medium">{v.name}</span>
              <span class="text-xs" style="color: var(--proto-muted);">{v.intakeAt}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
