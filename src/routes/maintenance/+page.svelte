<script lang="ts">
  import type { MaintenanceJob, MaintenanceJobHistoryEntry } from '$lib/types/fleet';

  type JobWithVehicle = MaintenanceJob & { vehicleName: string };

  let { data }: { data: { jobs: JobWithVehicle[] } } = $props();

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

  let priorityFilter = $state('');
  let statusFilter = $state('');
  let showCompleted = $state(false);

  const filtered = $derived(
    data.jobs.filter((j) => {
      if (!showCompleted && j.status === 'completed') return false;
      if (priorityFilter && j.priority !== priorityFilter) return false;
      if (statusFilter && j.status !== statusFilter) return false;
      return true;
    })
  );

  let expandedId = $state<string | null>(null);

  function toggleHistory(id: string) {
    expandedId = expandedId === id ? null : id;
  }
</script>

<div class="maintenance-page">
  <header class="page-header">
    <div>
      <h1>Maintenance</h1>
      <p class="subtitle">Open jobs, priority, and history</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
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
        <input type="checkbox" bind:checked={showCompleted} class="rounded border-[var(--border-subtle)] text-accent focus:ring-accent" />
        <span>Show completed</span>
      </label>
    </div>
  </header>

  <div class="card table-container">
    <table class="table">
      <thead>
        <tr>
          <th class="w-10" aria-label="Expand history"></th>
          <th>Job</th>
          <th>Vehicle</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as job (job.id)}
          <tr>
            <td>
              {#if job.history?.length}
                {#if expandedId === job.id}
                  <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1" aria-label="Collapse history" onclick={() => toggleHistory(job.id)}>&#9660;</button>
                {:else}
                  <button type="button" class="p-1 rounded text-muted hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1" aria-label="Expand history" onclick={() => toggleHistory(job.id)}>&#9654;</button>
                {/if}
              {/if}
            </td>
            <td>
              <span id="job-{job.id}" class="font-medium">{job.title}</span>
              <p class="text-xs text-muted mt-0.5 line-clamp-1">{job.description}</p>
            </td>
            <td>
              <a href="/fleet" class="link-accent">{job.vehicleName}</a>
            </td>
            <td><span class="badge badge-{job.priority}">{priorityLabels[job.priority]}</span></td>
            <td><span class="badge badge-{job.status}">{statusLabels[job.status]}</span></td>
            <td class="text-muted text-sm">{job.updatedAt}</td>
          </tr>
          {#if expandedId === job.id && job.history?.length}
            <tr class="bg-slate-50/80">
              <td></td>
              <td colspan="5" class="py-3">
                <div class="history-panel pl-4 border-l-2 border-[var(--border-subtle)] space-y-2">
                  <h3 class="text-xs font-semibold text-muted uppercase tracking-wide">History</h3>
                  {#each job.history as entry (entry.date + entry.note)}
                    <div class="text-sm">
                      <span class="font-medium">{entry.date}</span>
                      {#if entry.status}
                        <span class="badge badge-{entry.status} ml-2">{statusLabels[entry.status] ?? entry.status}</span>
                      {/if}
                      <p class="text-muted mt-0.5">{entry.note}</p>
                    </div>
                  {/each}
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>

  {#if filtered.length === 0}
    <p class="text-muted py-8">No maintenance jobs match the filters.</p>
  {/if}
</div>
