<script lang="ts">
  import type { Vehicle, VehicleStatus, VehicleRole, MaintenanceJob } from '$lib/types/fleet';
  import { fleetDataStore, saveFleetData } from '$lib/stores/fleetData';
  import { findVehicleByVin, validateStatusChange } from '$lib/vehicle/vehicleRules';
  import SlideToRemove from '$lib/components/SlideToRemove.svelte';

  const statusOptions: { value: VehicleStatus; label: string }[] = [
    { value: 'in-use', label: 'In use' },
    { value: 'ready', label: 'Ready' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'out-of-service', label: 'Out of service' },
    { value: 'reserved', label: 'Reserved' }
  ];
  const roleOptions: { value: VehicleRole; label: string }[] = [
    { value: 'primary', label: 'Primary' },
    { value: 'backup', label: 'Backup' },
    { value: 'pool', label: 'Pool' }
  ];

  let { vehicle, onClose, onRemove }: { vehicle: Vehicle; onClose: () => void; onRemove?: () => void } = $props();

  let form = $state({
    name: '',
    status: 'ready' as VehicleStatus,
    odometer: '' as number | string,
    driver: '',
    role: 'pool' as VehicleRole,
    lastService: '',
    nextService: '',
    vin: ''
  });

  $effect(() => {
    form.name = vehicle.name;
    form.status = vehicle.status;
    form.odometer = vehicle.odometer ?? '';
    form.driver = vehicle.driver ?? '';
    form.role = vehicle.role ?? 'pool';
    form.lastService = vehicle.lastService ?? '';
    form.nextService = vehicle.nextService ?? '';
    form.vin = vehicle.vin ?? '';
  });

  const fleet = $derived($fleetDataStore);
  const openJobForVehicle = $derived(
    fleet.jobs.find(
      (j) => j.vehicleId === vehicle.id && j.status !== 'completed'
    )
  );
  const canRelease = $derived(!openJobForVehicle);
  const checkoutNeedsDriver = $derived(form.status === 'in-use' && !form.driver?.trim());

  function saveFields() {
    const statusCheck = validateStatusChange(
      form.status,
      form.driver,
      Boolean(openJobForVehicle) && form.status === 'ready'
    );
    if (!statusCheck.ok) {
      alert(statusCheck.message);
      return;
    }
    const vin = form.vin.trim() || undefined;
    const dupVin = findVehicleByVin(fleet.vehicles, vin, vehicle.id);
    if (dupVin) {
      alert('A vehicle with this VIN already exists.');
      return;
    }
    const updatedVehicles = fleet.vehicles.map((v) =>
      v.id === vehicle.id
        ? {
            ...v,
            name: form.name.trim() || v.name,
            status: form.status,
            odometer: typeof form.odometer === 'number' ? form.odometer : parseInt(String(form.odometer), 10) || undefined,
            driver: form.driver.trim() || undefined,
            role: form.role,
            lastService: form.lastService.trim() || undefined,
            nextService: form.nextService.trim() || undefined,
            vin: form.vin.trim() || undefined
          }
        : v
    );
    saveFleetData({ ...fleet, vehicles: updatedVehicles });
    form = {
      name: updatedVehicles.find((v) => v.id === vehicle.id)!.name,
      status: updatedVehicles.find((v) => v.id === vehicle.id)!.status as VehicleStatus,
      odometer: updatedVehicles.find((v) => v.id === vehicle.id)!.odometer ?? '',
      driver: updatedVehicles.find((v) => v.id === vehicle.id)!.driver ?? '',
      role: updatedVehicles.find((v) => v.id === vehicle.id)!.role ?? 'pool',
      lastService: updatedVehicles.find((v) => v.id === vehicle.id)!.lastService ?? '',
      nextService: updatedVehicles.find((v) => v.id === vehicle.id)!.nextService ?? '',
      vin: updatedVehicles.find((v) => v.id === vehicle.id)!.vin ?? ''
    };
  }

  function doIntake() {
    const now = new Date().toISOString().slice(0, 10);
    const newJob: MaintenanceJob = {
      id: 'mj-' + Math.random().toString(36).slice(2, 11),
      vehicleId: vehicle.id,
      title: 'Intake – maintenance',
      description: 'Vehicle brought in for maintenance.',
      priority: 'medium',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      history: [{ date: now, note: 'Vehicle intake.', status: 'open' }],
      planned: false,
      odometerAtJobOpen: typeof form.odometer === 'number' ? form.odometer : parseInt(String(form.odometer), 10) || vehicle.odometer
    };
    const updatedJobs = [...fleet.jobs, newJob];
    const updatedVehicles = fleet.vehicles.map((v) =>
      v.id === vehicle.id
        ? {
            ...v,
            ...formToVehicle(),
            status: 'maintenance' as const,
            intakeAt: now,
            currentJobId: newJob.id
          }
        : v
    );
    saveFleetData({ ...fleet, vehicles: updatedVehicles, jobs: updatedJobs });
    onClose();
  }

  function formToVehicle(): Partial<Vehicle> {
    return {
      name: form.name.trim() || vehicle.name,
      status: form.status,
      odometer: typeof form.odometer === 'number' ? form.odometer : parseInt(String(form.odometer), 10) || undefined,
      driver: form.driver.trim() || undefined,
      role: form.role,
      lastService: form.lastService.trim() || undefined,
      nextService: form.nextService.trim() || undefined,
      vin: form.vin.trim() || undefined
    };
  }

  function doCheckout() {
    const check = validateStatusChange('in-use', form.driver, false);
    if (!check.ok) {
      alert(check.message);
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const updatedVehicles = fleet.vehicles.map((v) =>
      v.id === vehicle.id
        ? {
            ...v,
            ...formToVehicle(),
            status: 'in-use' as const,
            driver: form.driver.trim() || v.driver,
            checkedOutAt: now,
            currentJobId: undefined
          }
        : v
    );
    saveFleetData({ ...fleet, vehicles: updatedVehicles });
    form = { ...form, status: 'in-use' };
    onClose();
  }

  function doRelease() {
    const check = validateStatusChange('ready', form.driver, Boolean(openJobForVehicle));
    if (!check.ok) {
      alert(check.message);
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const updatedVehicles = fleet.vehicles.map((v) =>
      v.id === vehicle.id
        ? {
            ...v,
            ...formToVehicle(),
            status: 'ready' as const,
            releasedAt: now,
            currentJobId: undefined
          }
        : v
    );
    saveFleetData({ ...fleet, vehicles: updatedVehicles });
    form = { ...form, status: 'ready' };
    onClose();
  }
</script>

<div class="vehicle-edit-panel fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--bg-card)] shadow-xl border-l border-[var(--border-subtle)] flex flex-col" role="dialog" aria-labelledby="edit-panel-title">
  <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
    <h2 id="edit-panel-title" class="font-display font-semibold">Edit {vehicle.name}</h2>
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
    <div>
      <label for="edit-name" class="block text-sm font-medium text-slate-700 mb-1">Name</label>
      <input
        id="edit-name"
        type="text"
        bind:value={form.name}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <div>
      <label for="edit-status" class="block text-sm font-medium text-slate-700 mb-1">Status</label>
      <select
        id="edit-status"
        bind:value={form.status}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each statusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="edit-odometer" class="block text-sm font-medium text-slate-700 mb-1">Odometer</label>
      <input
        id="edit-odometer"
        type="number"
        bind:value={form.odometer}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        min="0"
      />
    </div>
    <div>
      <label for="edit-driver" class="block text-sm font-medium text-slate-700 mb-1">Driver</label>
      <input
        id="edit-driver"
        type="text"
        bind:value={form.driver}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        placeholder="When in use"
      />
    </div>
    <div>
      <label for="edit-role" class="block text-sm font-medium text-slate-700 mb-1">Role</label>
      <select
        id="edit-role"
        bind:value={form.role}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {#each roleOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="edit-lastService" class="block text-sm font-medium text-slate-700 mb-1">Last service</label>
      <input
        id="edit-lastService"
        type="text"
        bind:value={form.lastService}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        placeholder="YYYY-MM-DD"
      />
    </div>
    <div>
      <label for="edit-nextService" class="block text-sm font-medium text-slate-700 mb-1">Next service</label>
      <input
        id="edit-nextService"
        type="text"
        bind:value={form.nextService}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        placeholder="YYYY-MM-DD"
      />
    </div>
    <div>
      <label for="edit-vin" class="block text-sm font-medium text-slate-700 mb-1">VIN (optional)</label>
      <input
        id="edit-vin"
        type="text"
        bind:value={form.vin}
        class="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>

    <div class="pt-4 border-t border-[var(--border-subtle)]">
      <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Lifecycle actions</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-secondary text-sm"
          onclick={doIntake}
        >
          Intake for maintenance
        </button>
        <button
          type="button"
          class="btn btn-secondary text-sm"
          disabled={checkoutNeedsDriver}
          title={checkoutNeedsDriver ? 'Set driver when status is In use' : ''}
          onclick={doCheckout}
        >
          Checkout
        </button>
        <button
          type="button"
          class="btn btn-secondary text-sm"
          disabled={!canRelease}
          title={!canRelease ? 'Complete or clear open job first' : ''}
          onclick={doRelease}
        >
          Release
        </button>
      </div>
      {#if openJobForVehicle}
        <p class="text-xs text-amber-700 mt-2">Open job: {openJobForVehicle.title}. Release is blocked until job is completed or cleared.</p>
      {/if}
    </div>
  </div>
  <div class="p-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
    {#if onRemove}
      <SlideToRemove
        label="Remove vehicle"
        confirmMessage="Remove this vehicle from the fleet? Jobs linked to it will keep the reference."
        onRemove={onRemove}
      />
    {/if}
    <button type="button" class="btn btn-primary {onRemove ? 'flex-1 min-w-0' : 'w-full'}" onclick={saveFields}>Save changes</button>
  </div>
</div>
