<script lang="ts">
  import { onMount } from 'svelte';
  import { initFleetDataFromStorage } from '$lib/stores/fleetData';

  onMount(() => initFleetDataFromStorage());
</script>

<div class="proto-cloud min-h-screen">
  <header class="cloud-header sticky top-0 z-30 px-4 py-3">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <div>
        <a href="/cloud" class="font-display text-lg font-semibold no-underline" style="color: var(--cloud-text);">Cloud operations</a>
        <p class="m-0 text-xs" style="color: var(--cloud-muted);">Multi-site health · assignment readiness · critical parts</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="/tablet" class="text-sm font-medium no-underline hover:underline" style="color: var(--cloud-muted);">Tablet</a>
        <a href="/" class="text-sm font-medium no-underline hover:underline" style="color: var(--cloud-accent);">Main app</a>
      </div>
    </div>
  </header>

  <main id="main-content" class="mx-auto w-full max-w-6xl px-4 py-6">
    <slot />
  </main>
</div>
