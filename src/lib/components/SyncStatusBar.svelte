<script lang="ts">
  import { cloudOnline, syncSnapshot, setCloudOnline, refreshSyncSnapshot } from '$lib/stores/syncRuntime';

  let metricsOpen = $state(false);

  function toggleOnline() {
    setCloudOnline(!$cloudOnline);
  }

  function flushNow() {
    void refreshSyncSnapshot();
  }

  function toggleMetrics() {
    metricsOpen = !metricsOpen;
  }
</script>

<div
  class="sidebar-sync border-t border-[var(--surface-dark-border)] px-3 py-3 text-xs shrink-0"
  role="region"
  aria-label="Sync and cloud simulation"
>
  <a
    href="/sync"
    class="text-[10px] font-medium uppercase tracking-wider text-[var(--text-on-dark-muted)] mb-2 block hover:text-[var(--text-on-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-dark)] rounded-sm"
  >
    Cloud sync
  </a>

  <div class="flex items-center gap-1.5 min-w-0">
    <span class="text-[var(--text-on-dark-muted)] shrink-0">Cloud</span>
    <button
      type="button"
      class="rounded-full px-2.5 py-1 text-[11px] font-medium transition shrink-0 {$cloudOnline
        ? 'bg-emerald-500/20 text-emerald-200'
        : 'bg-amber-500/25 text-amber-100'}"
      onclick={toggleOnline}
      aria-pressed={$cloudOnline}
      title={$cloudOnline ? 'Cloud online — click to simulate offline' : 'Cloud offline — click to go online'}
    >
      {$cloudOnline ? 'Online' : 'Offline'}
    </button>
    <button
      type="button"
      class="ml-auto p-1 rounded-md text-[var(--text-on-dark-muted)] hover:bg-[var(--surface-dark-hover)] hover:text-[var(--text-on-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] shrink-0"
      onclick={toggleMetrics}
      aria-expanded={metricsOpen}
      aria-controls="sync-metrics-panel"
      title={metricsOpen ? 'Hide metrics' : 'Show metrics'}
    >
      <span class="sr-only">{metricsOpen ? 'Hide' : 'Show'} sync metrics</span>
      <svg
        class="w-4 h-4 transition-transform duration-200 {metricsOpen ? 'rotate-180' : ''}"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>

  {#if metricsOpen}
    <div id="sync-metrics-panel" class="mt-3 flex flex-col gap-2 border-t border-[var(--surface-dark-border)] pt-3">
      <div class="flex justify-between gap-2 text-[var(--text-on-dark-muted)]">
        <span title="Events waiting to reach the in-browser cloud store">Outbox</span>
        <strong class="text-[var(--text-on-dark)] tabular-nums">{$syncSnapshot.pendingOutbox}</strong>
      </div>
      <div class="flex justify-between gap-2 text-[var(--text-on-dark-muted)]">
        <span title="Events accepted by cloud projection">Accepted</span>
        <strong class="text-[var(--text-on-dark)] tabular-nums">{$syncSnapshot.cloudAcceptedCount}</strong>
      </div>
      {#if $syncSnapshot.pendingOutbox > 0}
        <p class="text-[11px] leading-snug {$cloudOnline ? 'text-teal-200/90' : 'text-amber-100/90'}">
          {$cloudOnline ? 'Syncing to owner projection…' : 'Queued until cloud returns.'}
        </p>
        {#if $cloudOnline}
          <button
            type="button"
            class="text-left text-[11px] font-medium text-[var(--color-accent)] hover:text-teal-200 underline-offset-2 hover:underline"
            onclick={flushNow}
          >
            Flush now
          </button>
        {/if}
      {/if}
    </div>
  {/if}
</div>
