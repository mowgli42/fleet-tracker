<script lang="ts">
  import type { MaintenanceJob } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import { emitMaintenanceJobDelta } from '$lib/sync/emitMaintenance';
  import { refreshSyncSnapshot } from '$lib/stores/syncRuntime';
  import Obd2IntakeModal from '$lib/components/Obd2IntakeModal.svelte';
  import MaintenanceJobEditPanel from '$lib/components/MaintenanceJobEditPanel.svelte';
  import MaintenanceJobAddPanel from '$lib/components/MaintenanceJobAddPanel.svelte';
  import IconPencil from '$lib/components/IconPencil.svelte';

  type JobWithVehicle = MaintenanceJob & { vehicleName: string };

  let { data }: { data: { components: string[] } } = $props();

  const fleet = $derived($fleetDataStore);
  const jobs = $derived.by(() => {
    const { jobs: j, vehicles } = fleet;
    const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));
    return j.map((job) => ({
      ...job,
      vehicleName: vehicleById[job.vehicleId]?.name ?? job.vehicleId
    })) as JobWithVehicle[];
  });

  function partsForJob(jobId: string) {
    return fleet.parts.filter((p) => p.maintenanceJobId === jobId);
  }
  function obd2ForJob(snapshotId: string | undefined) {
    if (!snapshotId) return null;
    return fleet.obd2Snapshots.find((s) => s.id === snapshotId);
  }

  const priorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  };

  const statusLabels: Record<string, string> = {
    open: 'Open',
    'in-progress': 'In progress',
    'waiting-parts': 'Waiting parts',
    completed: 'Completed'
  };

  const serviceTypeLabels: Record<string, string> = {
    'oil-change': 'Oil change',
    'fluid-change': 'Fluid change',
    'tire-replacement': 'Tire replacement',
    'tire-rotation': 'Tire rotation',
    repair: 'Repair',
    inspection: 'Inspection',
    other: 'Other'
  };

  type ViewTab = 'by-vehicle' | 'by-type' | 'timeline';
  let viewTab = $state<ViewTab>('by-type');
  let serviceTypeFilter = $state('');
  let priorityFilter = $state('');
  let statusFilter = $state('');
  let componentFilter = $state('');
  let plannedFilter = $state('');
  let showCompleted = $state(false);

  const filtered = $derived(
    jobs.filter((j) => {
      if (!showCompleted && j.status === 'completed') return false;
      if (serviceTypeFilter && (j.serviceType ?? 'other') !== serviceTypeFilter) return false;
      if (priorityFilter && j.priority !== priorityFilter) return false;
      if (statusFilter && j.status !== statusFilter) return false;
      if (componentFilter && (j.component ?? 'other') !== componentFilter) return false;
      if (plannedFilter === 'planned' && !j.planned) return false;
      if (plannedFilter === 'unplanned' && j.planned) return false;
      return true;
    })
  );

  const byVehicle = $derived.by(() => {
    const map = new Map<string, JobWithVehicle[]>();
    for (const j of filtered) {
      const list = map.get(j.vehicleId) ?? [];
      list.push(j);
      map.set(j.vehicleId, list);
    }
    return Array.from(map.entries()).map(([vehicleId, list]) => ({
      vehicleId,
      vehicleName: list[0]?.vehicleName ?? vehicleId,
      jobs: list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }));
  });

  const byType = $derived.by(() => {
    const map = new Map<string, JobWithVehicle[]>();
    for (const j of filtered) {
      const type = j.serviceType ?? 'other';
      const list = map.get(type) ?? [];
      list.push(j);
      map.set(type, list);
    }
    return Array.from(map.entries()).map(([type, list]) => ({
      serviceType: type,
      label: serviceTypeLabels[type] ?? type,
      jobs: list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }));
  });

  const timeline = $derived([...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

  function daysInState(job: JobWithVehicle): number {
    const start = new Date(job.createdAt).getTime();
    const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }

  let expandedId = $state<string | null>(null);
  let obd2JobId = $state<string | null>(null);
  let editingJobId = $state<string | null>(null);
  let showAddJob = $state(false);
  const obd2Job = $derived(obd2JobId ? jobs.find((j) => j.id === obd2JobId) ?? null : null);
  const editingJob = $derived(editingJobId ? fleet.jobs.find((j) => j.id === editingJobId) ?? null : null);

  function toggleHistory(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  function removeJob(jobId: string) {
    const job = fleet.jobs.find((j) => j.id === jobId);
    if (job) {
      // Next shape is synthetic: job is deleted, not completed; "completed" lets emit detect blocking → cleared.
      emitMaintenanceJobDelta(job, { ...job, status: 'completed' });
    }
    const updatedJobs = fleet.jobs.filter((j) => j.id !== jobId);
    const updatedVehicles = fleet.vehicles.map((v) =>
      v.currentJobId === jobId ? { ...v, currentJobId: undefined } : v
    );
    saveFleetData({ ...fleet, jobs: updatedJobs, vehicles: updatedVehicles });
    refreshSyncSnapshot();
    if (editingJobId === jobId) editingJobId = null;
    if (obd2JobId === jobId) obd2JobId = null;
    if (expandedId === jobId) expandedId = null;
  }
</script>

<div class="maintenance-page">
  <header class="page-header">
    <div>
      <h1>Maintenance</h1>
      <p class="subtitle">Open jobs, priority, and history</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="btn btn-primary text-sm" onclick={() => (showAddJob = true)}>New job</button>
      <div class="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-0.5" role="tablist" aria-label="View by">
        <button type="button" role="tab" aria-selected={viewTab === 'by-vehicle'} class="rounded-md px-3 py-1.5 text-sm font-medium transition {viewTab === 'by-vehicle' ? 'bg-slate-200 text-slate-900' : 'text-muted hover:bg-slate-100'}" onclick={() => (viewTab = 'by-vehicle')}>By vehicle</button>
        <button type="button" role="tab" aria-selected={viewTab === 'by-type'} class="rounded-md px-3 py-1.5 text-sm font-medium transition {viewTab === 'by-type' ? 'bg-slate-200 text-slate-900' : 'text-muted hover:bg-slate-100'}" onclick={() => (viewTab = 'by-type')}>By type</button>
        <button type="button" role="tab" aria-selected={viewTab === 'timeline'} class="rounded-md px-3 py-1.5 text-sm font-medium transition {viewTab === 'timeline' ? 'bg-slate-200 text-slate-900' : 'text-muted hover:bg-slate-100'}" onclick={() => (viewTab = 'timeline')}>Timeline</button>
      </div>
      {#if viewTab === 'by-type'}
        <label class="flex items-center gap-2 text-sm text-muted">
          <span>Service type</span>
          <select bind:value={serviceTypeFilter} class="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" aria-label="Filter by service type">
            <option value="">All</option>
            {#each Object.entries(serviceTypeLabels) as [value, label]}
              <option value={value}>{label}</option>
            {/each}
          </select>
        </label>
      {/if}
      <label class="flex items-center gap-2 text-sm text-muted">
        <span>Priority</span>
        <select
          bind:value={priorityFilter}
          class="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by priority"
        >
          <option value="">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm text-muted">
        <span>Status</span>
        <select
          bind:value={statusFilter}
          class="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by status"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in-progress">In progress</option>
          <option value="waiting-parts">Waiting parts</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm text-muted">
        <span>Component</span>
        <select
          bind:value={componentFilter}
          class="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by component"
        >
          <option value="">All</option>
          {#each data.components as c}
            <option value={c}>{c}</option>
          {/each}
          <option value="other">Other</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm text-muted">
        <span>Type</span>
        <select
          bind:value={plannedFilter}
          class="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by planned or unplanned"
        >
          <option value="">All</option>
          <option value="planned">Planned</option>
          <option value="unplanned">Unplanned</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" bind:checked={showCompleted} class="rounded border-[var(--border-subtle)] text-accent focus:ring-accent" />
        <span>Show completed</span>
      </label>
    </div>
  </header>

  {#if viewTab === 'by-vehicle'}
    <div class="space-y-4">
      {#each byVehicle as { vehicleId, vehicleName, jobs: vehicleJobs }}
        <div class="card overflow-hidden">
          <div class="card-header">{vehicleName}</div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-10"></th>
                  <th>Job</th>
                  <th>Service type</th>
                  <th>Due</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {#each vehicleJobs as job (job.id)}
                  <tr>
                    <td>
                      {#if expandedId === job.id}
                        <button type="button" class="p-1 rounded text-muted hover:bg-slate-100" aria-label="Collapse" onclick={() => toggleHistory(job.id)}>&#9660;</button>
                      {:else}
                        <button type="button" class="p-1 rounded text-muted hover:bg-slate-100" aria-label="Expand" onclick={() => toggleHistory(job.id)}>&#9654;</button>
                      {/if}
                    </td>
                    <td>
                      <span id="job-{job.id}" class="font-medium">{job.title}</span>
                      <button type="button" class="ml-2 p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit job" onclick={() => (editingJobId = job.id)}>
                        <IconPencil size={16} />
                      </button>
                    </td>
                    <td class="text-muted text-sm">{serviceTypeLabels[job.serviceType ?? 'other'] ?? job.serviceType ?? '—'}</td>
                    <td class="text-muted text-sm">{job.dueDate ?? '—'}</td>
                    <td><span class="badge badge-{job.priority}">{priorityLabels[job.priority]}</span></td>
                    <td><span class="badge badge-{job.status}">{statusLabels[job.status]}</span></td>
                    <td class="text-muted text-sm">{daysInState(job)}d</td>
                  </tr>
                  {#if expandedId === job.id}
                    <tr class="bg-slate-50/80">
                      <td></td>
                      <td colspan="6" class="py-3">
                        <div class="history-panel pl-4 border-l-2 border-[var(--border-subtle)] space-y-3 text-sm">
                          {#if job.history?.length}
                            <div>
                              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">History</h4>
                              {#each job.history as entry (entry.date + entry.note)}
                                <div><span class="font-medium">{entry.date}</span> {#if entry.status}<span class="badge badge-{entry.status} ml-2">{statusLabels[entry.status]}</span>{/if}
                                  <p class="text-muted mt-0.5">{entry.note}</p>
                                </div>
                              {/each}
                            </div>
                          {/if}
                          {#if partsForJob(job.id).length > 0}
                            <div>
                              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Parts</h4>
                              <ul class="text-muted">
                                {#each partsForJob(job.id) as part}
                                  <li>{part.partName} × {part.quantity} <span class="badge badge-{part.status}">{part.status}</span></li>
                                {/each}
                              </ul>
                            </div>
                          {/if}
                          {#if obd2ForJob(job.obd2SnapshotId)}
                            {@const snap = obd2ForJob(job.obd2SnapshotId)}
                            <div>
                              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">OBD2</h4>
                              {#if snap?.dtcs?.length}
                                <ul class="text-muted text-xs">
                                  {#each snap.dtcs as dtc}
                                    <li>{dtc.code}{dtc.description ? ': ' + dtc.description : ''}</li>
                                  {/each}
                                </ul>
                              {/if}
                              {#if snap?.suggestedTasks?.length}
                                <p class="text-muted text-xs mt-1">Suggested: {snap.suggestedTasks.map(t => t.title).join('; ')}</p>
                              {/if}
                            </div>
                          {/if}
                          <div class="flex flex-wrap items-center gap-2">
                            <a href="/fleet" class="link-accent text-xs">Vehicle: {job.vehicleName}</a>
                            <span>·</span>
                            <a href="/fleet/vehicle/{job.vehicleId}/history" class="link-accent text-xs">View full vehicle history →</a>
                            <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit job" onclick={() => (editingJobId = job.id)} title="Edit job">
                              <IconPencil size={14} />
                            </button>
                            <button type="button" class="text-xs link-accent" onclick={() => (obd2JobId = job.id)}>Add OBD2 data</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}
    </div>
  {:else if viewTab === 'by-type'}
    <div class="space-y-4">
      {#each byType as { serviceType, label, jobs: typeJobs }}
        <div class="card overflow-hidden">
          <div class="card-header">{label}</div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-10"></th>
                  <th>Job</th>
                  <th>Vehicle</th>
                  <th>Due</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {#each typeJobs as job (job.id)}
                  <tr>
                    <td>
                      {#if expandedId === job.id}
                        <button type="button" class="p-1 rounded text-muted hover:bg-slate-100" aria-label="Collapse" onclick={() => toggleHistory(job.id)}>&#9660;</button>
                      {:else}
                        <button type="button" class="p-1 rounded text-muted hover:bg-slate-100" aria-label="Expand" onclick={() => toggleHistory(job.id)}>&#9654;</button>
                      {/if}
                    </td>
                    <td>
                      <span id="job-{job.id}" class="font-medium">{job.title}</span>
                      <button type="button" class="ml-2 p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit job" onclick={() => (editingJobId = job.id)}>
                        <IconPencil size={16} />
                      </button>
                    </td>
                    <td><a href="/fleet" class="link-accent">{job.vehicleName}</a></td>
                    <td class="text-muted text-sm">{job.dueDate ?? '—'}</td>
                    <td><span class="badge badge-{job.priority}">{priorityLabels[job.priority]}</span></td>
                    <td><span class="badge badge-{job.status}">{statusLabels[job.status]}</span></td>
                    <td class="text-muted text-sm">{daysInState(job)}d</td>
                  </tr>
                  {#if expandedId === job.id}
                    <tr class="bg-slate-50/80">
                      <td></td>
                      <td colspan="6" class="py-3">
                        <div class="history-panel pl-4 border-l-2 border-[var(--border-subtle)] space-y-3 text-sm">
                          {#if job.history?.length}
                            <div>
                              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">History</h4>
                              {#each job.history as entry (entry.date + entry.note)}
                                <div><span class="font-medium">{entry.date}</span> {#if entry.status}<span class="badge badge-{entry.status} ml-2">{statusLabels[entry.status]}</span>{/if}
                                  <p class="text-muted mt-0.5">{entry.note}</p>
                                </div>
                              {/each}
                            </div>
                          {/if}
                          {#if partsForJob(job.id).length > 0}
                            <div>
                              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Parts</h4>
                              <ul class="text-muted">
                                {#each partsForJob(job.id) as part}
                                  <li>{part.partName} × {part.quantity} <span class="badge badge-{part.status}">{part.status}</span></li>
                                {/each}
                              </ul>
                            </div>
                          {/if}
                          {#if obd2ForJob(job.obd2SnapshotId)}
                            {@const snap = obd2ForJob(job.obd2SnapshotId)}
                            <div>
                              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">OBD2</h4>
                              {#if snap?.dtcs?.length}
                                <ul class="text-muted text-xs">
                                  {#each snap.dtcs as dtc}
                                    <li>{dtc.code}{dtc.description ? ': ' + dtc.description : ''}</li>
                                  {/each}
                                </ul>
                              {/if}
                              {#if snap?.suggestedTasks?.length}
                                <p class="text-muted text-xs mt-1">Suggested: {snap.suggestedTasks.map(t => t.title).join('; ')}</p>
                              {/if}
                            </div>
                          {/if}
                          <div class="flex flex-wrap items-center gap-2">
                            <a href="/fleet" class="link-accent text-xs">Vehicle: {job.vehicleName}</a>
                            <span>·</span>
                            <a href="/fleet/vehicle/{job.vehicleId}/history" class="link-accent text-xs">View full vehicle history →</a>
                            <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit job" onclick={() => (editingJobId = job.id)} title="Edit job">
                              <IconPencil size={14} />
                            </button>
                            <button type="button" class="text-xs link-accent" onclick={() => (obd2JobId = job.id)}>Add OBD2 data</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}
    </div>
  {:else}
  <div class="card table-container">
    <table class="table">
      <thead>
        <tr>
          <th class="w-10" aria-label="Expand history"></th>
          <th>Job</th>
          <th>Vehicle</th>
          <th>Service type</th>
          <th>Component</th>
          <th>Type</th>
          <th>Due</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Time in state</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {#each timeline as job (job.id)}
          <tr>
            <td>
              {#if expandedId === job.id}
                <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1" aria-label="Collapse history" onclick={() => toggleHistory(job.id)}>&#9660;</button>
              {:else}
                <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1" aria-label="Expand history" onclick={() => toggleHistory(job.id)}>&#9654;</button>
              {/if}
            </td>
            <td>
              <span id="job-{job.id}" class="font-medium">{job.title}</span>
              <button type="button" class="ml-2 p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit job" onclick={() => (editingJobId = job.id)}>
                <IconPencil size={16} />
              </button>
              <p class="text-xs text-muted mt-0.5 line-clamp-1">{job.description}</p>
            </td>
            <td>
              <a href="/fleet" class="link-accent">{job.vehicleName}</a>
            </td>
            <td class="text-muted text-sm">{serviceTypeLabels[job.serviceType ?? 'other'] ?? '—'}</td>
            <td class="text-muted text-sm capitalize">{job.component ?? '—'}</td>
            <td><span class="badge {job.planned ? 'badge-low' : 'badge-high'}">{job.planned ? 'Planned' : 'Unplanned'}</span></td>
            <td class="text-muted text-sm">{job.dueDate ?? '—'}</td>
            <td><span class="badge badge-{job.priority}">{priorityLabels[job.priority]}</span></td>
            <td><span class="badge badge-{job.status}">{statusLabels[job.status]}</span></td>
            <td class="text-muted text-sm">{daysInState(job)}d</td>
            <td class="text-muted text-sm">{job.updatedAt}</td>
          </tr>
          {#if expandedId === job.id}
            <tr class="bg-slate-50/80">
              <td></td>
              <td colspan="10" class="py-3">
                <div class="history-panel pl-4 border-l-2 border-[var(--border-subtle)] space-y-3 text-sm">
                  {#if job.history?.length}
                    <div>
                      <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">History</h4>
                      {#each job.history as entry (entry.date + entry.note)}
                        <div><span class="font-medium">{entry.date}</span> {#if entry.status}<span class="badge badge-{entry.status} ml-2">{statusLabels[entry.status]}</span>{/if}
                          <p class="text-muted mt-0.5">{entry.note}</p>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  {#if partsForJob(job.id).length > 0}
                    <div>
                      <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Parts</h4>
                      <ul class="text-muted">
                        {#each partsForJob(job.id) as part}
                          <li>{part.partName} × {part.quantity} <span class="badge badge-{part.status}">{part.status}</span></li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                  {#if obd2ForJob(job.obd2SnapshotId)}
                    {@const snap = obd2ForJob(job.obd2SnapshotId)}
                    <div>
                      <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">OBD2</h4>
                      {#if snap?.dtcs?.length}
                        <ul class="text-muted text-xs">
                          {#each snap.dtcs as dtc}
                            <li>{dtc.code}{dtc.description ? ': ' + dtc.description : ''}</li>
                          {/each}
                        </ul>
                      {/if}
                      {#if snap?.suggestedTasks?.length}
                        <p class="text-muted text-xs mt-1">Suggested: {snap.suggestedTasks.map(t => t.title).join('; ')}</p>
                      {/if}
                    </div>
                  {/if}
                  <div class="flex flex-wrap items-center gap-2">
                    <a href="/fleet" class="link-accent text-xs">Vehicle: {job.vehicleName}</a>
                    <span>·</span>
                    <a href="/fleet/vehicle/{job.vehicleId}/history" class="link-accent text-xs">View full vehicle history →</a>
                    <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit job" onclick={() => (editingJobId = job.id)} title="Edit job">
                      <IconPencil size={14} />
                    </button>
                    <button type="button" class="text-xs link-accent" onclick={() => (obd2JobId = job.id)}>Add OBD2 data</button>
                  </div>
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>

  {/if}

  {#if showAddJob}
    <div class="fixed inset-0 z-40 bg-black/30" role="presentation" onclick={() => (showAddJob = false)}></div>
    <MaintenanceJobAddPanel onClose={() => (showAddJob = false)} />
  {/if}
  {#if editingJob}
    <div class="fixed inset-0 z-40 bg-black/30" role="presentation" onclick={() => (editingJobId = null)}></div>
    <MaintenanceJobEditPanel
      job={editingJob}
      vehicleName={jobs.find((j) => j.id === editingJob.id)?.vehicleName}
      onClose={() => (editingJobId = null)}
      onRemove={() => removeJob(editingJob.id)}
    />
  {/if}
  {#if obd2Job}
    <Obd2IntakeModal job={obd2Job} onClose={() => (obd2JobId = null)} />
  {/if}

  {#if filtered.length === 0}
    <p class="text-muted py-8">No maintenance jobs match the filters.</p>
  {/if}
</div>
