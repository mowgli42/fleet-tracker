<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import '../app.css';
  import SyncStatusBar from '$lib/components/SyncStatusBar.svelte';
  import { initSyncRuntime } from '$lib/stores/syncRuntime';

  onMount(() => {
    initSyncRuntime();
  });

  $: isPrototypeShell =
    $page.url.pathname.startsWith('/tablet') ||
    $page.url.pathname.startsWith('/cloud') ||
    $page.url.pathname.startsWith('/track');

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/fleet', label: 'Fleet' },
    { href: '/maintenance', label: 'Maintenance' },
    { href: '/parts', label: 'Parts' },
    { href: '/sync', label: 'Sync' },
    { href: '/tablet', label: 'Tablet' },
    { href: '/cloud', label: 'Cloud' }
  ];
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
{#if isPrototypeShell}
  <slot />
{:else}
<div class="app-shell">
  <aside class="sidebar" aria-label="Main navigation">
    <div class="sidebar-header">
      <a href="/" class="logo">Fleet Tracker</a>
      <span class="version-pill" aria-label="Version 2.0">2.0</span>
    </div>
    <nav class="sidebar-nav flex-1 min-h-0" aria-label="Primary">
      <ul>
        {#each navItems as item}
          <li>
            <a
              href={item.href}
              class:active={item.href === '/sync'
                ? $page.url.pathname === '/sync'
                : item.href === '/tablet'
                  ? $page.url.pathname.startsWith('/tablet')
                  : item.href === '/cloud'
                    ? $page.url.pathname.startsWith('/cloud')
                    : $page.url.pathname === item.href ||
                      (item.href !== '/' && $page.url.pathname.startsWith(item.href))}
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
