<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import TabletWorkflowStepper from '$lib/components/tablet/TabletWorkflowStepper.svelte';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import { emitMaintenanceJobDelta } from '$lib/sync/emitMaintenance';
  import { refreshSyncSnapshot } from '$lib/stores/syncRuntime';
  import {
    canCompleteReturnToService,
    canStartShopWork,
    isRtsChecklistComplete,
    partsCompleteForJob
  } from '$lib/tablet/tabletJobWorkflowRules';
  import type { MaintenanceJob, PartOrder, PartOrderStatus } from '$lib/types/fleet';
  import { get } from 'svelte/store';

  const jobId = $derived($page.params.jobId ?? '');
  const fleet = $derived.by(() => get(fleetDataStore));
  const job = $derived(fleet.jobs.find((j) => j.id === jobId));
  const vehicle = $derived(job ? fleet.vehicles.find((v) => v.id === job.vehicleId) : undefined);
  const jobParts = $derived(fleet.parts.filter((p) => p.maintenanceJobId === jobId));

  /** 0 Parts · 1 Work · 2 Return */
  let pane = $state(0);

  let ckPostRepairInspection = $state(false);
  let ckFluidsVerified = $state(false);
  let ckTorqueSafety = $state(false);
  let ckTestDrive = $state(false);
  let ckPaperworkKeys = $state(false);

  let newPartName = $state('');
  let newPartQty = $state(1);
  let partsOverride = $state(false);

  const maintenanceSteps = [{ label: 'Incoming parts' }, { label: 'Shop work' }, { label: 'Return to service' }];

  const partsComplete = $derived(partsCompleteForJob(fleet.parts, jobId));

  const canStartWork = $derived.by(() => {
    if (!job) return false;
    return canStartShopWork(job, fleet.parts, partsOverride);
  });

  const rtsChecklist = $derived({
    postRepairInspection: ckPostRepairInspection,
    fluidsVerified: ckFluidsVerified,
    torqueSafety: ckTorqueSafety,
    testDrive: ckTestDrive,
    paperworkKeys: ckPaperworkKeys
  });

  const rtsChecklistComplete = $derived(isRtsChecklistComplete(rtsChecklist));

  function advancePart(po: PartOrder) {
    const next: Record<PartOrderStatus, PartOrderStatus | null> = {
      ordered: 'shipped',
      shipped: 'received',
      received: null
    };
    const n = next[po.status];
    if (!n) return;
    const fleetNow = get(fleetDataStore);
    const jNow = fleetNow.jobs.find((x) => x.id === jobId);
    if (!jNow) return;
    const today = new Date().toISOString().slice(0, 10);
    const parts = fleetNow.parts.map((p) =>
      p.id === po.id
        ? {
            ...p,
            status: n,
            ...(n === 'received' ? { receivedAt: today } : {})
          }
        : p
    );
    let jobs = fleetNow.jobs;
    if (
      jNow.status === 'waiting-parts' &&
      parts.filter((x) => x.maintenanceJobId === jobId).every((x) => x.status === 'received')
    ) {
      jobs = fleetNow.jobs.map((j) =>
        j.id === jNow.id
          ? {
              ...j,
              updatedAt: today,
              history: [...j.history, { date: today, note: 'All linked parts received.', status: j.status }]
            }
          : j
      );
    }
    saveFleetData({ ...fleetNow, parts, jobs });
  }

  function addPartOrder() {
    const fleetNow = get(fleetDataStore);
    const jNow = fleetNow.jobs.find((x) => x.id === jobId);
    if (!jNow || !newPartName.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const id = `po-tab-${Date.now()}`;
    const qty = Math.max(1, Number(newPartQty) || 1);
    const row: PartOrder = {
      id,
      partName: newPartName.trim(),
      quantity: qty,
      orderDate: today,
      status: 'ordered',
      maintenanceJobId: jNow.id
    };
    saveFleetData({ ...fleetNow, parts: [...fleetNow.parts, row] });
    newPartName = '';
    newPartQty = 1;
  }

  function patchJob(updates: Partial<MaintenanceJob>, note: string) {
    const fleetNow = get(fleetDataStore);
    const jNow = fleetNow.jobs.find((x) => x.id === jobId);
    if (!jNow) return;
    const today = new Date().toISOString().slice(0, 10);
    const next: MaintenanceJob = {
      ...jNow,
      ...updates,
      updatedAt: today,
      history: [...jNow.history, { date: today, note, status: updates.status ?? jNow.status }]
    };
    saveFleetData({
      ...fleetNow,
      jobs: fleetNow.jobs.map((j) => (j.id === jNow.id ? next : j))
    });
  }

  function startWork() {
    if (!job || !canStartWork) return;
    const today = new Date().toISOString().slice(0, 10);
    patchJob(
      {
        status: 'in-progress',
        startedAt: job.startedAt ?? today
      },
      'Work started from tablet shop workflow.'
    );
    pane = 1;
  }

  function completeReturnToService() {
    if (!job || !canCompleteReturnToService(job, rtsChecklist)) return;
    const fleetNow = get(fleetDataStore);
    const jNow = fleetNow.jobs.find((x) => x.id === jobId);
    const vNow = jNow ? fleetNow.vehicles.find((v) => v.id === jNow.vehicleId) : undefined;
    if (!jNow || !vNow) return;
    const today = new Date().toISOString().slice(0, 10);
    const completed: MaintenanceJob = {
      ...jNow,
      status: 'completed',
      completedAt: today,
      updatedAt: today,
      history: [
        ...jNow.history,
        { date: today, note: 'Job closed. Vehicle released from maintenance.', status: 'completed' }
      ]
    };
    const vehicles = fleetNow.vehicles.map((v) => {
      if (v.id !== vNow.id) return v;
      if (v.currentJobId && v.currentJobId !== jNow.id) return v;
      return { ...v, status: 'ready' as const, currentJobId: undefined, releasedAt: today };
    });
    saveFleetData({
      ...fleetNow,
      jobs: fleetNow.jobs.map((j) => (j.id === jNow.id ? completed : j)),
      vehicles
    });
    emitMaintenanceJobDelta(jNow, completed);
    refreshSyncSnapshot();
    goto(`/tablet/vehicle/${vNow.id}`);
  }

  function statusBadge(status: PartOrderStatus) {
    const labels: Record<PartOrderStatus, string> = {
      ordered: 'Ordered',
      shipped: 'In transit',
      received: 'Received'
    };
    return labels[status];
  }
</script>

<div class="space-y-5">
  {#if !job || !vehicle}
    <p style="color: var(--proto-danger);">Job not found.</p>
    <a href="/tablet/fleet" class="proto-btn-primary inline-flex text-sm no-underline">Fleet</a>
  {:else}
    <div>
      <a href="/tablet/vehicle/{vehicle.id}" class="text-xs font-medium no-underline hover:underline" style="color: var(--proto-accent);"
        >← {vehicle.name}</a
      >
      <h1 class="mt-2 font-display text-xl font-semibold leading-tight" style="color: var(--proto-text);">{job.title}</h1>
      <p class="m-0 mt-1 text-sm" style="color: var(--proto-muted);">
        {job.priority} priority · {job.component ?? 'General'} · {job.status === 'completed' ? 'Closed' : 'Active work order'}
      </p>
    </div>

    <TabletWorkflowStepper
      steps={maintenanceSteps}
      current={job.status === 'completed' ? 2 : pane}
      allComplete={job.status === 'completed'}
      ariaLabel="Maintenance workflow progress"
    />

    <div class="flex flex-wrap gap-2" role="tablist" aria-label="Workflow section">
      {#each maintenanceSteps as s, i}
        <button
          type="button"
          role="tab"
          class="rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition"
          class:opacity-50={job.status === 'completed' && i < 2}
          style={pane === i
            ? 'border-color: rgba(45,212,191,0.45); background: var(--proto-accent-dim); color: var(--proto-accent);'
            : 'border-color: var(--proto-border); background: var(--proto-surface); color: var(--proto-muted);'}
          aria-selected={pane === i}
          onclick={() => (pane = i)}
        >
          {s.label}
        </button>
      {/each}
    </div>

    {#if job.status === 'completed'}
      <div class="proto-card p-4" style="border-color: rgba(74, 222, 128, 0.35);">
        <p class="m-0 text-sm font-semibold" style="color: var(--proto-success);">This job is closed</p>
        <p class="mt-1 text-sm" style="color: var(--proto-muted);">
          Completed {job.completedAt ?? '—'}. Read-only summary below.
        </p>
      </div>
    {/if}

    {#if pane === 0}
      <section class="proto-card space-y-4 p-4" aria-labelledby="parts-h">
        <h2 id="parts-h" class="m-0 font-display text-sm font-semibold" style="color: var(--proto-text);">Incoming parts</h2>
        <p class="m-0 text-sm" style="color: var(--proto-muted);">
          Track purchase orders tied to this job. Advance status as parts move. Received parts unlock shop work unless you use a supervisor override on the Work tab.
        </p>

        {#if jobParts.length === 0}
          <p class="m-0 text-sm" style="color: var(--proto-muted);">No part orders linked yet.</p>
        {:else}
          <ul class="space-y-3">
            {#each jobParts as po}
              <li class="rounded-lg border p-3" style="border-color: var(--proto-border); background: var(--proto-surface-elevated);">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="m-0 font-medium" style="color: var(--proto-text);">{po.partName}</p>
                    <p class="m-0 mt-0.5 text-xs" style="color: var(--proto-muted);">
                      Qty {po.quantity}
                      {#if po.expectedDelivery}· ETA {po.expectedDelivery}{/if}
                      {#if po.receivedAt}· Received {po.receivedAt}{/if}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style="background: var(--proto-accent-dim); color: var(--proto-accent);"
                  >
                    {statusBadge(po.status)}
                  </span>
                </div>
                {#if job.status !== 'completed' && po.status !== 'received'}
                  <button
                    type="button"
                    class="proto-btn-primary mt-3 w-full text-xs py-2"
                    onclick={() => advancePart(po)}
                  >
                    {po.status === 'ordered' ? 'Mark shipped' : 'Mark received'}
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}

        {#if job.status !== 'completed'}
          <div class="border-t pt-4" style="border-color: var(--proto-border);">
            <p class="m-0 text-xs font-medium uppercase tracking-wide" style="color: var(--proto-muted);">Record a new order</p>
            <div class="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                bind:value={newPartName}
                placeholder="Part description"
                class="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                style="background: var(--proto-bg); border-color: var(--proto-border); color: var(--proto-text);"
              />
              <input
                type="number"
                min="1"
                bind:value={newPartQty}
                class="w-full rounded-lg border px-3 py-2 text-sm sm:w-20"
                style="background: var(--proto-bg); border-color: var(--proto-border); color: var(--proto-text);"
              />
              <button type="button" class="proto-btn-primary shrink-0 py-2 text-sm" onclick={addPartOrder}>Add</button>
            </div>
          </div>
        {/if}

        <p class="m-0 text-xs" style="color: var(--proto-muted);">
          {#if partsComplete}
            <span style="color: var(--proto-success);">All linked parts received.</span>
          {:else}
            Waiting on at least one part before work can start (unless overridden).
          {/if}
        </p>
      </section>
    {:else if pane === 1}
      <section class="proto-card space-y-4 p-4" aria-labelledby="work-h">
        <h2 id="work-h" class="m-0 font-display text-sm font-semibold" style="color: var(--proto-text);">Shop work</h2>

        {#if job.status === 'completed'}
          <dl class="grid grid-cols-2 gap-2 text-sm">
            <dt style="color: var(--proto-muted);">Status</dt>
            <dd class="m-0 capitalize">{job.status}</dd>
            <dt style="color: var(--proto-muted);">Started</dt>
            <dd class="m-0">{job.startedAt ?? '—'}</dd>
            <dt style="color: var(--proto-muted);">Closed</dt>
            <dd class="m-0">{job.completedAt ?? '—'}</dd>
          </dl>
        {:else if job.status === 'in-progress'}
          <p class="m-0 rounded-lg border px-3 py-2 text-sm" style="border-color: rgba(251, 191, 36, 0.35); color: var(--proto-warn);">
            Work in progress. Finish on the vehicle, then use <strong style="color: var(--proto-text);">Return to service</strong> when ready to release.
          </p>
          <p class="m-0 text-sm" style="color: var(--proto-muted);">
            Job opened {job.createdAt} · Last update {job.updatedAt}
          </p>
        {:else}
          {#if job.status === 'waiting-parts' && !partsComplete && !partsOverride}
            <p class="m-0 text-sm" style="color: var(--proto-warn);">
              This job is waiting on parts. Receive shipments on the <button type="button" class="inline p-0 font-semibold underline" style="color: var(--proto-accent);" onclick={() => (pane = 0)}>Incoming parts</button> tab, or check the override below.
            </p>
          {/if}
          <label class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3" style="border-color: var(--proto-border);">
            <input type="checkbox" bind:checked={partsOverride} class="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-500" />
            <span class="text-sm" style="color: var(--proto-text);">
              Supervisor: parts are on hand — allow starting work before all PO lines show “received” (use for will-call / stock pulls).
            </span>
          </label>
          <button
            type="button"
            class="proto-btn-primary w-full"
            disabled={!canStartWork}
            onclick={startWork}
          >
            Start maintenance
          </button>
          {#if !canStartWork}
            <p class="m-0 text-xs" style="color: var(--proto-muted);">Receive parts or enable the supervisor override to continue.</p>
          {/if}
        {/if}
      </section>
    {:else}
      <section class="proto-card space-y-4 p-4" aria-labelledby="rts-h">
        <h2 id="rts-h" class="m-0 font-display text-sm font-semibold" style="color: var(--proto-text);">Return to service</h2>
        <p class="m-0 text-sm" style="color: var(--proto-muted);">
          Complete the release checklist before the vehicle returns to the ready line. All items are required.
        </p>

        {#if job.status === 'completed'}
          <p class="m-0 text-sm" style="color: var(--proto-muted);">Checklist was satisfied at close-out.</p>
        {:else if job.status !== 'in-progress'}
          <p class="m-0 text-sm" style="color: var(--proto-warn);">
            Start shop work first, then return here to release the unit.
          </p>
        {:else}
          <div class="space-y-2">
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
              <input type="checkbox" bind:checked={ckPostRepairInspection} class="h-5 w-5 rounded border-slate-500" />
              <span class="text-sm" style="color: var(--proto-text);">Post-repair inspection signed off</span>
            </label>
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
              <input type="checkbox" bind:checked={ckFluidsVerified} class="h-5 w-5 rounded border-slate-500" />
              <span class="text-sm" style="color: var(--proto-text);">Fluids verified (levels / leaks)</span>
            </label>
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
              <input type="checkbox" bind:checked={ckTorqueSafety} class="h-5 w-5 rounded border-slate-500" />
              <span class="text-sm" style="color: var(--proto-text);">Torque & safety critical fasteners checked</span>
            </label>
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
              <input type="checkbox" bind:checked={ckTestDrive} class="h-5 w-5 rounded border-slate-500" />
              <span class="text-sm" style="color: var(--proto-text);">Test drive / function check OK</span>
            </label>
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2" style="border-color: var(--proto-border);">
              <input type="checkbox" bind:checked={ckPaperworkKeys} class="h-5 w-5 rounded border-slate-500" />
              <span class="text-sm" style="color: var(--proto-text);">Paperwork complete · keys tagged</span>
            </label>
          </div>

          <button
            type="button"
            class="proto-btn-primary w-full"
            disabled={!rtsChecklistComplete}
            onclick={completeReturnToService}
          >
            Complete & put vehicle in service
          </button>
          {#if !rtsChecklistComplete}
            <p class="m-0 text-xs" style="color: var(--proto-muted);">Check every line to enable release.</p>
          {/if}
        {/if}
      </section>
    {/if}
  {/if}
</div>
