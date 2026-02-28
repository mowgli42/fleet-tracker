<script lang="ts">
  import type { PartOrder, PartOrderStatus } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import SlideToRemove from '$lib/components/SlideToRemove.svelte';

  const statusOptions: { value: PartOrderStatus; label: string }[] = [
    { value: 'ordered', label: 'Ordered' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'received', label: 'Received' }
  ];

  let { part, onClose, onRemove }: { part: PartOrder; onClose: () => void; onRemove?: () => void } = $props();

  let form = $state({
    status: 'ordered' as PartOrderStatus,
    orderDate: '',
    expectedDelivery: '',
    receivedAt: '',
    quantityUsed: '' as number | string
  });

  $effect(() => {
    form.status = part.status;
    form.orderDate = part.orderDate ?? '';
    form.expectedDelivery = part.expectedDelivery ?? '';
    form.receivedAt = part.receivedAt ?? '';
    form.quantityUsed = part.quantityUsed ?? '';
  });

  const fleet = $derived($fleetDataStore);

  function savePart() {
    const now = new Date().toISOString().slice(0, 10);
    const receivedAt =
      form.status === 'received'
        ? (form.receivedAt.trim() || now)
        : undefined;
    const updated: PartOrder = {
      ...part,
      status: form.status,
      orderDate: form.orderDate.trim() || part.orderDate,
      expectedDelivery: form.expectedDelivery.trim() || undefined,
      receivedAt,
      quantityUsed:
        typeof form.quantityUsed === 'number'
          ? form.quantityUsed
          : parseInt(String(form.quantityUsed), 10) || undefined
    };
    const updatedParts = fleet.parts.map((p) => (p.id === part.id ? updated : p));
    saveFleetData({ ...fleet, parts: updatedParts });
    onClose();
  }
</script>

<div
  class="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)]"
  role="dialog"
  aria-labelledby="part-edit-title"
>
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="part-edit-title" class="font-display font-semibold">Edit part order</h2>
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
    <p class="text-sm font-medium text-slate-700">{part.partName}</p>
    <p class="text-sm text-muted">Quantity: {part.quantity}</p>

    <div>
      <label for="part-edit-status" class="block text-sm font-medium text-slate-700 mb-1">Status</label>
      <select
        id="part-edit-status"
        bind:value={form.status}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each statusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="part-edit-orderDate" class="block text-sm font-medium text-slate-700 mb-1">Order date</label>
      <input
        id="part-edit-orderDate"
        type="text"
        bind:value={form.orderDate}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="part-edit-expectedDelivery" class="block text-sm font-medium text-slate-700 mb-1">Expected delivery</label>
      <input
        id="part-edit-expectedDelivery"
        type="text"
        bind:value={form.expectedDelivery}
        placeholder="YYYY-MM-DD"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    {#if form.status === 'received'}
      <div>
        <label for="part-edit-receivedAt" class="block text-sm font-medium text-slate-700 mb-1">Received date</label>
        <input
          id="part-edit-receivedAt"
          type="text"
          bind:value={form.receivedAt}
          placeholder="YYYY-MM-DD"
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label for="part-edit-quantityUsed" class="block text-sm font-medium text-slate-700 mb-1">Quantity used</label>
        <input
          id="part-edit-quantityUsed"
          type="number"
          bind:value={form.quantityUsed}
          min="0"
          max={part.quantity}
          class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    {/if}
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
    {#if onRemove}
      <SlideToRemove
        label="Remove part"
        confirmMessage="Remove this part order?"
        onRemove={onRemove}
      />
    {/if}
    <button type="button" class="btn btn-primary {onRemove ? 'flex-1 min-w-0' : 'w-full'}" onclick={savePart}>Save</button>
  </div>
</div>
