<script lang="ts">
  import { page } from '$app/stores';
  import { fleetDataStore } from '$lib/stores/fleetData';
  import {
    buildVehicleHistory,
    isCurrentOpenJob
  } from '$lib/history/vehicleHistoryRules';

  let { data }: { data: Record<string, never> } = $props();

  const vehicleId = $derived($page.params.id);
  const fleet = $derived($fleetDataStore);
  const vehicle = $derived(fleet.vehicles.find((v) => v.id === vehicleId) ?? null);
  const historyEntries = $derived(
    vehicle
      ? buildVehicleHistory(vehicleId, fleet.jobs, fleet.inspections, vehicle.currentJobId)
      : []
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
            <th>Type</th>
            <th>Detail</th>
            <th>Service / result</th>
            <th>Status</th>
            <th>Odometer</th>
          </tr>
        </thead>
        <tbody>
          {#each historyEntries as entry (entry.kind === 'job' ? entry.job.id : entry.inspection.id)}
            {#if entry.kind === 'job'}
              {@const job = entry.job}
              <tr class:ring-2={entry.isCurrentOpen} class:ring-amber-400={entry.isCurrentOpen}>
                <td class="text-muted text-sm">{job.completedAt ?? job.createdAt}</td>
                <td class="text-sm">Job</td>
                <td>
                  <a href="/maintenance#job-{job.id}" class="link-accent font-medium">{job.title}</a>
                  {#if isCurrentOpenJob(job, vehicle.currentJobId)}
                    <span class="ml-2 text-xs font-medium text-amber-800">Current open job</span>
                  {/if}
                </td>
                <td class="text-muted text-sm">{serviceTypeLabels[job.serviceType ?? 'other'] ?? '—'}</td>
                <td><span class="badge badge-{job.status}">{statusLabels[job.status]}</span></td>
                <td class="text-muted text-sm">{job.odometerAtCompletion ?? job.odometerAtJobOpen ?? '—'}</td>
              </tr>
            {:else}
              <tr>
                <td class="text-muted text-sm">{entry.inspection.inspectedAt.slice(0, 10)}</td>
                <td class="text-sm">Inspection</td>
                <td class="font-medium">Pre-trip / DVIR</td>
                <td class="text-muted text-sm">{entry.inspection.passed ? 'Pass' : 'Failed items'}</td>
                <td>
                  <span class="badge {entry.inspection.passed ? 'badge-ready' : 'badge-maintenance'}">
                    {entry.inspection.passed ? 'Pass' : 'Defects'}
                  </span>
                </td>
                <td class="text-muted text-sm">—</td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    {#if historyEntries.length === 0}
      <p class="text-muted py-4">No maintenance history for this vehicle.</p>
    {/if}
  {/if}
</div>
