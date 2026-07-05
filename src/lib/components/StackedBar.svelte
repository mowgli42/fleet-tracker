<script lang="ts">
  /**
   * Horizontal stacked bar chart. Each segment uses a background color (status/priority).
   * Shows total and optional legend.
   */
  let {
    segments,
    totalLabel = 'Total',
    height = '1.25rem',
    showLegend = true,
    theme = 'default'
  }: {
    segments: { label: string; count: number; bg: string; textColor?: string }[];
    totalLabel?: string;
    height?: string;
    showLegend?: boolean;
    /** Cloud ops shell uses light track + muted legend. */
    theme?: 'default' | 'cloud';
  } = $props();

  const total = $derived(segments.reduce((s, seg) => s + seg.count, 0));
  const nonZero = $derived(segments.filter((s) => s.count > 0));

  const trackClass = $derived(
    theme === 'cloud'
      ? 'border border-[var(--cloud-border)] bg-[var(--cloud-bg)]'
      : 'border border-[var(--border-subtle)] bg-slate-100'
  );
  const legendTextClass = $derived(theme === 'cloud' ? 'text-[var(--cloud-muted)]' : 'text-muted');
</script>

<div class="stacked-bar flex flex-col gap-1.5">
  <div
    class="flex rounded-md overflow-hidden {trackClass}"
    style="height: {height}; min-height: {height};"
    role="img"
    aria-label="{totalLabel}: {total}. {nonZero.map((s) => `${s.label}: ${s.count}`).join(', ')}"
  >
    {#each nonZero as seg}
      {#if seg.count > 0}
        <div
          class="min-w-0 flex items-center justify-center text-xs font-medium truncate shrink-0"
          style="width: {total > 0 ? (seg.count / total) * 100 : 0}%; background: {seg.bg}; color: {seg.textColor ?? '#374151'};"
          title="{seg.label}: {seg.count}"
        >
          {#if total > 0 && (seg.count / total) * 100 >= 12}
            <span class="truncate px-0.5">{seg.count}</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  {#if showLegend && nonZero.length > 0}
    <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs {legendTextClass}">
      {#each nonZero as seg}
        <span class="flex items-center gap-1">
          <span
            class="inline-block w-2 h-2 rounded-full shrink-0"
            style="background: {seg.bg};"
            aria-hidden="true"
          ></span>
          <span>{seg.label}: {seg.count}</span>
        </span>
      {/each}
    </div>
  {/if}
</div>
