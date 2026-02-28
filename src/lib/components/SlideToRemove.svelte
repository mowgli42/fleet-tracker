<script lang="ts">
  import IconTrash from '$lib/components/IconTrash.svelte';

  let {
    label = 'Remove',
    confirmMessage = 'Remove this item?',
    onRemove
  }: {
    label?: string;
    confirmMessage?: string;
    onRemove: () => void;
  } = $props();

  const trackWidth = 160;
  const thumbSize = 36;
  const maxTravel = trackWidth - thumbSize;
  const threshold = maxTravel * 0.85;

  let position = $state(0);
  let isDragging = $state(false);
  let startX = 0;
  let startPosition = 0;

  function handlePointerDown(e: PointerEvent) {
    if (position >= threshold) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging = true;
    startX = e.clientX;
    startPosition = position;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    position = Math.max(0, Math.min(maxTravel, startPosition + delta));
  }

  function handlePointerUp() {
    if (!isDragging) return;
    isDragging = false;
    if (position >= threshold) {
      if (confirm(confirmMessage)) onRemove();
      position = 0;
    } else {
      position = 0;
    }
  }
</script>

<div
  class="flex items-center gap-2"
  role="group"
  aria-label={label}
>
  <div
    class="relative h-9 rounded-full border border-[var(--border-subtle)] bg-slate-100 overflow-hidden select-none touch-none"
    style="width: {trackWidth}px;"
  >
    <div
      class="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-slate-300 text-slate-600 transition-colors hover:bg-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 cursor-grab active:cursor-grabbing {!isDragging ? 'transition-transform duration-200' : ''}"
      style="width: {thumbSize}px; height: {thumbSize}px; transform: translate({position}px, -50%);"
      role="button"
      tabindex="0"
      aria-label="Slide to {label.toLowerCase()}"
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
      onkeydown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          position = Math.min(maxTravel, position + 20);
          if (position >= threshold && !isDragging) {
            if (confirm(confirmMessage)) onRemove();
            position = 0;
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          position = Math.max(0, position - 20);
        } else if (e.key === 'Enter' && position >= threshold) {
          e.preventDefault();
          if (confirm(confirmMessage)) onRemove();
          position = 0;
        }
      }}
    >
      <IconTrash size={16} />
    </div>
    <span class="absolute inset-0 flex items-center justify-center text-xs text-muted pointer-events-none pl-8">Slide to remove</span>
  </div>
</div>
