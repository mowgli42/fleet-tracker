<script lang="ts">
  import { get } from 'svelte/store';
  import { fleetDataStore } from '$lib/stores/fleetData';

  const fleet = $derived.by(() => get(fleetDataStore));
  const statusOrder = ['maintenance', 'ready', 'in-use', 'reserved', 'out-of-service'] as const;
  const statusLabel: Record<string, string> = {
    maintenance: 'In service',
    ready: 'Ready',
    'in-use': 'In use',
    reserved: 'Reserved',
    'out-of-service': 'Down'
  };
</script>

<div class="space-y-4">
  <div>
    <h1 class="font-display text-xl font-semibold" style="color: var(--proto-text);">Fleet</h1>
    <p class="mt-1 text-sm" style="color: var(--proto-muted);">Tap a vehicle for status, parts, and jobs.</p>
  </div>

  <ul class="space-y-2">
    {#each statusOrder as st}
      {@const group = fleet.vehicles.filter((v) => v.status === st)}
      {#if group.length > 0}
        <li>
          <p class="mb-1 text-[10px] font-medium uppercase tracking-wider" style="color: var(--proto-muted);">
            {statusLabel[st] ?? st}
          </p>
          <ul class="space-y-2">
            {#each group as v}
              <li>
                <a
                  href="/tablet/vehicle/{v.id}"
                  class="proto-card flex items-center justify-between gap-3 p-3 no-underline"
                  style="color: var(--proto-text);"
                >
                  <span class="font-medium">{v.name}</span>
                  {#if v.vin}
                    <span class="font-mono text-[11px]" style="color: var(--proto-muted);">{v.vin}</span>
                  {:else}
                    <span class="text-[11px]" style="color: var(--proto-muted);">{v.driver ?? '—'}</span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        </li>
      {/if}
    {/each}
  </ul>
</div>
