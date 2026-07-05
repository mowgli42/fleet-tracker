<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { initFleetDataFromStorage } from '$lib/stores/fleetData';

  onMount(() => {
    initFleetDataFromStorage();
  });
</script>

<div class="proto-tablet min-h-screen pb-[5.5rem]">
  <header
    class="sticky top-0 z-30 border-b px-4 py-3"
    style="background: var(--proto-surface); border-color: var(--proto-border);"
  >
    <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
      <div>
        <a href="/tablet" class="font-display text-base font-semibold no-underline" style="color: var(--proto-text);"
          >Shop floor</a>
        <p class="m-0 text-[11px]" style="color: var(--proto-muted);">Tablet prototype · intake, parts & maintenance</p>
      </div>
      <a href="/" class="proto-btn-ghost text-xs">Main app</a>
    </div>
  </header>

  <main id="main-content" class="mx-auto w-full max-w-2xl px-4 py-4">
    <slot />
  </main>

  <nav class="proto-tabbar" aria-label="Tablet navigation">
    <a href="/tablet" class:active={$page.url.pathname === '/tablet'} data-sveltekit-preload-data="hover">Home</a>
    <a href="/tablet/intake" class:active={$page.url.pathname.startsWith('/tablet/intake')} data-sveltekit-preload-data="hover"
      >Intake</a>
    <a
      href="/tablet/fleet"
      class:active={$page.url.pathname.startsWith('/tablet/fleet') ||
        $page.url.pathname.startsWith('/tablet/vehicle') ||
        $page.url.pathname.startsWith('/tablet/job')}
      data-sveltekit-preload-data="hover"
      >Fleet</a>
  </nav>
</div>
