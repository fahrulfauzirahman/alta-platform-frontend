<script lang="ts">
  export let label = 'Loading';
</script>
<div class="alta-skeleton" role="status" aria-label={label} aria-busy="true"><span class="pulse" aria-hidden="true"></span><span class="text"><slot>{label}…</slot></span></div>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-skeleton { display: flex; gap: var(--alta-space-2); align-items: center; padding: var(--alta-space-2); }
  .pulse { width: 32px; height: 12px; border-radius: var(--alta-radius-sm); background: var(--alta-disabled-bg); }
</style>
