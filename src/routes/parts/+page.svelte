<script lang="ts">
  import type { PartOrder } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import PartOrderEditPanel from '$lib/components/PartOrderEditPanel.svelte';
  import PartOrderAddPanel from '$lib/components/PartOrderAddPanel.svelte';
  import IconPencil from '$lib/components/IconPencil.svelte';

  type PartWithJob = PartOrder & { jobTitle?: string; vehicleName?: string };

  let { data }: { data: Record<string, never> } = $props();

  let editingPartId = $state<string | null>(null);
  let showAddPart = $state(false);
  const fleet = $derived($fleetDataStore);
  const editingPart = $derived(
    editingPartId ? fleet.parts.find((p) => p.id === editingPartId) ?? null : null
  );

  function removePart(partId: string) {
    const updated = fleet.parts.filter((p) => p.id !== partId);
    saveFleetData({ ...fleet, parts: updated });
    if (editingPartId === partId) editingPartId = null;
  }

  const parts = $derived.by(() => {
    const { parts: p, jobs, vehicles } = fleet;
    const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));
    const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));
    return p.map((part) => {
      const job = part.maintenanceJobId ? jobById[part.maintenanceJobId] : null;
      const vehicleName = job ? vehicleById[job.vehicleId]?.name : null;
      return { ...part, jobTitle: job?.title, vehicleName } as PartWithJob;
    });
  });

  const statusLabels: Record<string, string> = {
    ordered: 'Ordered',
    shipped: 'Shipped',
    received: 'Received'
  };
</script>

<div class="parts-page">
  <header class="page-header">
    <div>
      <h1>Parts on order</h1>
      <p class="subtitle">Track orders and link to maintenance jobs</p>
    </div>
    <button type="button" class="btn btn-primary text-sm" onclick={() => (showAddPart = true)}>Order part</button>
  </header>

  <div class="card table-container">
    <table class="table">
      <thead>
        <tr>
          <th>Part</th>
          <th>Quantity</th>
          <th>Order date</th>
          <th>Expected delivery</th>
          <th>Status</th>
          <th>Related job</th>
        </tr>
      </thead>
      <tbody>
        {#each parts as part (part.id)}
          <tr>
            <td class="font-medium">{part.partName}</td>
            <td>{part.quantity}</td>
            <td class="text-muted">{part.orderDate || '—'}</td>
            <td class="text-muted">{part.expectedDelivery || '—'}</td>
            <td>
              <span class="badge badge-{part.status}">{statusLabels[part.status]}</span>
              <button type="button" class="ml-2 p-1 rounded text-muted hover:bg-slate-100 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex align-middle" aria-label="Edit part" onclick={() => (editingPartId = part.id)}>
                <IconPencil size={16} />
              </button>
            </td>
            <td>
              {#if part.maintenanceJobId}
                <a href="/maintenance#job-{part.maintenanceJobId}" class="link-accent">
                  {part.jobTitle ?? part.maintenanceJobId}
                </a>
                {#if part.vehicleName}
                  <span class="text-muted text-sm block">{part.vehicleName}</span>
                {/if}
              {:else}
                <span class="text-muted">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if editingPart}
    <div class="fixed inset-0 z-40 bg-black/30" role="presentation" onclick={() => (editingPartId = null)}></div>
    <PartOrderEditPanel part={editingPart} onClose={() => (editingPartId = null)} onRemove={() => removePart(editingPart.id)} />
  {/if}
  {#if showAddPart}
    <div class="fixed inset-0 z-40 bg-black/30" role="presentation" onclick={() => (showAddPart = false)}></div>
    <PartOrderAddPanel onClose={() => (showAddPart = false)} />
  {/if}
</div>
