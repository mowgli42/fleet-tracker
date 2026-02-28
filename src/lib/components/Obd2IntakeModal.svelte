<script lang="ts">
  import type { MaintenanceJob, Obd2Snapshot, Obd2Dtc, Obd2SuggestedTask, JobPriority } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import dtcReference from '$lib/data/dtc-reference.json';

  type DtcEntry = { code: string; description: string };

  let {
    job = null,
    onClose
  }: {
    job: (MaintenanceJob & { vehicleName?: string }) | null;
    onClose: () => void;
  } = $props();

  const fleet = $derived($fleetDataStore);
  let dtcEntries = $state<DtcEntry[]>([{ code: '', description: '' }]);
  let suggestedTasks = $state<Obd2SuggestedTask[]>([]);

  function addDtcRow() {
    dtcEntries = [...dtcEntries, { code: '', description: '' }];
  }
  function removeDtcRow(i: number) {
    dtcEntries = dtcEntries.filter((_, idx) => idx !== i);
  }

  function lookUpSuggestions() {
    const tasks: Obd2SuggestedTask[] = [];
    const seen = new Set<string>();
    for (const { code } of dtcEntries) {
      const c = code.trim().toUpperCase();
      if (!c || seen.has(c)) continue;
      seen.add(c);
      const ref = (dtcReference as Record<string, { title: string; description?: string; priority?: string; component?: string }>)[c];
      if (ref) {
        tasks.push({
          title: ref.title,
          description: ref.description,
          priority: (ref.priority as JobPriority) ?? 'medium',
          component: ref.component
        });
      }
    }
    suggestedTasks = tasks;
  }

  function saveSnapshot() {
    if (!job) return;
    const now = new Date().toISOString().slice(0, 19);
    const dtcs: Obd2Dtc[] = dtcEntries
      .filter((e) => e.code.trim())
      .map((e) => ({
        code: e.code.trim().toUpperCase(),
        description: e.description.trim() || undefined
      }));
    const tasks = suggestedTasks.length > 0 ? suggestedTasks : [];
    for (const { code } of dtcEntries) {
      const c = code.trim().toUpperCase();
      if (!c) continue;
      const ref = (dtcReference as Record<string, { title: string; description?: string; priority?: string; component?: string }>)[c];
      if (ref && !tasks.some((t) => t.title === ref.title)) {
        tasks.push({
          title: ref.title,
          description: ref.description,
          priority: (ref.priority as JobPriority) ?? 'medium',
          component: ref.component
        });
      }
    }
    const snapshot: Obd2Snapshot = {
      id: 'obd2-' + Math.random().toString(36).slice(2, 11),
      vehicleId: job.vehicleId,
      maintenanceJobId: job.id,
      capturedAt: now,
      dtcs,
      suggestedTasks: tasks.length ? tasks : undefined
    };
    const updatedSnapshots = [...fleet.obd2Snapshots, snapshot];
    const updatedJobs = fleet.jobs.map((j) =>
      j.id === job.id ? { ...j, obd2SnapshotId: snapshot.id } : j
    );
    saveFleetData({
      ...fleet,
      obd2Snapshots: updatedSnapshots,
      jobs: updatedJobs
    });
    onClose();
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-labelledby="obd2-modal-title">
  <div class="bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-subtle)] w-full max-w-lg max-h-[90vh] flex flex-col">
    <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
      <h2 id="obd2-modal-title" class="font-display font-semibold">Add OBD2 data</h2>
      <button type="button" class="p-2 rounded text-muted hover:bg-slate-100" aria-label="Close" onclick={onClose}>✕</button>
    </div>
    <div class="p-4 overflow-y-auto space-y-4">
      {#if job}
        <p class="text-sm text-muted">Job: <strong>{job.title}</strong> · {job.vehicleName ?? job.vehicleId}</p>
      {:else}
        <p class="text-sm text-amber-700">Select a job from the maintenance page to link OBD2 data.</p>
      {/if}

      <div>
        <span class="block text-sm font-medium text-slate-700 mb-2" id="dtc-codes-label">DTC codes</span>
        {#each dtcEntries as entry, i}
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. P0300"
              bind:value={entry.code}
              class="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              bind:value={entry.description}
              class="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button type="button" class="rounded-md border border-[var(--border-subtle)] px-2 text-muted hover:bg-slate-100" onclick={() => removeDtcRow(i)} aria-label="Remove row">−</button>
          </div>
        {/each}
        <button type="button" class="text-sm link-accent" onclick={addDtcRow}>+ Add DTC code</button>
      </div>

      <button type="button" class="btn btn-secondary text-sm" onclick={lookUpSuggestions}>Look up suggestions</button>

      {#if suggestedTasks.length > 0}
        <div>
          <h4 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Suggested tasks</h4>
          <ul class="text-sm space-y-1">
            {#each suggestedTasks as task}
              <li><span class="font-medium">{task.title}</span>{#if task.component} <span class="text-muted">({task.component})</span>{/if}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
    <div class="p-4 border-t border-[var(--border-subtle)]">
      <button type="button" class="btn btn-primary w-full" disabled={!job || !dtcEntries.some((e) => e.code.trim())} onclick={saveSnapshot}>Save OBD2 snapshot</button>
    </div>
  </div>
</div>
