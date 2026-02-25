<script lang="ts">
  import { page } from '$app/stores';
  import type { Vehicle } from '$lib/types/fleet';

  let { data }: { data: { vehicles: Vehicle[] } } = $props();

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'in-use', label: 'In use' },
    { value: 'ready', label: 'Ready' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'out-of-service', label: 'Out of service' },
    { value: 'reserved', label: 'Reserved' }
  ];

  let statusFilter = $state('');
  let viewMode = $state<'grid' | 'list'>('grid');
  let prevSearch = $state('');

  $effect(() => {
    const search = $page.url.search;
    if (search !== prevSearch) {
      prevSearch = search;
      statusFilter = $page.url.searchParams.get('status') ?? '';
    }
  });

  const filtered = $derived.by(() =>
    statusFilter
      ? data.vehicles.filter((v) => v.status === statusFilter)
      : data.vehicles
  );
</script>

<div class="fleet-page">
  <header class="page-header">
    <div>
      <h1>Fleet</h1>
      <p class="subtitle">Vehicle status and availability</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-sm text-muted">
        <span>Status</span>
        <select
          bind:value={statusFilter}
          class="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by status"
        >
          {#each statusOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>
      <div class="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-0.5" role="group" aria-label="View mode">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 {viewMode === 'grid'
            ? 'bg-slate-200 text-slate-900'
            : 'text-muted hover:bg-slate-100'}"
          onclick={() => (viewMode = 'grid')}
        >
          Grid
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 {viewMode === 'list'
            ? 'bg-slate-200 text-slate-900'
            : 'text-muted hover:bg-slate-100'}"
          onclick={() => (viewMode = 'list')}
        >
          List
        </button>
      </div>
    </div>
  </header>

  {#if viewMode === 'grid'}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filtered as vehicle}
        <div class="card p-4">
          <div class="flex items-start justify-between gap-2">
            <h2 class="font-semibold text-slate-900">{vehicle.name}</h2>
            <span class="badge badge-{vehicle.status} shrink-0">{vehicle.status}</span>
          </div>
          <dl class="mt-3 space-y-1 text-sm text-muted">
            {#if vehicle.odometer != null}
              <div><dt class="inline font-medium">Odometer:</dt> <dd class="inline">{vehicle.odometer.toLocaleString()} mi</dd></div>
            {/if}
            {#if vehicle.lastService}
              <div><dt class="inline font-medium">Last service:</dt> <dd class="inline">{vehicle.lastService}</dd></div>
            {/if}
            {#if vehicle.nextService}
              <div><dt class="inline font-medium">Next service:</dt> <dd class="inline">{vehicle.nextService}</dd></div>
            {/if}
            {#if vehicle.driver}
              <div><dt class="inline font-medium">Driver:</dt> <dd class="inline">{vehicle.driver}</dd></div>
            {/if}
          </dl>
        </div>
      {/each}
    </div>
  {:else}
    <div class="card table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Odometer</th>
            <th>Last service</th>
            <th>Next service</th>
            <th>Driver</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as vehicle}
            <tr>
              <td class="font-medium">{vehicle.name}</td>
              <td><span class="badge badge-{vehicle.status}">{vehicle.status}</span></td>
              <td class="text-muted">{vehicle.odometer != null ? vehicle.odometer.toLocaleString() + ' mi' : '—'}</td>
              <td class="text-muted">{vehicle.lastService ?? '—'}</td>
              <td class="text-muted">{vehicle.nextService ?? '—'}</td>
              <td class="text-muted">{vehicle.driver ?? '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if filtered.length === 0}
    <p class="text-muted py-8">No vehicles match the selected filter.</p>
  {/if}
</div>
