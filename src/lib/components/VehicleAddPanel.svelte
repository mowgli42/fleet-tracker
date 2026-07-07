<script lang="ts">
  import type { VehicleStatus, VehicleRole } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import { registerVehicle } from '$lib/vehicle/vehicleRules';

  const statusOptions: { value: VehicleStatus; label: string }[] = [
    { value: 'ready', label: 'Ready' },
    { value: 'in-use', label: 'In use' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'out-of-service', label: 'Out of service' },
    { value: 'reserved', label: 'Reserved' }
  ];
  const roleOptions: { value: VehicleRole; label: string }[] = [
    { value: 'pool', label: 'Pool' },
    { value: 'primary', label: 'Primary' },
    { value: 'backup', label: 'Backup' }
  ];

  let { onClose }: { onClose: () => void } = $props();

  let form = $state({
    id: '',
    name: '',
    status: 'ready' as VehicleStatus,
    role: 'pool' as VehicleRole,
    odometer: '',
    vin: ''
  });

  const fleet = $derived($fleetDataStore);

  function generateId(): string {
    const numericIds = fleet.vehicles
      .map((v) => v.id.replace(/^v-?/, ''))
      .filter((s) => /^\d+$/.test(s))
      .map((n) => parseInt(n, 10));
    const max = numericIds.length ? Math.max(...numericIds) : 0;
    return 'v' + (max + 1);
  }

  function saveVehicle() {
    const id = form.id.trim() || generateId();
    const result = registerVehicle(
      fleet.vehicles,
      {
        name: form.name,
        status: form.status,
        role: form.role,
        odometer: parseInt(String(form.odometer), 10) || undefined,
        vin: form.vin.trim() || undefined
      },
      id
    );
    if (!result.ok) {
      alert(result.message);
      return;
    }
    saveFleetData({ ...fleet, vehicles: [...fleet.vehicles, result.vehicle] });
    onClose();
  }
</script>

<div
  class="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)]"
  role="dialog"
  aria-labelledby="vehicle-add-title"
>
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="vehicle-add-title" class="font-display font-semibold">Add vehicle</h2>
    <button type="button" class="p-2 rounded-md text-muted hover:bg-slate-100" aria-label="Close" onclick={onClose}>✕</button>
  </div>
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    <div>
      <label for="vehicle-add-id" class="block text-sm font-medium text-slate-700 mb-1">ID (optional, auto if empty)</label>
      <input
        id="vehicle-add-id"
        type="text"
        bind:value={form.id}
        placeholder="e.g. v11"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="vehicle-add-name" class="block text-sm font-medium text-slate-700 mb-1">Name *</label>
      <input
        id="vehicle-add-name"
        type="text"
        bind:value={form.name}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="vehicle-add-status" class="block text-sm font-medium text-slate-700 mb-1">Status</label>
      <select
        id="vehicle-add-status"
        bind:value={form.status}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each statusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="vehicle-add-role" class="block text-sm font-medium text-slate-700 mb-1">Role</label>
      <select
        id="vehicle-add-role"
        bind:value={form.role}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each roleOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="vehicle-add-odometer" class="block text-sm font-medium text-slate-700 mb-1">Odometer</label>
      <input
        id="vehicle-add-odometer"
        type="number"
        bind:value={form.odometer}
        min="0"
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="vehicle-add-vin" class="block text-sm font-medium text-slate-700 mb-1">VIN (optional)</label>
      <input
        id="vehicle-add-vin"
        type="text"
        bind:value={form.vin}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)]">
    <button type="button" class="btn btn-primary w-full" onclick={saveVehicle}>Add vehicle</button>
  </div>
</div>
