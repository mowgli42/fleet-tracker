<script lang="ts">
  import type {
    MaintenanceJob,
    JobPriority,
    JobStatus,
    ServiceType,
    MaintenanceJobHistoryEntry
  } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import SlideToRemove from '$lib/components/SlideToRemove.svelte';

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

  let { job, vehicleName = '', onClose, onRemove }: { job: MaintenanceJob; vehicleName?: string; onClose: () => void; onRemove?: () => void } = $props();

  let form = $state({
    title: '',
    description: '',
    priority: 'medium' as JobPriority,
    status: 'open' as JobStatus,
    dueDate: '',
    component: '',
    serviceType: 'other' as ServiceType,
    planned: false,
    assignedTo: '',
    laborHoursActual: '' as number | string,
    odometerAtJobOpen: '' as number | string,
    odometerAtCompletion: '' as number | string,
    tirePosition: '',
    tireSpec: '',
    failureCode: ''
  });

  $effect(() => {
    form.title = job.title;
    form.description = job.description;
    form.priority = job.priority;
    form.status = job.status;
    form.dueDate = job.dueDate ?? '';
    form.component = job.component ?? '';
    form.serviceType = (job.serviceType ?? 'other') as ServiceType;
    form.planned = job.planned;
    form.assignedTo = job.assignedTo ?? '';
    form.laborHoursActual = job.laborHoursActual ?? '';
    form.odometerAtJobOpen = job.odometerAtJobOpen ?? '';
    form.odometerAtCompletion = job.odometerAtCompletion ?? '';
    form.tirePosition = job.tirePosition ?? '';
    form.tireSpec = job.tireSpec ?? '';
    form.failureCode = job.failureCode ?? '';
  });

  const fleet = $derived($fleetDataStore);

  function saveJob() {
    const now = new Date().toISOString().slice(0, 10);
    const newStatus = form.status;
    const prevStatus = job.status;
    const newHistory: MaintenanceJobHistoryEntry[] = [...(job.history ?? [])];
    if (newStatus !== prevStatus) {
      newHistory.push({
        date: now,
        note: `Status changed to ${newStatus}.`,
        status: newStatus
      });
    }
    const completedAt =
      newStatus === 'completed'
        ? job.completedAt ?? now
        : undefined;
    const startedAt =
      (newStatus === 'in-progress' || newStatus === 'waiting-parts' || newStatus === 'completed') && !job.startedAt
        ? now
        : job.startedAt;

    const updated: MaintenanceJob = {
      ...job,
      title: form.title.trim() || job.title,
      description: form.description.trim() || job.description,
      priority: form.priority,
      status: form.status,
      updatedAt: now,
      history: newHistory,
      dueDate: form.dueDate.trim() || undefined,
      component: form.component.trim() || undefined,
      serviceType: form.serviceType === 'other' ? undefined : form.serviceType,
      planned: form.planned,
      assignedTo: form.assignedTo.trim() || undefined,
      laborHoursActual:
        typeof form.laborHoursActual === 'number'
          ? form.laborHoursActual
          : parseFloat(String(form.laborHoursActual)) || undefined,
      odometerAtJobOpen:
        typeof form.odometerAtJobOpen === 'number'
          ? form.odometerAtJobOpen
          : parseInt(String(form.odometerAtJobOpen), 10) || undefined,
      odometerAtCompletion:
        typeof form.odometerAtCompletion === 'number'
          ? form.odometerAtCompletion
          : parseInt(String(form.odometerAtCompletion), 10) || undefined,
      tirePosition: form.tirePosition.trim() || undefined,
      tireSpec: form.tireSpec.trim() || undefined,
      failureCode: form.failureCode.trim() || undefined,
      completedAt,
      startedAt
    };

    const updatedJobs = fleet.jobs.map((j) => (j.id === job.id ? updated : j));
    saveFleetData({ ...fleet, jobs: updatedJobs });
    onClose();
  }
</script>

<div
  class="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)]"
  role="dialog"
  aria-labelledby="job-edit-title"
>
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="job-edit-title" class="font-display font-semibold">Edit job</h2>
    <button
      type="button"
      class="p-2 rounded-md text-muted hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Close"
      onclick={onClose}
    >
      ✕
    </button>
  </div>
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#if vehicleName}
      <p class="text-sm text-muted">Vehicle: <strong>{vehicleName}</strong></p>
    {/if}

    <div>
      <label for="job-edit-title-field" class="block text-sm font-medium text-slate-700 mb-1">Title</label>
      <input
        id="job-edit-title-field"
        type="text"
        bind:value={form.title}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="job-edit-description" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
      <textarea
        id="job-edit-description"
        bind:value={form.description}
        rows="3"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      ></textarea>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="job-edit-priority" class="block text-sm font-medium text-slate-700 mb-1">Priority</label>
        <select
          id="job-edit-priority"
          bind:value={form.priority}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {#each priorityOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="job-edit-status" class="block text-sm font-medium text-slate-700 mb-1">Status</label>
        <select
          id="job-edit-status"
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
      <label for="job-edit-dueDate" class="block text-sm font-medium text-slate-700 mb-1">Due date</label>
      <input
        id="job-edit-dueDate"
        type="text"
        bind:value={form.dueDate}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="job-edit-component" class="block text-sm font-medium text-slate-700 mb-1">Component</label>
        <input
          id="job-edit-component"
          type="text"
          bind:value={form.component}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label for="job-edit-serviceType" class="block text-sm font-medium text-slate-700 mb-1">Service type</label>
        <select
          id="job-edit-serviceType"
          bind:value={form.serviceType}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {#each serviceTypeOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <input
        id="job-edit-planned"
        type="checkbox"
        bind:checked={form.planned}
        class="rounded border-[var(--border-subtle)] text-accent focus:ring-accent"
      />
      <label for="job-edit-planned" class="text-sm text-slate-700">Planned (scheduled)</label>
    </div>
    <div>
      <label for="job-edit-assignedTo" class="block text-sm font-medium text-slate-700 mb-1">Assigned to</label>
      <input
        id="job-edit-assignedTo"
        type="text"
        bind:value={form.assignedTo}
        placeholder="Technician or bay"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="job-edit-laborHours" class="block text-sm font-medium text-slate-700 mb-1">Labor hours</label>
        <input
          id="job-edit-laborHours"
          type="number"
          bind:value={form.laborHoursActual}
          min="0"
          step="0.5"
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label for="job-edit-failureCode" class="block text-sm font-medium text-slate-700 mb-1">Failure code</label>
        <input
          id="job-edit-failureCode"
          type="text"
          bind:value={form.failureCode}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="job-edit-odoOpen" class="block text-sm font-medium text-slate-700 mb-1">Odometer at open</label>
        <input
          id="job-edit-odoOpen"
          type="number"
          bind:value={form.odometerAtJobOpen}
          min="0"
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label for="job-edit-odoComplete" class="block text-sm font-medium text-slate-700 mb-1">Odometer at completion</label>
        <input
          id="job-edit-odoComplete"
          type="number"
          bind:value={form.odometerAtCompletion}
          min="0"
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="job-edit-tirePosition" class="block text-sm font-medium text-slate-700 mb-1">Tire position</label>
        <input
          id="job-edit-tirePosition"
          type="text"
          bind:value={form.tirePosition}
          placeholder="e.g. FL, FR"
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label for="job-edit-tireSpec" class="block text-sm font-medium text-slate-700 mb-1">Tire spec</label>
        <input
          id="job-edit-tireSpec"
          type="text"
          bind:value={form.tireSpec}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
    {#if onRemove}
      <SlideToRemove
        label="Remove job"
        confirmMessage="Remove this maintenance job? This cannot be undone."
        onRemove={onRemove}
      />
    {/if}
    <button type="button" class="btn btn-primary {onRemove ? 'flex-1 min-w-0' : 'w-full'}" onclick={saveJob}>Save job</button>
  </div>
</div>
