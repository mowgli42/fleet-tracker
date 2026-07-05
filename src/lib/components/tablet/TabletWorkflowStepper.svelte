<script lang="ts">
  /**
   * Horizontal step indicator for tablet workflows (intake, maintenance).
   * Uses labels + state: upcoming | current | complete (or allComplete for finished flows).
   */
  let {
    steps,
    current = 0,
    allComplete = false,
    ariaLabel = 'Workflow progress'
  }: {
    steps: { label: string }[];
    current?: number;
    allComplete?: boolean;
    ariaLabel?: string;
  } = $props();
</script>

<nav class="proto-workflow-stepper" aria-label={ariaLabel}>
  <ol class="proto-workflow-stepper__list">
    {#each steps as s, i (i)}
      {@const done = allComplete || i < current}
      {@const active = !allComplete && i === current}
      <li
        class="proto-workflow-stepper__item"
        class:proto-workflow-stepper__item--done={done}
        class:proto-workflow-stepper__item--active={active}
        class:proto-workflow-stepper__item--upcoming={!done && !active}
      >
        <span class="proto-workflow-stepper__index" aria-hidden="true">
          {#if allComplete || i < current}
            <svg class="proto-workflow-stepper__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2 6l3 3 5-6"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else}
            {i + 1}
          {/if}
        </span>
        <span class="proto-workflow-stepper__label">{s.label}</span>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .proto-workflow-stepper {
    width: 100%;
  }
  .proto-workflow-stepper__list {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
  }
  .proto-workflow-stepper__list::before {
    content: '';
    position: absolute;
    left: 8%;
    right: 8%;
    top: 0.9rem;
    height: 2px;
    background: var(--proto-border);
    border-radius: 1px;
    z-index: 0;
  }
  .proto-workflow-stepper__item {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.35rem;
    min-width: 0;
  }
  .proto-workflow-stepper__index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    border: 2px solid var(--proto-border);
    background: var(--proto-surface);
    color: var(--proto-muted);
  }
  .proto-workflow-stepper__check {
    width: 0.75rem;
    height: 0.75rem;
  }
  .proto-workflow-stepper__item--done .proto-workflow-stepper__index {
    border-color: rgba(45, 212, 191, 0.5);
    background: rgba(45, 212, 191, 0.12);
    color: var(--proto-accent);
  }
  .proto-workflow-stepper__item--active .proto-workflow-stepper__index {
    border-color: var(--proto-accent);
    background: var(--proto-accent-dim);
    color: var(--proto-accent);
    box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
  }
  .proto-workflow-stepper__item--upcoming .proto-workflow-stepper__index {
    opacity: 0.85;
  }
  .proto-workflow-stepper__label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.2;
    color: var(--proto-muted);
    max-width: 100%;
  }
  .proto-workflow-stepper__item--active .proto-workflow-stepper__label {
    color: var(--proto-text);
  }
  .proto-workflow-stepper__item--done .proto-workflow-stepper__label {
    color: var(--proto-muted);
  }
</style>
