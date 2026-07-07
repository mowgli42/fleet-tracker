<script lang="ts">
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { fleetDataStore } from '$lib/stores/fleetData';

  const id = $derived($page.params.id ?? '');
  const fleet = $derived.by(() => get(fleetDataStore));

  const vehicle = $derived(fleet.vehicles.find((v) => v.id === id));
  const jobs = $derived(fleet.jobs.filter((j) => j.vehicleId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  const partRows = $derived.by(() => {
    const jobIds = new Set(jobs.map((j) => j.id));
    const fromJobs = jobs.flatMap((j) => (j.partsRequired ?? []).map((p) => ({ source: `Job: ${j.title}`, part: p })));
    const orders = fleet.parts.filter((p) => p.maintenanceJobId && jobIds.has(p.maintenanceJobId));
    const fromOrders = orders.map((p) => ({
      source: `Order ${p.status}`,
      part: `${p.partName} ×${p.quantity}${p.expectedDelivery ? ` · ETA ${p.expectedDelivery}` : ''}`
    }));
    return [...fromJobs, ...fromOrders];
  });
</script>

<div class="space-y-5">
  {#if !vehicle}
    <p style="color: var(--proto-danger);">Vehicle not found.</p>
    <a href="/tablet/fleet" class="proto-btn-primary inline-flex text-sm">Back to fleet</a>
  {:else}
    <div>
      <a href="/tablet/fleet" class="text-xs font-medium no-underline hover:underline" style="color: var(--proto-accent);">← Fleet</a>
      <h1 class="mt-2 font-display text-xl font-semibold" style="color: var(--proto-text);">{vehicle.name}</h1>
      <p class="m-0 mt-1 font-mono text-xs" style="color: var(--proto-muted);">{vehicle.vin ?? vehicle.id}</p>
    </div>

    <div class="proto-card p-4">
      <h2 class="m-0 font-display text-sm font-semibold" style="color: var(--proto-text);">Status</h2>
      <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
        <dt style="color: var(--proto-muted);">Operational</dt>
        <dd class="m-0 font-medium capitalize">{vehicle.status.replace('-', ' ')}</dd>
        <dt style="color: var(--proto-muted);">Next PM</dt>
        <dd class="m-0">{vehicle.nextService ?? '—'}</dd>
        <dt style="color: var(--proto-muted);">Odometer</dt>
        <dd class="m-0 tabular-nums">{vehicle.odometer?.toLocaleString() ?? '—'}</dd>
        {#if vehicle.driver}
          <dt style="color: var(--proto-muted);">Driver</dt>
          <dd class="m-0">{vehicle.driver}</dd>
        {/if}
      </dl>
    </div>

    <div class="proto-card p-4">
      <h2 class="m-0 font-display text-sm font-semibold" style="color: var(--proto-text);">Maintenance</h2>
      {#if jobs.length === 0}
        <p class="mt-2 text-sm" style="color: var(--proto-muted);">No jobs for this unit.</p>
      {:else}
        <ul class="mt-3 space-y-2">
          {#each jobs as j}
            <li>
              <a
                href="/tablet/job/{j.id}"
                class="block rounded-lg border px-3 py-2 text-sm no-underline transition hover:opacity-95"
                style="border-color: var(--proto-border); background: var(--proto-surface-elevated); color: inherit;"
              >
                <div class="flex items-start justify-between gap-2">
                  <span class="font-medium" style="color: var(--proto-text);">{j.title}</span>
                  <span class="shrink-0 text-[10px] uppercase" style="color: var(--proto-muted);">{j.status}</span>
                </div>
                <p class="m-0 mt-1 text-xs" style="color: var(--proto-muted);">
                  {j.priority} · {j.component ?? 'general'}
                  {#if j.status !== 'completed'}
                    <span class="block pt-1 font-semibold" style="color: var(--proto-accent);">Open workflow →</span>
                  {/if}
                </p>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="proto-card p-4">
      <h2 class="m-0 font-display text-sm font-semibold" style="color: var(--proto-text);">Parts</h2>
      {#if partRows.length === 0}
        <p class="mt-2 text-sm" style="color: var(--proto-muted);">No parts linked to open work on this unit.</p>
      {:else}
        <ul class="mt-3 space-y-2">
          {#each partRows as row}
            <li class="text-sm">
              <span style="color: var(--proto-muted);">{row.source}</span>
              <span class="block" style="color: var(--proto-text);">{row.part}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <a href="/tablet/intake" class="proto-btn-primary flex justify-center text-sm no-underline">New intake</a>
  {/if}
</div>
