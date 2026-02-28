<script lang="ts">
  import { page } from '$app/stores';
  import { fleetDataStore } from '$lib/stores/fleetData';
  import type { MaintenanceJob } from '$lib/types/fleet';

  let { data }: { data: Record<string, never> } = $props();

  const vehicleId = $derived($page.params.id);
  const fleet = $derived($fleetDataStore);
  const vehicle = $derived(fleet.vehicles.find((v) => v.id === vehicleId) ?? null);
  const jobsForVehicle = $derived(
    fleet.jobs
      .filter((j) => j.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  );

  const serviceTypeLabels: Record<string, string> = {
    'oil-change': 'Oil change',
    'fluid-change': 'Fluid change',
    'tire-replacement': 'Tire replacement',
    'tire-rotation': 'Tire rotation',
    repair: 'Repair',
    inspection: 'Inspection',
    other: 'Other'
  };
  const statusLabels: Record<string, string> = {
    open: 'Open',
    'in-progress': 'In progress',
    'waiting-parts': 'Waiting parts',
    completed: 'Completed'
  };
</script>

<svelte:head>
  <title>{vehicle?.name ?? 'Vehicle'} – History | Fleet Tracker</title>
</svelte:head>

<div class="vehicle-history-page">
  <header class="page-header">
    <div>
      <a href="/fleet" class="link-accent text-sm mb-1 inline-block">← Fleet</a>
      <h1>{vehicle?.name ?? 'Vehicle'}</h1>
      <p class="subtitle">Full maintenance history</p>
    </div>
  </header>

  {#if !vehicle}
    <p class="text-muted">Vehicle not found.</p>
  {:else}
    <div class="card p-4 mb-6">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt class="text-muted">Status</dt><dd><span class="badge badge-{vehicle.status}">{vehicle.status}</span></dd></div>
        {#if vehicle.odometer != null}
          <div><dt class="text-muted">Odometer</dt><dd>{vehicle.odometer.toLocaleString()} mi</dd></div>
        {/if}
        {#if vehicle.lastService}
          <div><dt class="text-muted">Last service</dt><dd>{vehicle.lastService}</dd></div>
        {/if}
        {#if vehicle.nextService}
          <div><dt class="text-muted">Next service</dt><dd>{vehicle.nextService}</dd></div>
        {/if}
      </dl>
    </div>

    <div class="card table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Job</th>
            <th>Service type</th>
            <th>Component</th>
            <th>Status</th>
            <th>Odometer</th>
          </tr>
        </thead>
        <tbody>
          {#each jobsForVehicle as job (job.id)}
            <tr>
              <td class="text-muted text-sm">{job.updatedAt}</td>
              <td>
                <a href="/maintenance#job-{job.id}" class="link-accent font-medium">{job.title}</a>
              </td>
              <td class="text-muted text-sm">{serviceTypeLabels[job.serviceType ?? 'other'] ?? '—'}</td>
              <td class="text-muted text-sm capitalize">{job.component ?? '—'}</td>
              <td><span class="badge badge-{job.status}">{statusLabels[job.status]}</span></td>
              <td class="text-muted text-sm">{job.odometerAtCompletion ?? job.odometerAtJobOpen ?? '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if jobsForVehicle.length === 0}
      <p class="text-muted py-4">No maintenance jobs for this vehicle.</p>
    {/if}
  {/if}
</div>
