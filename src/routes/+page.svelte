<script lang="ts">
  import type { Vehicle, MaintenanceJob, PartOrder } from '$lib/types/fleet';

  interface Summary {
    vehiclesByStatus: Record<string, number>;
    openJobsCount: number;
    openJobsByPriority: Record<string, number>;
    partsOnOrderCount: number;
  }

  let { data }: { data: { vehicles: Vehicle[]; summary: Summary; urgentJobs: MaintenanceJob[]; partsOnOrder: PartOrder[] } } = $props();

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
      <p class="mt-1 text-2xl font-display font-semibold">{data.vehicles.length}</p>
      <ul class="mt-2 text-xs text-muted space-y-0.5">
        {#each Object.entries(data.summary.vehiclesByStatus) as [status, count]}
          <li>{statusLabels[status] ?? status}: {count}</li>
        {/each}
      </ul>
      <a href="/fleet" class="mt-3 text-sm link-accent">View fleet →</a>
    </div>
    <div class="card p-4 reveal reveal-delay-2">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Open maintenance jobs</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{data.summary.openJobsCount}</p>
      <ul class="mt-2 text-xs text-muted space-y-0.5">
        {#each Object.entries(data.summary.openJobsByPriority) as [priority, count]}
          <li>{priorityLabels[priority] ?? priority}: {count}</li>
        {/each}
      </ul>
      <a href="/maintenance" class="mt-3 text-sm link-accent">View maintenance →</a>
    </div>
    <div class="card p-4 reveal reveal-delay-3">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Parts on order</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{data.summary.partsOnOrderCount}</p>
      <a href="/parts" class="mt-3 text-sm link-accent">View parts →</a>
    </div>
    <div class="card p-4 reveal reveal-delay-4">
      <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Ready to deploy</h2>
      <p class="mt-1 text-2xl font-display font-semibold">{data.summary.vehiclesByStatus['ready'] ?? 0}</p>
      <p class="mt-1 text-xs text-muted">vehicles available</p>
      <a href="/fleet?status=ready" class="mt-3 text-sm link-accent">View ready →</a>
    </div>
  </section>

  {#if data.urgentJobs.length > 0}
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
            {#each data.urgentJobs as job}
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

  {#if data.partsOnOrder.length > 0}
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
            {#each data.partsOnOrder as part}
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
