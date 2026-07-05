<script lang="ts">
  import type { MaintenanceJob, JobPriority, JobStatus, ServiceType } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import { emitMaintenanceJobDelta } from '$lib/sync/emitMaintenance';
  import { refreshSyncSnapshot } from '$lib/stores/syncRuntime';

  const priorityOptions: { value: JobPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];
  const statusOptions: { value: JobStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'waiting-parts', label: 'Waiting parts' },
    { value: 'completed', label: 'Completed' }
  ];
  const serviceTypeOptions: { value: ServiceType; label: string }[] = [
    { value: 'oil-change', label: 'Oil change' },
    { value: 'fluid-change', label: 'Fluid change' },
    { value: 'tire-replacement', label: 'Tire replacement' },
    { value: 'tire-rotation', label: 'Tire rotation' },
    { value: 'repair', label: 'Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' }
  ];

  let { onClose }: { onClose: () => void } = $props();

  let form = $state({
    vehicleId: '',
    title: '',
    description: '',
    priority: 'medium' as JobPriority,
    status: 'open' as JobStatus,
    serviceType: 'other' as ServiceType,
    planned: false,
    dueDate: '',
    component: ''
  });

  const fleet = $derived($fleetDataStore);

  function saveJob() {
    if (!form.vehicleId.trim()) {
      alert('Select a vehicle.');
      return;
    }
    if (!form.title.trim()) {
      alert('Title is required.');
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const newJob: MaintenanceJob = {
      id: 'mj-' + Math.random().toString(36).slice(2, 11),
      vehicleId: form.vehicleId,
      title: form.title.trim(),
      description: form.description.trim() || '',
      priority: form.priority,
      status: form.status,
      createdAt: now,
      updatedAt: now,
      history: [{ date: now, note: 'Job created.', status: form.status }],
      planned: form.planned,
      serviceType: form.serviceType === 'other' ? undefined : form.serviceType,
      dueDate: form.dueDate.trim() || undefined,
      component: form.component.trim() || undefined
    };
    const updatedJobs = [...fleet.jobs, newJob];
    saveFleetData({ ...fleet, jobs: updatedJobs });
    emitMaintenanceJobDelta(null, newJob);
    refreshSyncSnapshot();
    onClose();
  }
</script>

<div
  class="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)]"
  role="dialog"
  aria-labelledby="job-add-title"
>
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="job-add-title" class="font-display font-semibold">Add maintenance job</h2>
    <button type="button" class="p-2 rounded-md text-muted hover:bg-slate-100" aria-label="Close" onclick={onClose}>✕</button>
  </div>
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    <div>
      <label for="job-add-vehicleId" class="block text-sm font-medium text-slate-700 mb-1">Vehicle *</label>
      <select
        id="job-add-vehicleId"
        bind:value={form.vehicleId}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">Select vehicle</option>
        {#each fleet.vehicles as v}
          <option value={v.id}>{v.name} ({v.id})</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="job-add-title" class="block text-sm font-medium text-slate-700 mb-1">Title *</label>
      <input
        id="job-add-title"
        type="text"
        bind:value={form.title}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="job-add-description" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
      <textarea
        id="job-add-description"
        bind:value={form.description}
        rows="3"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      ></textarea>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="job-add-priority" class="block text-sm font-medium text-slate-700 mb-1">Priority</label>
        <select
          id="job-add-priority"
          bind:value={form.priority}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {#each priorityOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="job-add-status" class="block text-sm font-medium text-slate-700 mb-1">Status</label>
        <select
          id="job-add-status"
          bind:value={form.status}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {#each statusOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
    </div>
    <div>
      <label for="job-add-serviceType" class="block text-sm font-medium text-slate-700 mb-1">Service type</label>
      <select
        id="job-add-serviceType"
        bind:value={form.serviceType}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each serviceTypeOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="job-add-dueDate" class="block text-sm font-medium text-slate-700 mb-1">Due date</label>
      <input
        id="job-add-dueDate"
        type="text"
        bind:value={form.dueDate}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="job-add-component" class="block text-sm font-medium text-slate-700 mb-1">Component</label>
      <input
        id="job-add-component"
        type="text"
        bind:value={form.component}
        placeholder="e.g. brakes, engine"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div class="flex items-center gap-2">
      <input
        id="job-add-planned"
        type="checkbox"
        bind:checked={form.planned}
        class="rounded border-[var(--border-subtle)] text-accent focus:ring-accent"
      />
      <label for="job-add-planned" class="text-sm text-slate-700">Planned (scheduled)</label>
    </div>
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)]">
    <button type="button" class="btn btn-primary w-full" onclick={saveJob}>New job</button>
  </div>
</div>
