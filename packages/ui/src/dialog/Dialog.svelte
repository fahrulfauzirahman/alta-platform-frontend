<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  export let label = 'Dialog';
  export let open = false;
  let dialogEl: HTMLDialogElement | null = null;
  let returnTo: HTMLElement | null = null;
  const dispatch = createEventDispatcher<{ close: void }>();
  $: if (open && typeof document !== 'undefined') {
    returnTo = document.activeElement as HTMLElement | null;
    tick().then(() => dialogEl?.showModal());
  } else if (!open) {
    dialogEl?.close();
    returnTo?.focus?.();
  }
  function onClose(): void {
    open = false;
    dispatch('close');
    returnTo?.focus?.();
  }
  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') onClose();
  }
</script>
<dialog class="alta-dialog" aria-label={label} bind:this={dialogEl} on:close={onClose} on:keydown={onKey}>
  <slot />
</dialog>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-dialog {
    border-radius: var(--alta-radius-lg);
    border: 1px solid var(--alta-border);
    padding: var(--alta-space-6);
    max-width: min(560px, calc(100vw - 32px));
    background: var(--alta-bg);
    color: var(--alta-fg);
  }
  .alta-dialog::backdrop { background: rgb(0 0 0 / 0.4); }
</style>
