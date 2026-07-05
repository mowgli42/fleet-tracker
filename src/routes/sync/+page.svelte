<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import {
    cloudOnline,
    refreshSyncSnapshot,
    setCloudOnline,
    syncSnapshot
  } from '$lib/stores/syncRuntime';
  import { buildSyncStatusReport, type SyncStatusReport } from '$lib/sync/syncStatusReport';
  import StackedBar from '$lib/components/StackedBar.svelte';

  let report = $state<SyncStatusReport | null>(null);

  const ownerReadinessSegments = $derived([
    {
      label: 'Ready',
      count: $syncSnapshot.readiness.ready,
      bg: '#dcfce7',
      textColor: '#166534'
    },
    {
      label: 'At-risk',
      count: $syncSnapshot.readiness['at-risk'],
      bg: '#fef3c7',
      textColor: '#92400e'
    },
    {
      label: 'Blocked',
      count: $syncSnapshot.readiness.blocked,
      bg: '#fee2e2',
      textColor: '#991b1b'
    }
  ]);

  async function refresh() {
    await refreshSyncSnapshot();
    if (browser) {
      report = buildSyncStatusReport();
    }
  }

  function toggleCloudOnline() {
    setCloudOnline(!get(cloudOnline));
  }

  onMount(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 2500);
    return () => clearInterval(id);
  });

  function formatTs(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
    } catch {
      return '—';
    }
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }
</script>

<div class="sync-page max-w-5xl">
  <header class="page-header page-header--with-meta mb-6">
    <div class="min-w-0">
      <h1>Cloud sync</h1>
      <p class="subtitle">Local site log, outbox, and cloud projection (demo)</p>
    </div>
    <div class="flex flex-wrap items-center gap-2 shrink-0 mt-2 sm:mt-0">
      <button type="button" class="btn btn-secondary text-sm" onclick={refresh}> Refresh </button>
      <button
        type="button"
        class="text-sm rounded-md px-3 py-1.5 font-medium {$cloudOnline
          ? 'bg-emerald-100 text-emerald-900'
          : 'bg-amber-100 text-amber-950'}"
        aria-pressed={$cloudOnline}
        onclick={toggleCloudOnline}
      >
        {$cloudOnline ? 'Cloud online' : 'Cloud offline'}
      </button>
    </div>
  </header>

  <div class="card p-4 mb-6 text-sm text-muted leading-relaxed">
    <strong class="text-[var(--text-primary)]">Demo mode.</strong>
    {#if browser && report?.remoteSync}
      <span class="text-[var(--text-primary)]">Remote cloud</span> is enabled via
      <code class="text-xs bg-slate-100 px-1 rounded">VITE_SYNC_API_URL</code>; responses are mirrored into
      <code class="text-xs bg-slate-100 px-1 rounded">localStorage</code> for offline read. Run
      <code class="text-xs bg-slate-100 px-1 rounded">npm run demo:sync-server</code> for the local Phase 1 API.
    {:else}
      The local “database” and “cloud database” use this browser’s
      <code class="text-xs bg-slate-100 px-1 rounded">localStorage</code> only. Enable a real sync URL at build time to
      exercise HTTP ingress (see <code class="text-xs bg-slate-100 px-1 rounded">docs/PHASE1.md</code>).
    {/if}
    {#if browser && report?.lastFlushError}
      <p class="mt-3 text-sm text-red-700 font-medium">Last flush error: {report.lastFlushError}</p>
    {/if}
  </div>

  <section class="mb-6" aria-labelledby="owner-availability-heading">
    <h2 id="owner-availability-heading" class="font-display text-base font-semibold mb-2">Owner availability</h2>
    <p class="text-xs text-muted mb-3 max-w-3xl">
      Ready / at-risk / blocked from the
      <strong>{$syncSnapshot.projectionSource === 'local' ? 'local event log' : 'cloud projection'}</strong>
      ({$syncSnapshot.projectionSource === 'local'
        ? 'site view during outage'
        : 'accepted events + PM rules'}).
      {#if $syncSnapshot.pendingOutbox > 0}
        <span class="text-amber-900 font-medium">
          {$syncSnapshot.pendingOutbox} event(s) still queued locally.</span>
      {/if}
      {#if $syncSnapshot.remoteSync}
        <span class="block mt-1 text-muted">Remote sync API is enabled (see <code class="text-[11px]">docs/PHASE1.md</code>).</span>
      {/if}
    </p>
    <div class="card p-4">
      <StackedBar segments={ownerReadinessSegments} totalLabel="Vehicles" showLegend={true} />
    </div>
  </section>

  {#if !browser || report === null}
    <p class="text-muted text-sm">Loading sync status…</p>
  {:else}
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6" aria-label="Summary">
      <div class="card p-4">
        <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Site</h2>
        <p class="mt-1 font-mono text-sm break-all">{report.siteId}</p>
      </div>
      <div class="card p-4">
        <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Projection source</h2>
        <p class="mt-1 text-sm font-medium capitalize">{$syncSnapshot.projectionSource}</p>
        <p class="text-xs text-muted mt-1">
          {$syncSnapshot.localEventCount} local · {$syncSnapshot.cloudAcceptedCount} cloud accepted
        </p>
      </div>
      <div class="card p-4">
        <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Projection refresh</h2>
        <p class="mt-1 text-sm">{formatTs($syncSnapshot.lastUpdatedAt)}</p>
        <p class="text-xs text-muted mt-1">Last engine run (flush + read model)</p>
      </div>
      <div class="card p-4">
        <h2 class="text-xs font-medium uppercase tracking-wider text-muted">Connectivity</h2>
        <p class="mt-1 text-sm font-medium">{$cloudOnline ? 'Sync path open' : 'Sync path closed (simulated outage)'}</p>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <section class="card p-4" aria-labelledby="local-db-heading">
        <h2 id="local-db-heading" class="font-display text-base font-semibold mb-1">Local store (site)</h2>
        <p class="text-xs text-muted mb-4">Append-only event log for this workstation / tab.</p>
        <dl class="grid grid-cols-1 gap-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Events recorded</dt>
            <dd class="font-medium tabular-nums">{report.localLog.eventCount}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Approx. size</dt>
            <dd class="font-medium tabular-nums">{formatBytes(report.localLog.approxBytes)}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Oldest event (local time)</dt>
            <dd class="text-right text-xs">{formatTs(report.localLog.oldestLocalTs)}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Newest event (local time)</dt>
            <dd class="text-right text-xs">{formatTs(report.localLog.newestLocalTs)}</dd>
          </div>
          <div class="mt-2 pt-2 border-t border-[var(--border-subtle)]">
            <dt class="text-muted text-xs mb-1">Storage key</dt>
            <dd class="font-mono text-[11px] break-all">{report.localLog.storageKey}</dd>
          </div>
        </dl>
      </section>

      <section class="card p-4" aria-labelledby="cloud-db-heading">
        <h2 id="cloud-db-heading" class="font-display text-base font-semibold mb-1">Cloud projection store</h2>
        <p class="text-xs text-muted mb-4">Accepted events after sync (idempotent apply + server timestamp).</p>
        <dl class="grid grid-cols-1 gap-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Accepted events</dt>
            <dd class="font-medium tabular-nums">{report.cloud.acceptedEventCount}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Idempotency keys applied</dt>
            <dd class="font-medium tabular-nums">{report.cloud.idempotencyKeysApplied}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Last server timestamp</dt>
            <dd class="text-right text-xs">{formatTs(report.cloud.lastServerTs)}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Approx. size</dt>
            <dd class="font-medium tabular-nums">{formatBytes(report.cloud.approxBytes)}</dd>
          </div>
          <div class="mt-2 pt-2 border-t border-[var(--border-subtle)]">
            <dt class="text-muted text-xs mb-1">Storage key</dt>
            <dd class="font-mono text-[11px] break-all">{report.cloud.storageKey}</dd>
          </div>
        </dl>
      </section>
    </div>

    <section class="card p-4 mb-6" aria-labelledby="outbox-heading">
      <h2 id="outbox-heading" class="font-display text-base font-semibold mb-1">Outbox queue</h2>
      <p class="text-xs text-muted mb-4">
        Events waiting to be accepted by the cloud store. {report.outbox.count === 0 ? 'Queue is empty.' : ''}
      </p>
      {#if report.outbox.count > 0}
        <div class="table-container border border-[var(--border-subtle)] rounded-md overflow-hidden">
          <table class="table text-sm">
            <thead>
              <tr>
                <th>Event type</th>
                <th>Entity</th>
                <th class="hidden sm:table-cell">Idempotency key</th>
              </tr>
            </thead>
            <tbody>
              {#each report.outbox.preview as row}
                <tr>
                  <td class="font-mono text-xs">{row.event_type}</td>
                  <td class="font-mono text-xs">{row.entity_id}</td>
                  <td class="hidden sm:table-cell font-mono text-[11px] break-all">{row.idempotency_key}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="text-sm text-muted">Nothing pending.</p>
      {/if}
    </section>

    <section class="card p-4 mb-6" aria-labelledby="clients-heading">
      <h2 id="clients-heading" class="font-display text-base font-semibold mb-1">Local clients</h2>
      <p class="text-xs text-muted mb-4">
        Demo shows this browser session only. Multi-client would list each shop workstation or tablet with last sync
        heartbeat.
      </p>
      <div class="table-container border border-[var(--border-subtle)] rounded-md overflow-hidden">
        <table class="table text-sm">
          <thead>
            <tr>
              <th>Client</th>
              <th>Role</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>This session</td>
              <td class="text-muted">Browser (workstation)</td>
              <td class="text-xs">{formatTs($syncSnapshot.lastUpdatedAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card p-4 mb-6" aria-labelledby="projection-heading">
      <h2 id="projection-heading" class="font-display text-base font-semibold mb-1">Owner readiness (derived)</h2>
      <p class="text-xs text-muted mb-4">From cloud events + PM window on fleet vehicles.</p>
      <div class="flex flex-wrap gap-4 text-sm">
        <span><strong class="tabular-nums">{report.projection.ready}</strong> <span class="text-muted">Ready</span></span>
        <span
          ><strong class="tabular-nums">{report.projection.atRisk}</strong> <span class="text-muted">At-risk</span></span
        >
        <span
          ><strong class="tabular-nums">{report.projection.blocked}</strong> <span class="text-muted">Blocked</span></span
        >
      </div>
    </section>

    <section class="card p-4" aria-labelledby="storage-heading">
      <h2 id="storage-heading" class="font-display text-base font-semibold mb-1">Browser storage keys</h2>
      <p class="text-xs text-muted mb-4">Raw key sizes for debugging.</p>
      <ul class="space-y-2 text-sm">
        {#each report.storageKeys as row}
          <li class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 border-b border-[var(--border-subtle)] pb-2 last:border-0">
            <span class="font-mono text-[11px] break-all">{row.key}</span>
            <span class="text-muted tabular-nums shrink-0">{formatBytes(row.approxBytes)}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
