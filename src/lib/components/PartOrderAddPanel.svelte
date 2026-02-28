<script lang="ts">
  import type { PartOrder, PartOrderStatus } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';

  const statusOptions: { value: PartOrderStatus; label: string }[] = [
    { value: 'ordered', label: 'Ordered' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'received', label: 'Received' }
  ];

  let { onClose }: { onClose: () => void } = $props();

  let form = $state({
    partName: '',
    quantity: 1,
    orderDate: '',
    expectedDelivery: '',
    status: 'ordered' as PartOrderStatus,
    maintenanceJobId: ''
  });

  const fleet = $derived($fleetDataStore);

  function savePart() {
    if (!form.partName.trim()) {
      alert('Part name is required.');
      return;
    }
    const newPart: PartOrder = {
      id: 'po-' + Math.random().toString(36).slice(2, 11),
      partName: form.partName.trim(),
      quantity: form.quantity,
      orderDate: form.orderDate.trim() || new Date().toISOString().slice(0, 10),
      expectedDelivery: form.expectedDelivery.trim() || undefined,
      status: form.status,
      maintenanceJobId: form.maintenanceJobId.trim() || undefined
    };
    saveFleetData({ ...fleet, parts: [...fleet.parts, newPart] });
    onClose();
  }
</script>

<div
  class="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)]"
  role="dialog"
  aria-labelledby="part-add-title"
>
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="part-add-title" class="font-display font-semibold">Order part</h2>
    <button type="button" class="p-2 rounded-md text-muted hover:bg-slate-100" aria-label="Close" onclick={onClose}>✕</button>
  </div>
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    <div>
      <label for="part-add-name" class="block text-sm font-medium text-slate-700 mb-1">Part name *</label>
      <input
        id="part-add-name"
        type="text"
        bind:value={form.partName}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="part-add-quantity" class="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
      <input
        id="part-add-quantity"
        type="number"
        bind:value={form.quantity}
        min="1"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="part-add-status" class="block text-sm font-medium text-slate-700 mb-1">Status</label>
      <select
        id="part-add-status"
        bind:value={form.status}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each statusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="part-add-orderDate" class="block text-sm font-medium text-slate-700 mb-1">Order date</label>
      <input
        id="part-add-orderDate"
        type="text"
        bind:value={form.orderDate}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="part-add-expectedDelivery" class="block text-sm font-medium text-slate-700 mb-1">Expected delivery</label>
      <input
        id="part-add-expectedDelivery"
        type="text"
        bind:value={form.expectedDelivery}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="part-add-jobId" class="block text-sm font-medium text-slate-700 mb-1">Related job (optional)</label>
      <select
        id="part-add-jobId"
        bind:value={form.maintenanceJobId}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">None</option>
        {#each fleet.jobs as j}
          <option value={j.id}>{j.title} ({j.id})</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)]">
    <button type="button" class="btn btn-primary w-full" onclick={savePart}>Order part</button>
  </div>
</div>
