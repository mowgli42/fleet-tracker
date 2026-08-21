<script lang="ts">
  import { SITES } from '$lib/data/multiSiteDemo';
  import {
    SCHEDULE_LEGEND,
    buildFleetSchedule,
    segmentOffsetPct,
    segmentWidthPct,
    type HorizonHours
  } from '$lib/schedule/scheduleRules';
  import { fleetDataStore } from '$lib/stores/fleetData';

  let { data }: { data: Record<string, never> } = $props();

  let horizon = $state<HorizonHours>(72);
  let siteFilter = $state('');
  let searchQuery = $state('');
  let collapsed = $state<Record<string, boolean>>({});

  const nowMs = $derived(Date.now());
  const groups = $derived(buildFleetSchedule($fleetDataStore.vehicles, $fleetDataStore.jobs, nowMs, horizon));

  const visible = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    return groups
      .filter((g) => !siteFilter || g.siteId === siteFilter)
      .map((g) => ({
        ...g,
        vehicles: g.vehicles.filter(
          (v) => !q || v.name.toLowerCase().includes(q) || v.nextLabel.toLowerCase().includes(q)
        )
      }))
      .filter((g) => g.vehicles.length > 0);
  });

  const ticks = $derived.by(() => {
    const step = horizon === 24 ? 4 : horizon === 48 ? 8 : 12;
    const hours: number[] = [];
    for (let h = 0; h <= horizon; h += step) hours.push(h);
    return hours;
  });

  function toggleSite(siteId: string) {
    collapsed = { ...collapsed, [siteId]: !collapsed[siteId] };
  }

  function markerLeft(hours: number): string {
    return `${(hours / horizon) * 100}%`;
  }
</script>

<div class="schedule-page">
  <header class="page-header">
    <div class="min-w-0">
      <h1>Schedule</h1>
      <p class="subtitle">Next job and where scheduled maintenance can slide for unscheduled work</p>
    </div>
    <div class="page-toolbar">
      <div class="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-0.5 w-full sm:w-auto" role="group" aria-label="Time window">
        {#each [24, 48, 72] as hours}
          <button
            type="button"
            class="flex-1 sm:flex-none rounded-md px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 {horizon === hours
              ? 'bg-slate-200 text-slate-900'
              : 'text-muted hover:bg-slate-100'}"
            onclick={() => (horizon = hours as HorizonHours)}
          >
            {hours}h
          </button>
        {/each}
      </div>
      <label class="toolbar-field">
        <span>Site</span>
        <select bind:value={siteFilter} class="toolbar-select" aria-label="Filter by site">
          <option value="">All sites</option>
          {#each SITES as site}
            <option value={site.id}>{site.name}</option>
          {/each}
        </select>
      </label>
      <label class="toolbar-field">
        <span>Search</span>
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Vehicle or job"
          class="toolbar-input"
          aria-label="Search vehicles or jobs"
        />
      </label>
    </div>
  </header>

  <ul class="schedule-legend" aria-label="Status colors">
    {#each SCHEDULE_LEGEND as item}
      <li>
        <span class="schedule-swatch {item.className}" aria-hidden="true"></span>
        {item.label}
      </li>
    {/each}
  </ul>

  <div class="card schedule-board">
    <div class="schedule-axis" aria-hidden="true">
      <div class="schedule-axis-gutter"></div>
      <div class="schedule-axis-track">
        {#each ticks as hour}
          <span class="schedule-tick" style="left: {markerLeft(hour)}">{hour === 0 ? 'NOW' : `+${hour}h`}</span>
        {/each}
      </div>
    </div>

    {#each visible as group}
      <section class="schedule-site">
        <button type="button" class="schedule-site-header" onclick={() => toggleSite(group.siteId)}>
          <span class="schedule-site-chevron" class:is-collapsed={collapsed[group.siteId]} aria-hidden="true">▾</span>
          <h2>{group.siteName}</h2>
          <span class="text-muted text-sm font-normal">{group.vehicles.length} vehicles</span>
        </button>
        {#if !collapsed[group.siteId]}
          {#each group.vehicles as row}
            <div class="schedule-row">
              <div class="schedule-vehicle">
                <a href="/fleet" class="schedule-vehicle-name">{row.name}</a>
                {#if row.canDeferScheduled}
                  <span class="schedule-defer">Can defer PM</span>
                {/if}
                <span class="schedule-next">{row.nextLabel}</span>
              </div>
              <div class="schedule-track" role="img" aria-label="{row.name} schedule">
                {#if horizon >= 24}
                  <span class="schedule-marker" style="left: {markerLeft(24)}"></span>
                {/if}
                {#if horizon >= 48}
                  <span class="schedule-marker" style="left: {markerLeft(48)}"></span>
                {/if}
                {#each row.segments as seg}
                  {@const left = segmentOffsetPct(seg.startMs, nowMs, horizon)}
                  {@const width = segmentWidthPct(seg.startMs, seg.endMs, horizon)}
                  {#if seg.jobId}
                    <a
                      href="/maintenance#job-{seg.jobId}"
                      class="schedule-seg sched-{seg.kind.replace('_', '-')}"
                      class:sched-available={seg.kind === 'available'}
                      class:sched-assigned={seg.kind === 'assigned'}
                      class:sched-scheduled={seg.kind === 'scheduled_maint'}
                      class:sched-relocation={seg.kind === 'relocation'}
                      class:sched-unscheduled={seg.kind === 'unscheduled_maint'}
                      style="left: {left}%; width: {width}%"
                      title={seg.assignedTo ? `${seg.label} · ${seg.assignedTo}` : seg.label}
                    >
                      {#if width > 10}<span>{seg.label}</span>{/if}
                    </a>
                  {:else}
                    <div
                      class="schedule-seg"
                      class:sched-available={seg.kind === 'available'}
                      class:sched-assigned={seg.kind === 'assigned'}
                      class:sched-scheduled={seg.kind === 'scheduled_maint'}
                      class:sched-relocation={seg.kind === 'relocation'}
                      class:sched-unscheduled={seg.kind === 'unscheduled_maint'}
                      style="left: {left}%; width: {width}%"
                      title={seg.label}
                    >
                      {#if width > 10}<span>{seg.label}</span>{/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </section>
    {/each}

    {#if visible.length === 0}
      <p class="text-muted p-4">No vehicles match the selected filter.</p>
    {/if}
  </div>
</div>

<style>
  .schedule-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .schedule-swatch {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 999px;
    margin-right: 0.35rem;
    vertical-align: -0.05rem;
  }
  .schedule-board {
    overflow: hidden;
  }
  .schedule-axis,
  .schedule-row {
    display: grid;
    grid-template-columns: minmax(10rem, 16rem) minmax(0, 1fr);
  }
  .schedule-axis {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8fafc;
    border-bottom: 1px solid var(--border-subtle);
    min-height: 1.75rem;
  }
  .schedule-axis-track,
  .schedule-track {
    position: relative;
    min-height: 2.5rem;
  }
  .schedule-tick {
    position: absolute;
    top: 0.35rem;
    transform: translateX(-50%);
    font-size: 0.65rem;
    color: var(--text-muted);
    font-weight: 600;
  }
  .schedule-site-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border: 0;
    border-top: 1px solid var(--border-subtle);
    cursor: pointer;
    text-align: left;
  }
  .schedule-site-header h2 {
    margin: 0;
    font-size: 0.875rem;
  }
  .schedule-site-chevron {
    color: var(--text-muted);
    transition: transform 150ms ease;
  }
  .schedule-site-chevron.is-collapsed {
    transform: rotate(-90deg);
  }
  .schedule-row {
    border-top: 1px solid var(--border-subtle);
  }
  .schedule-vehicle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.1rem;
    padding: 0.4rem 0.75rem;
    border-right: 1px solid var(--border-subtle);
    min-height: 2.75rem;
  }
  .schedule-vehicle-name {
    font-weight: 600;
    color: var(--text-primary);
    text-decoration: none;
  }
  .schedule-next {
    font-size: 0.7rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .schedule-defer {
    font-size: 0.65rem;
    font-weight: 600;
    color: #92400e;
  }
  .schedule-track {
    background-image: repeating-linear-gradient(
      to right,
      transparent,
      transparent calc(100% / 6 - 1px),
      #e2e8f0 calc(100% / 6 - 1px),
      #e2e8f0 calc(100% / 6)
    );
  }
  .schedule-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #94a3b8;
    opacity: 0.5;
    z-index: 0;
  }
  .schedule-seg {
    position: absolute;
    top: 0.4rem;
    bottom: 0.4rem;
    display: flex;
    align-items: center;
    padding: 0 0.4rem;
    border-radius: 0.35rem;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
    z-index: 1;
  }
  .sched-available {
    background: #22c55e;
    color: #052e16;
  }
  .sched-assigned {
    background: #3b82f6;
    color: #eff6ff;
  }
  .sched-scheduled {
    background: #eab308;
    color: #422006;
  }
  .sched-relocation {
    background: #f97316;
    color: #fff7ed;
  }
  .sched-unscheduled {
    background: #ef4444;
    color: #fef2f2;
  }
</style>
