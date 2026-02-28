<script lang="ts">
  import { fleetDataStore } from '$lib/stores/fleetData';
  import { computeDashboardData } from '$lib/utils/dashboardSummary';
  import StackedBar from '$lib/components/StackedBar.svelte';

  let { data }: { data: Record<string, never> } = $props();

  const dashboardData = $derived(computeDashboardData($fleetDataStore));

  const statusLabels: Record<string, string> = {
    'in-use': 'In use',
    ready: 'Ready',
    maintenance: 'Maintenance',
    'out-of-service': 'Out of service',
    reserved: 'Reserved'
  };
  const priorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  };

  const vehicleStatusOrder = ['in-use', 'ready', 'maintenance', 'out-of-service', 'reserved'] as const;
  const vehicleStatusColors: Record<string, { bg: string; textColor: string }> = {
    'in-use': { bg: '#dbeafe', textColor: '#1e40af' },
    ready: { bg: '#dcfce7', textColor: '#166534' },
    maintenance: { bg: '#fef3c7', textColor: '#92400e' },
    'out-of-service': { bg: '#fee2e2', textColor: '#991b1b' },
    reserved: { bg: '#f1f5f9', textColor: '#475569' }
  };
  const priorityOrder = ['low', 'medium', 'high', 'critical'] as const;
  const priorityColors: Record<string, { bg: string; textColor: string }> = {
    low: { bg: '#f1f5f9', textColor: '#475569' },
    medium: { bg: '#dbeafe', textColor: '#1e40af' },
    high: { bg: '#fef3c7', textColor: '#92400e' },
    critical: { bg: '#fee2e2', textColor: '#991b1b' }
  };
  const partStatusOrder = ['ordered', 'shipped'] as const;
  const partStatusColors: Record<string, { bg: string; textColor: string }> = {
    ordered: { bg: '#f1f5f9', textColor: '#475569' },
    shipped: { bg: '#dbeafe', textColor: '#1e40af' }
  };

  const vehicleSegments = $derived(
    vehicleStatusOrder.map((status) => ({
      label: statusLabels[status] ?? status,
      count: dashboardData.summary.vehiclesByStatus[status] ?? 0,
      bg: vehicleStatusColors[status].bg,
      textColor: vehicleStatusColors[status].textColor
    }))
  );
  const openJobSegments = $derived(
    priorityOrder.map((priority) => ({
      label: priorityLabels[priority] ?? priority,
      count: dashboardData.summary.openJobsByPriority[priority] ?? 0,
      bg: priorityColors[priority].bg,
      textColor: priorityColors[priority].textColor
    }))
  );
  const partsByStatus = $derived.by(() => {
    const map: Record<string, number> = {};
    for (const p of dashboardData.partsOnOrder) {
      map[p.status] = (map[p.status] ?? 0) + 1;
    }
    return map;
  });
  const partSegments = $derived(
    partStatusOrder.map((status) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      count: partsByStatus[status] ?? 0,
      bg: partStatusColors[status].bg,
      textColor: partStatusColors[status].textColor
    }))
  );

  const componentPalette = [
    { bg: '#dbeafe', textColor: '#1e40af' },
    { bg: '#fef3c7', textColor: '#92400e' },
    { bg: '#dcfce7', textColor: '#166534' },
    { bg: '#f1f5f9', textColor: '#475569' },
    { bg: '#e0e7ff', textColor: '#3730a3' },
    { bg: '#fce7f3', textColor: '#9d174d' }
  ];
  const repairTrendSegments = $derived.by(() => {
    const entries = Object.entries(dashboardData.repairTrendByComponent).sort((a, b) => b[1] - a[1]);
    return entries.map(([component, count], i) => ({
      label: component.charAt(0).toUpperCase() + component.slice(1),
      count,
      bg: componentPalette[i % componentPalette.length].bg,
      textColor: componentPalette[i % componentPalette.length].textColor
    }));
  });
</script>

<div class="dashboard">
  <header class="page-header">
    <div>
      <h1>Dashboard</h1>
      <p class="subtitle">Fleet overview and quick links</p>
    </div>
  </header>

  <section class="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" aria-label="Summary metrics">
    <div class="card p-4 reveal reveal-delay-1">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Vehicles</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{dashboardData.vehicles.length}</p>
      {#if dashboardData.vehicles.length > 0}
        <div class="mt-2">
          <StackedBar segments={vehicleSegments} totalLabel="Vehicles" showLegend={true} />
        </div>
      {/if}
      <a href="/fleet" class="mt-3 text-sm link-accent">View fleet →</a>
    </div>
    <div class="card p-4 reveal reveal-delay-2">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Open maintenance jobs</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{dashboardData.summary.openJobsCount}</p>
      {#if dashboardData.summary.openJobsCount > 0}
        <div class="mt-2">
          <StackedBar segments={openJobSegments} totalLabel="Open jobs" showLegend={true} />
        </div>
      {:else}
        <p class="mt-2 text-xs text-muted">No open jobs</p>
      {/if}
      <a href="/maintenance" class="mt-3 text-sm link-accent">View maintenance →</a>
    </div>
    <div class="card p-4 reveal reveal-delay-3">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Parts on order</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{dashboardData.summary.partsOnOrderCount}</p>
      {#if dashboardData.summary.partsOnOrderCount > 0}
        <div class="mt-2">
          <StackedBar segments={partSegments} totalLabel="Parts" showLegend={true} />
        </div>
      {/if}
      <a href="/parts" class="mt-3 text-sm link-accent">View parts →</a>
    </div>
    <div class="card p-4 reveal reveal-delay-4">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Ready to deploy</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{dashboardData.summary.vehiclesByStatus['ready'] ?? 0}</p>
      <p class="mt-1 text-xs text-muted">vehicles available</p>
      <a href="/fleet?status=ready" class="mt-3 text-sm link-accent">View ready →</a>
    </div>
  </section>

  <section class="mb-6">
    <h2 class="font-display text-base font-semibold mb-2">Availability metrics</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
      <div class="card p-3">
        <p class="text-xs font-medium uppercase tracking-wider text-muted">Fleet availability</p>
        <p class="mt-0.5 text-xl font-display font-semibold">{dashboardData.availabilityPct}%</p>
      </div>
      <div class="card p-3">
        <p class="text-xs font-medium uppercase tracking-wider text-muted">Unplanned jobs</p>
        <p class="mt-0.5 text-xl font-display font-semibold">{dashboardData.unplannedPct}%</p>
      </div>
      <div class="card p-3">
        <p class="text-xs font-medium uppercase tracking-wider text-muted">MTTR (days)</p>
        <p class="mt-0.5 text-xl font-display font-semibold">{dashboardData.mttrDays != null ? dashboardData.mttrDays : '—'}</p>
      </div>
      <div class="card p-3">
        <p class="text-xs font-medium uppercase tracking-wider text-muted">PM compliance</p>
        <p class="mt-0.5 text-xl font-display font-semibold">{dashboardData.pmCompliancePct != null ? dashboardData.pmCompliancePct + '%' : '—'}</p>
      </div>
    </div>
    {#if repairTrendSegments.length > 0}
      <div class="card p-4">
        <h3 class="text-xs font-medium uppercase tracking-wider text-muted mb-2">Repair trend by component</h3>
        <StackedBar segments={repairTrendSegments} totalLabel="Jobs by component" showLegend={true} />
      </div>
    {/if}
  </section>

  {#if dashboardData.urgentJobs.length > 0}
    <section class="mb-6">
      <h2 class="font-display text-base font-semibold mb-2">Urgent maintenance</h2>
      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Vehicle</th>
              <th>Priority</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each dashboardData.urgentJobs as job}
              <tr>
                <td>
                  <a href="/maintenance#job-{job.id}" class="link-accent font-medium">{job.title}</a>
                </td>
                <td class="text-muted">{job.vehicleName ?? job.vehicleId}</td>
                <td><span class="badge badge-{job.priority}">{priorityLabels[job.priority]}</span></td>
                <td><span class="badge badge-{job.status}">{job.status}</span></td>
                <td><a href="/maintenance#job-{job.id}" class="text-sm link-accent">Details</a></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}

  {#if dashboardData.partsOnOrder.length > 0}
    <section>
      <h2 class="font-display text-base font-semibold mb-2">Parts on order</h2>
      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Expected</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each dashboardData.partsOnOrder as part}
              <tr>
                <td class="font-medium">{part.partName}</td>
                <td>{part.quantity}</td>
                <td><span class="badge badge-{part.status}">{part.status}</span></td>
                <td class="text-muted">{part.expectedDelivery || '—'}</td>
                <td><a href="/parts" class="text-sm link-accent">View</a></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>
