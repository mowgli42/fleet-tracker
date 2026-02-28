<script lang="ts">
  import type { Vehicle, MaintenanceJob } from '$lib/types/fleet';
  import { fleetDataStore } from '$lib/stores/fleetData';
  import IconPencil from '$lib/components/IconPencil.svelte';

  let { vehicle, onClose, onEdit }: { vehicle: Vehicle; onClose: () => void; onEdit: () => void } = $props();

  const fleet = $derived($fleetDataStore);
  const jobsForVehicle = $derived(fleet.jobs.filter((j) => j.vehicleId === vehicle.id));
  const currentJob = $derived(
    jobsForVehicle.find((j) => j.status !== 'completed')
  );
  const recentJobs = $derived(
    [...jobsForVehicle]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
  );
  const repairByComponent = $derived(
    jobsForVehicle.reduce<Record<string, number>>((acc, j) => {
      const c = j.component ?? 'other';
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {})
  );
</script>

<div class="vehicle-detail-panel fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)] flex flex-col" role="dialog" aria-labelledby="detail-panel-title">
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="detail-panel-title" class="font-display font-semibold">{vehicle.name}</h2>
    <button
      type="button"
      class="p-2 rounded-md text-muted hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Close"
      onclick={onClose}
    >
      ✕
    </button>
  </div>
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    <div>
      <span class="badge badge-{vehicle.status}">{vehicle.status}</span>
      {#if vehicle.vin}
        <span class="text-xs text-muted ml-2">VIN: {vehicle.vin}</span>
      {/if}
    </div>
    <dl class="grid grid-cols-1 gap-2 text-sm">
      {#if vehicle.odometer != null}
        <div><dt class="text-muted">Odometer</dt><dd class="font-medium">{vehicle.odometer.toLocaleString()} mi</dd></div>
      {/if}
      {#if vehicle.driver}
        <div><dt class="text-muted">Driver</dt><dd>{vehicle.driver}</dd></div>
      {/if}
      {#if vehicle.role}
        <div><dt class="text-muted">Role</dt><dd class="capitalize">{vehicle.role}</dd></div>
      {/if}
      {#if vehicle.lastService}
        <div><dt class="text-muted">Last service</dt><dd>{vehicle.lastService}</dd></div>
      {/if}
      {#if vehicle.nextService}
        <div><dt class="text-muted">Next service</dt><dd>{vehicle.nextService}</dd></div>
      {/if}
    </dl>

    {#if currentJob}
      <div>
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Current job</h3>
        <div class="card p-3">
          <p class="font-medium">{currentJob.title}</p>
          <p class="text-xs text-muted mt-1">{currentJob.status} · {currentJob.priority}</p>
          <a href="/maintenance#job-{currentJob.id}" class="text-sm link-accent mt-2 inline-block">View job →</a>
        </div>
      </div>
    {/if}

    {#if recentJobs.length > 0}
      <div>
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Recent services</h3>
        <ul class="space-y-2">
          {#each recentJobs as job}
            <li class="text-sm flex justify-between gap-2">
              <span>{job.title}</span>
              <span class="text-muted shrink-0">{job.updatedAt}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if Object.keys(repairByComponent).length > 0}
      <div>
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Repair summary</h3>
        <ul class="flex flex-wrap gap-2">
          {#each Object.entries(repairByComponent) as [component, count]}
            <li class="badge badge-medium capitalize">{component}: {count}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div>
      <a href="/fleet/vehicle/{vehicle.id}/history" class="link-accent text-sm">Full history report →</a>
    </div>
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)]">
    <button type="button" class="btn btn-primary w-full flex items-center justify-center gap-2" onclick={onEdit} aria-label="Edit vehicle">
      <IconPencil size={18} />
      <span>Edit vehicle</span>
    </button>
  </div>
</div>
