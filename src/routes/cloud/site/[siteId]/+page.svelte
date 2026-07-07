<script lang="ts">
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { fleetDataStore } from '$lib/stores/fleetData';
  import { siteById, vehiclesForSite } from '$lib/data/multiSiteDemo';
  import {
    criticalOpenJobsForSite,
    criticalPartsForSite,
    siteVehicleStatusBreakdown
  } from '$lib/cloud/cloudMultiSiteRules';

  const siteId = $derived($page.params.siteId ?? '');
  const fleet = $derived.by(() => get(fleetDataStore));
  const site = $derived(siteById(siteId));
  const vehicles = $derived(site ? vehiclesForSite(site.id, fleet) : []);
  const statusBreakdown = $derived(site ? siteVehicleStatusBreakdown(site.id, fleet) : {});
  const criticalJobs = $derived(site ? criticalOpenJobsForSite(site.id, fleet) : []);
  const criticalParts = $derived(site ? criticalPartsForSite(site.id, fleet) : []);
  const readyN = $derived(statusBreakdown.ready ?? 0);
</script>

<div class="space-y-6">
  {#if !site}
    <p style="color: var(--cloud-bad);">Unknown site.</p>
    <a href="/cloud" class="font-medium" style="color: var(--cloud-accent);">← Overview</a>
  {:else}
    <div>
      <a href="/cloud" class="text-sm font-medium no-underline hover:underline" style="color: var(--cloud-accent);">← All sites</a>
      <h1 class="mt-2 font-display text-2xl font-semibold" style="color: var(--cloud-text);">{site.name}</h1>
      <p class="m-0 text-sm" style="color: var(--cloud-muted);">{site.region} · {site.id}</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="cloud-card p-4">
        <p class="m-0 text-[10px] font-medium uppercase tracking-wide" style="color: var(--cloud-muted);">Ready for assignment</p>
        <p class="mt-1 font-display text-3xl font-semibold tabular-nums" style="color: var(--cloud-ok);">{readyN}</p>
      </div>
      <div class="cloud-card p-4">
        <p class="m-0 text-[10px] font-medium uppercase tracking-wide" style="color: var(--cloud-muted);">In maintenance</p>
        <p class="mt-1 font-display text-3xl font-semibold tabular-nums" style="color: var(--cloud-warn);">
          {statusBreakdown.maintenance ?? 0}
        </p>
      </div>
      <div class="cloud-card p-4">
        <p class="m-0 text-[10px] font-medium uppercase tracking-wide" style="color: var(--cloud-muted);">Critical open jobs</p>
        <p class="mt-1 font-display text-3xl font-semibold tabular-nums" style="color: var(--cloud-text);">
          {criticalJobs.length}
        </p>
      </div>
    </div>

    <div class="cloud-card p-4">
      <h2 class="m-0 font-display text-base font-semibold" style="color: var(--cloud-text);">Fleet composition</h2>
      <ul class="mt-3 space-y-1 text-sm">
        {#each Object.entries(statusBreakdown) as [status, count]}
          <li class="flex justify-between">
            <span class="capitalize" style="color: var(--cloud-muted);">{status.replace('-', ' ')}</span>
            <span class="font-medium tabular-nums">{count}</span>
          </li>
        {/each}
      </ul>
    </div>

    <div class="cloud-card p-4">
      <h2 class="m-0 font-display text-base font-semibold" style="color: var(--cloud-text);">Vehicles at this site</h2>
      <ul class="mt-3 divide-y" style="border-color: var(--cloud-border);">
        {#each vehicles as v}
          <li class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span class="font-medium">{v.name}</span>
            <span class="capitalize text-xs" style="color: var(--cloud-muted);">{v.status.replace('-', ' ')}</span>
          </li>
        {/each}
      </ul>
    </div>

    <div class="cloud-card p-4">
      <h2 class="m-0 font-display text-base font-semibold" style="color: var(--cloud-text);">Critical jobs</h2>
      {#if criticalJobs.length === 0}
        <p class="mt-2 text-sm" style="color: var(--cloud-muted);">No critical open jobs at this site.</p>
      {:else}
        <ul class="mt-3 space-y-2">
          {#each criticalJobs as j}
            <li class="rounded-md border px-3 py-2 text-sm" style="border-color: var(--cloud-border);">
              <span class="font-medium">{j.title}</span>
              <span class="ml-2 text-[11px] uppercase" style="color: var(--cloud-muted);">{j.status}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="cloud-card p-4">
      <h2 class="m-0 font-display text-base font-semibold" style="color: var(--cloud-text);">Critical parts (open orders)</h2>
      {#if criticalParts.length === 0}
        <p class="mt-2 text-sm" style="color: var(--cloud-muted);">No open part orders on critical jobs.</p>
      {:else}
        <ul class="mt-3 space-y-2">
          {#each criticalParts as p}
            <li class="rounded-md border px-3 py-2 text-sm" style="border-color: var(--cloud-border);">
              <span class="font-medium">{p.partName}</span>
              <span class="ml-2 text-xs capitalize" style="color: var(--cloud-muted);">{p.status}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
