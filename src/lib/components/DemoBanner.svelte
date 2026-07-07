<script lang="ts">
  import { getUtcDayKey, resetDemo } from '$lib/demo/demoMode';

  const demoDay = getUtcDayKey();
</script>

<div class="demo-banner" role="status" aria-live="polite">
  <div class="demo-banner-inner">
    <p class="demo-banner-text">
      <strong>Demo mode</strong>
      — Data resets daily (UTC) in this browser. Today: {demoDay}.
    </p>
    <button type="button" class="demo-banner-reset" onclick={() => resetDemo()}>
      Reset demo
    </button>
  </div>
</div>

<style>
  .demo-banner {
    position: sticky;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid #b45309;
    background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
    color: #78350f;
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .demo-banner-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    max-width: 90rem;
    margin: 0 auto;
    padding: 0.5rem 1rem;
  }

  .demo-banner-text {
    margin: 0;
  }

  .demo-banner-reset {
    flex-shrink: 0;
    border: 1px solid #d97706;
    border-radius: 0.375rem;
    background: #ffffff;
    color: #92400e;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    transition: background 150ms ease;
  }

  .demo-banner-reset:hover {
    background: #fff7ed;
  }

  .demo-banner-reset:focus-visible {
    outline: 2px solid #d97706;
    outline-offset: 2px;
  }
</style>
