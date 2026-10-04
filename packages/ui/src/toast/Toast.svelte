<script lang="ts">
  export let label = 'Notice';
  export let tone: 'info' | 'success' | 'danger' = 'info';
</script>
<div class="alta-toast" data-tone={tone} role="status" aria-live="polite" aria-label={label}><slot>{label}</slot></div>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-toast {
    border-radius: var(--alta-radius-md);
    padding: var(--alta-space-2) var(--alta-space-4);
    border: 1px solid var(--alta-border);
    background: var(--alta-bg); color: var(--alta-fg);
  }
  .alta-toast[data-tone="success"] { border-color: var(--alta-success); background: var(--alta-success-bg); color: var(--alta-success); }
  .alta-toast[data-tone="danger"] { border-color: var(--alta-danger); background: var(--alta-danger-bg); color: var(--alta-danger); }
</style>
