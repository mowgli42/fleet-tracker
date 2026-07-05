<script lang="ts">
  import StackedBar from '$lib/components/StackedBar.svelte';
  import {
    criticalPartsAcrossSites,
    readyForAssignmentCount,
    siteHealthRollup,
    SITES,
    type SiteHealthRollup
  } from '$lib/data/multiSiteDemo';
  import { CLOUD_DEMO_DISCLAIMER, isDemoCloudRollup } from '$lib/cloud/cloudMultiSiteRules';
  import { fleetDataStore } from '$lib/stores/fleetData';
  import { get } from 'svelte/store';

  const rollups = $derived.by(() => siteHealthRollup(get(fleetDataStore)));
  const critical = $derived.by(() => criticalPartsAcrossSites(get(fleetDataStore), 1));
  const totalReady = $derived.by(() => {
    const fleet = get(fleetDataStore);
    return SITES.reduce((acc, s) => acc + readyForAssignmentCount(s.id, fleet), 0);
  });

  /** Full site fleet composition for stacked bar (left → right: pool → field → service → down). */
  function siteFleetSegments(r: SiteHealthRollup) {
    return [
      { label: 'Ready', count: r.ready, bg: 'var(--cloud-ok)', textColor: '#ffffff' },
      { label: 'In use', count: r.inUse, bg: '#64748b', textColor: '#ffffff' },
      { label: 'Reserved', count: r.reserved, bg: '#4f46e5', textColor: '#ffffff' },
      { label: 'In maintenance', count: r.inMaintenance, bg: '#ca8a04', textColor: '#0f172a' },
      { label: 'Out of service', count: r.blocked, bg: 'var(--cloud-bad)', textColor: '#ffffff' }
    ];
  }
</script>

<div class="space-y-8">
  <div class="rounded-lg border px-4 py-3 text-sm" style="border-color: var(--cloud-border); color: var(--cloud-muted);">
    {#if isDemoCloudRollup()}
      <strong style="color: var(--cloud-text);">Demo rollup.</strong> {CLOUD_DEMO_DISCLAIMER}
    {/if}
  </div>

  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="font-display text-2xl font-semibold" style="color: var(--cloud-text);">Fleet overview</h1>
      <p class="mt-1 max-w-2xl text-sm" style="color: var(--cloud-muted);">
        Rollup across {SITES.length} demo sites (vehicle ids partitioned per site). Data is the same store as the main app so edits stay in sync.
      </p>
    </div>
    <div class="cloud-pill tabular-nums">{totalReady} vehicles ready for assignment (all sites)</div>
  </div>

  <section aria-labelledby="sites-heading">
    <h2 id="sites-heading" class="font-display text-base font-semibold" style="color: var(--cloud-text);">Sites</h2>
    <div class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each rollups as r}
        <a
          href="/cloud/site/{r.site.id}"
          class="cloud-card block p-4 no-underline transition hover:shadow-md"
          style="color: var(--cloud-text);"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="m-0 font-display font-semibold">{r.site.name}</p>
              <p class="m-0 mt-0.5 text-xs" style="color: var(--cloud-muted);">{r.site.region}</p>
            </div>
            {#if r.openCriticalJobs > 0}
              <span class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800">{r.openCriticalJobs} critical</span>
            {:else}
              <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">OK</span>
            {/if}
          </div>

          {#if r.totalVehicles === 0}
            <p class="mt-4 text-sm font-medium" style="color: var(--cloud-muted);" role="status">No vehicles at this site</p>
          {:else}
            {#if r.ready === 0}
              <p
                class="mt-4 rounded-md border px-2.5 py-2 text-xs font-semibold leading-snug"
                style="border-color: var(--cloud-accent-border); background: var(--cloud-accent-soft); color: var(--cloud-warn);"
                role="status"
              >
                No vehicles ready for assignment
              </p>
            {/if}
            <div class="mt-3">
              <p class="m-0 mb-1.5 text-[10px] font-medium uppercase tracking-wide" style="color: var(--cloud-muted);">
                Fleet by status · {r.totalVehicles} vehicles
              </p>
              <StackedBar
                segments={siteFleetSegments(r)}
                totalLabel="Vehicles at site"
                showLegend={true}
                theme="cloud"
                height="1.35rem"
              />
            </div>
          {/if}
          <p class="mt-3 text-xs" style="color: var(--cloud-accent);">Open site dashboard →</p>
        </a>
      {/each}
    </div>
  </section>

  <section aria-labelledby="parts-heading">
    <h2 id="parts-heading" class="font-display text-base font-semibold" style="color: var(--cloud-text);">Critical parts (open jobs)</h2>
    <p class="mt-1 text-sm" style="color: var(--cloud-muted);">Aggregated from <code class="text-xs">partsRequired</code> on non-completed jobs, grouped by label.</p>
    <div class="cloud-card mt-3 overflow-x-auto">
      <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr class="border-b" style="border-color: var(--cloud-border);">
            <th class="py-2 pr-4 font-medium" style="color: var(--cloud-muted);">Part</th>
            <th class="py-2 pr-4 font-medium" style="color: var(--cloud-muted);">Sites</th>
            <th class="py-2 font-medium tabular-nums" style="color: var(--cloud-muted);">Open refs</th>
          </tr>
        </thead>
        <tbody>
          {#if critical.length === 0}
            <tr>
              <td colspan="3" class="py-6 text-center" style="color: var(--cloud-muted);">No open part lines.</td>
            </tr>
          {:else}
            {#each critical as row}
              <tr class="border-b" style="border-color: var(--cloud-border);">
                <td class="py-2 pr-4 font-medium">{row.label}</td>
                <td class="py-2 pr-4 text-xs" style="color: var(--cloud-muted);">{row.sites.join(', ')}</td>
                <td class="py-2 tabular-nums">{row.openJobCount}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>
</div>
