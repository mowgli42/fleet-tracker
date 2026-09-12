<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import '../app.css';
  import SyncStatusBar from '$lib/components/SyncStatusBar.svelte';
  import DemoBanner from '$lib/components/DemoBanner.svelte';
  import { initClientApp } from '$lib/demo/clientBootstrap';
  import { isDemoMode } from '$lib/demo/demoMode';

  const demoMode = isDemoMode();

  let sidebarOpen = $state(false);
  let isMobileNav = $state(false);

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/fleet', label: 'Fleet' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/maintenance', label: 'Maintenance' },
    { href: '/parts', label: 'Parts' },
    { href: '/sync', label: 'Sync' },
    { href: '/tablet', label: 'Tablet' },
    { href: '/cloud', label: 'Cloud' }
  ];

  function isNavActive(href: string, pathname: string): boolean {
    if (href === '/sync') return pathname === '/sync';
    if (href === '/tablet') return pathname.startsWith('/tablet');
    if (href === '/cloud') return pathname.startsWith('/cloud');
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }

  const isPrototypeShell = $derived(
    $page.url.pathname.startsWith('/tablet') ||
      $page.url.pathname.startsWith('/cloud') ||
      $page.url.pathname.startsWith('/track')
  );

  const currentPageLabel = $derived(
    navItems.find((item) => isNavActive(item.href, $page.url.pathname))?.label ?? 'Fleet Tracker'
  );

  afterNavigate(() => {
    sidebarOpen = false;
  });

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('nav-drawer-open', isMobileNav && sidebarOpen);
  });

  onMount(() => {
    initClientApp();

    const mq = window.matchMedia('(max-width: 1023px)');
    const syncNavMode = () => {
      isMobileNav = mq.matches;
      if (!mq.matches) sidebarOpen = false;
    };
    syncNavMode();
    mq.addEventListener('change', syncNavMode);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      mq.removeEventListener('change', syncNavMode);
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-drawer-open');
    };
  });
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
{#if demoMode}
  <DemoBanner />
{/if}
{#if isPrototypeShell}
  <slot />
{:else}
<div class="app-shell" class:app-shell--nav-open={sidebarOpen}>
  <header class="mobile-topbar" aria-label="App header">
    <button
      type="button"
      class="mobile-menu-btn"
      onclick={toggleSidebar}
      aria-expanded={sidebarOpen}
      aria-controls="app-sidebar"
    >
      <span class="sr-only">{sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}</span>
      <svg class="mobile-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        {#if sidebarOpen}
          <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
        {:else}
          <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
        {/if}
      </svg>
    </button>
    <div class="mobile-topbar-title-wrap min-w-0">
      <a href="/" class="mobile-topbar-title">{currentPageLabel}</a>
      <span class="mobile-topbar-subtitle">Fleet Tracker</span>
    </div>
    <span class="version-pill mobile-version-pill" aria-label="Version 2.0">2.0</span>
  </header>

  {#if isMobileNav && sidebarOpen}
    <button
      type="button"
      class="sidebar-backdrop"
      aria-label="Close navigation menu"
      onclick={closeSidebar}
    ></button>
  {/if}

  <aside
    id="app-sidebar"
    class="sidebar"
    class:sidebar--open={sidebarOpen}
    aria-label="Main navigation"
    inert={isMobileNav && !sidebarOpen ? true : undefined}
  >
    <div class="sidebar-header">
      <a href="/" class="logo">Fleet Tracker</a>
      <div class="sidebar-header-actions">
        <span class="version-pill" aria-label="Version 2.0">2.0</span>
        <button
          type="button"
          class="sidebar-close-btn"
          onclick={closeSidebar}
          aria-label="Close navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
    <nav class="sidebar-nav flex-1 min-h-0" aria-label="Primary">
      <ul>
        {#each navItems as item}
          <li>
            <a
              href={item.href}
              class:active={isNavActive(item.href, $page.url.pathname)}
              onclick={closeSidebar}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <SyncStatusBar />
  </aside>

  <main id="main-content" class="main">
    <slot />
  </main>
</div>
{/if}
