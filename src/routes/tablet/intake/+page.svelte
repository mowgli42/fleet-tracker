<script lang="ts">
  import { goto } from '$app/navigation';
  import TabletWorkflowStepper from '$lib/components/tablet/TabletWorkflowStepper.svelte';
  import type { JobPriority, MaintenanceJob } from '$lib/types/fleet';
  import { get } from 'svelte/store';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';

  const intakeSteps = [{ label: 'Identify' }, { label: 'Inspect' }, { label: 'Follow-up' }];

  let step = $state(1);
  let selectedId = $state<string | null>(null);
  let vinQuery = $state('');

  let ckTires = $state(false);
  let ckLights = $state(false);
  let ckFluids = $state(false);
  let ckBrakes = $state(false);
  let ckBody = $state(false);

  let flagMaintenance = $state(false);
  let issueTitle = $state('');
  let issuePriority = $state<JobPriority>('medium');
  let pullForService = $state(false);

  const fleet = $derived.by(() => get(fleetDataStore));

  const filtered = $derived.by(() => {
    const q = vinQuery.trim().toLowerCase();
    if (!q) return fleet.vehicles;
    return fleet.vehicles.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.vin && v.vin.toLowerCase().includes(q))
    );
  });

  function selectVehicle(id: string) {
    selectedId = id;
    step = 2;
  }

  function completeInspection() {
    if (!selectedId) return;
    const fleet = get(fleetDataStore);
    const today = new Date().toISOString().slice(0, 10);
    let vehicles = fleet.vehicles.map((v) =>
      v.id === selectedId ? { ...v, intakeAt: v.intakeAt ?? today } : v
    );
    let jobs = [...fleet.jobs];
    const openJob = flagMaintenance && issueTitle.trim();
    if (openJob) {
      const id = `mj-intake-${Date.now()}`;
      const job: MaintenanceJob = {
        id,
        vehicleId: selectedId,
        title: issueTitle.trim(),
        description: 'Reported during tablet intake inspection.',
        priority: issuePriority,
        status: 'open',
        createdAt: today,
        updatedAt: today,
        planned: false,
        component: 'other',
        serviceType: 'inspection',
        history: [{ date: today, note: 'Opened from intake workflow.', status: 'open' }]
      };
      jobs = [...jobs, job];
      if (pullForService) {
        vehicles = vehicles.map((v) =>
          v.id === selectedId ? { ...v, currentJobId: id, status: 'maintenance' as const } : v
        );
      }
    } else if (pullForService) {
      vehicles = vehicles.map((v) =>
        v.id === selectedId ? { ...v, status: 'maintenance' as const } : v
      );
    }
    saveFleetData({ ...fleet, vehicles, jobs });
    goto(`/tablet/vehicle/${selectedId}`);
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="font-display text-xl font-semibold" style="color: var(--proto-text);">Intake & inspection</h1>
    <p class="mt-1 text-sm" style="color: var(--proto-muted);">
      Identify the unit, run the checklist, optionally open maintenance.
    </p>
  </div>

  <TabletWorkflowStepper steps={intakeSteps} current={step - 1} ariaLabel="Intake workflow progress" />

  {#if step === 1}
    <div class="proto-card space-y-3 p-4">
      <label class="block">
        <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--proto-muted);">Search / VIN</span>
        <input
          type="search"
          bind:value={vinQuery}
          placeholder="Name, id, or VIN"
          class="mt-1 w-full rounded-lg border px-3 py-3 text-base outline-none ring-teal-500/30 focus:ring-2"
          style="background: var(--proto-bg); border-color: var(--proto-border); color: var(--proto-text);"
        />
      </label>
      <ul class="max-h-64 space-y-1 overflow-y-auto">
        {#each filtered as v}
          <li>
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition hover:opacity-95"
              style="border-color: var(--proto-border); color: var(--proto-text); background: var(--proto-surface-elevated);"
              onclick={() => selectVehicle(v.id)}
            >
              <span class="font-medium">{v.name}</span>
              <span class="font-mono text-[11px]" style="color: var(--proto-muted);">{v.vin ?? v.id}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else if step === 2}
    {@const v = fleet.vehicles.find((x) => x.id === selectedId)}
    <div class="proto-card space-y-4 p-4">
      {#if v}
        <p class="m-0 text-sm" style="color: var(--proto-muted);">Unit</p>
        <p class="m-0 font-display text-lg font-semibold" style="color: var(--proto-text);">{v.name}</p>
      {/if}
      <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--proto-muted);">Inspection checklist</p>
      <div class="space-y-2">
        <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
          <input type="checkbox" bind:checked={ckTires} class="h-5 w-5 rounded border-slate-500" />
          <span class="text-sm" style="color: var(--proto-text);">Tires</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
          <input type="checkbox" bind:checked={ckLights} class="h-5 w-5 rounded border-slate-500" />
          <span class="text-sm" style="color: var(--proto-text);">Lights</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
          <input type="checkbox" bind:checked={ckFluids} class="h-5 w-5 rounded border-slate-500" />
          <span class="text-sm" style="color: var(--proto-text);">Fluids</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
          <input type="checkbox" bind:checked={ckBrakes} class="h-5 w-5 rounded border-slate-500" />
          <span class="text-sm" style="color: var(--proto-text);">Brakes</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
          <input type="checkbox" bind:checked={ckBody} class="h-5 w-5 rounded border-slate-500" />
          <span class="text-sm" style="color: var(--proto-text);">Body / glass</span>
        </label>
      </div>
      <div class="flex gap-2 pt-2">
        <button type="button" class="proto-btn-ghost flex-1" onclick={() => (step = 1)}>Back</button>
        <button type="button" class="proto-btn-primary flex-1" onclick={() => (step = 3)}>Continue</button>
      </div>
    </div>
  {:else}
    <div class="proto-card space-y-4 p-4">
      <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--proto-muted);">Follow-up</p>
      <label class="flex cursor-pointer items-center gap-3">
        <input type="checkbox" bind:checked={flagMaintenance} class="h-5 w-5" />
        <span class="text-sm" style="color: var(--proto-text);">Flag new maintenance</span>
      </label>
      {#if flagMaintenance}
        <label class="block">
          <span class="text-xs" style="color: var(--proto-muted);">Issue title</span>
          <input
            bind:value={issueTitle}
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style="background: var(--proto-bg); border-color: var(--proto-border); color: var(--proto-text);"
            placeholder="e.g. Rear brake noise"
          />
        </label>
        <label class="block">
          <span class="text-xs" style="color: var(--proto-muted);">Priority</span>
          <select
            bind:value={issuePriority}
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style="background: var(--proto-bg); border-color: var(--proto-border); color: var(--proto-text);"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
      {/if}
      <label class="flex cursor-pointer items-center gap-3">
        <input type="checkbox" bind:checked={pullForService} class="h-5 w-5" />
        <span class="text-sm" style="color: var(--proto-text);">Pull for service (sets maintenance when a job is created, or status only)</span>
      </label>
      <div class="flex gap-2 pt-2">
        <button type="button" class="proto-btn-ghost flex-1" onclick={() => (step = 2)}>Back</button>
        <button type="button" class="proto-btn-primary flex-1" onclick={completeInspection}>Finish</button>
      </div>
    </div>
  {/if}
</div>
