<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let label = 'Button';
  export let disabled = false;
  export let busy = false;
  export let variant: 'primary' | 'secondary' = 'primary';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
  const dispatch = createEventDispatcher<{ click: MouseEvent }>();
  function handleClick(e: MouseEvent): void {
    if (disabled || busy) {
      e.preventDefault();
      return;
    }
    onclick?.(e);
    dispatch('click', e);
  }
</script>
<button
  class="alta-button"
  class:secondary={variant === 'secondary'}
  aria-label={label}
  aria-busy={busy ? 'true' : undefined}
  type={type}
  disabled={disabled || busy}
  on:click={handleClick}
>
  <slot>{label}</slot>{#if busy}<span aria-hidden="true"> …</span>{/if}
</button>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-button {
    min-height: var(--alta-touch-min);
    padding: var(--alta-space-2) var(--alta-space-4);
    border-radius: var(--alta-radius-md);
    border: 1px solid var(--alta-accent);
    background: var(--alta-accent);
    color: var(--alta-accent-fg);
    font-size: var(--alta-font-size-md);
  }
  .alta-button.secondary {
    background: transparent;
    color: var(--alta-accent);
  }
  .alta-button:focus-visible {
    outline: none;
    box-shadow: var(--alta-focus-ring);
  }
  .alta-button:disabled {
    background: var(--alta-disabled-bg);
    color: var(--alta-disabled-fg);
    border-color: var(--alta-disabled-bg);
    cursor: not-allowed;
  }
</style>
