<script lang="ts">
  export let label = 'Badge';
  export let tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' = 'neutral';
</script>
<span class="alta-badge" data-tone={tone} aria-label={label}><slot>{label}</slot></span>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-badge {
    display: inline-flex; align-items: center;
    min-height: 28px; padding: 2px var(--alta-space-2);
    border-radius: var(--alta-radius-sm);
    border: 1px solid var(--alta-border);
    font-size: var(--alta-font-size-sm);
  }
  .alta-badge[data-tone="success"] { background: var(--alta-success-bg); color: var(--alta-success); border-color: currentColor; }
  .alta-badge[data-tone="warning"] { background: var(--alta-warning-bg); color: var(--alta-warning); border-color: currentColor; }
  .alta-badge[data-tone="danger"] { background: var(--alta-danger-bg); color: var(--alta-danger); border-color: currentColor; }
  .alta-badge[data-tone="info"] { background: var(--alta-info-bg); color: var(--alta-info); border-color: currentColor; }
</style>
