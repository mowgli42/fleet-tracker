<script lang="ts">
  import { page } from '$app/stores';
  import { fleetDataStore } from '$lib/stores/fleetData';
  import { buildDriverStatusView, resolveTrackingToken } from '$lib/driver/driverStatusBoardRules';

  const token = $derived($page.params.token ?? '');
  const fleet = $derived($fleetDataStore);
  const tracking = $derived(resolveTrackingToken(token, fleet.trackingTokens));
  const vehicle = $derived(
    tracking ? fleet.vehicles.find((v) => v.id === tracking.vehicleId) : undefined
  );
  const job = $derived(
    vehicle?.currentJobId ? fleet.jobs.find((j) => j.id === vehicle.currentJobId) : undefined
  );
  const view = $derived(buildDriverStatusView(vehicle, job));
</script>

<svelte:head>
  <title>Vehicle status | Fleet Tracker</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-10">
  {#if !view}
    <h1 class="font-display text-xl font-semibold">Status not found</h1>
    <p class="text-muted text-sm mt-2">This tracking link is invalid or has expired.</p>
  {:else}
    <p class="text-xs font-medium uppercase tracking-wide text-muted">Your vehicle</p>
    <h1 class="font-display text-2xl font-semibold mt-1">{view.vehicleName}</h1>
    <div class="card p-5 mt-6 space-y-3">
      <p class="text-sm text-muted m-0">Status</p>
      <p class="text-lg font-medium m-0">{view.statusText}</p>
      {#if view.jobTitle}
        <p class="text-sm text-muted m-0 pt-2">Current work: {view.jobTitle}</p>
      {/if}
    </div>
    <p class="text-xs text-muted mt-6">Read-only view — contact your fleet manager for changes.</p>
  {/if}
</div>
