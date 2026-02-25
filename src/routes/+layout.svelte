<script lang="ts">
  import { page } from '$app/stores';
  import '../app.css';

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/fleet', label: 'Fleet' },
    { href: '/maintenance', label: 'Maintenance' },
    { href: '/parts', label: 'Parts' }
  ];
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
<div class="app-shell">
  <aside class="sidebar" aria-label="Main navigation">
    <div class="sidebar-header">
      <a href="/" class="logo">Fleet Tracker</a>
      <span class="version-pill" aria-label="Version 2.0">2.0</span>
    </div>
    <nav class="sidebar-nav">
      <ul>
        {#each navItems as item}
          <li>
            <a
              href={item.href}
              class:active={$page.url.pathname === item.href || (item.href !== '/' && $page.url.pathname.startsWith(item.href))}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>
  <main id="main-content" class="main">
    <slot />
  </main>
</div>
