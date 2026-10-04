<script lang="ts">
  export let label = 'Choose';
  export let value = '';
  export let options: string[] = [];
  export let id = 'alta-dropdown';
</script>
<label class="alta-field" for={id}><span>{label}</span></label>
<select class="alta-dropdown" {id} bind:value aria-label={label}>
  {#each options as o (o)}<option value={o}>{o}</option>{/each}
  <slot />
</select>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-field { display: grid; gap: var(--alta-space-1); }
  .alta-dropdown {
    min-height: var(--alta-touch-min);
    border-radius: var(--alta-radius-md);
    border: 1px solid var(--alta-border);
    padding: var(--alta-space-2);
    background: var(--alta-bg); color: var(--alta-fg);
  }
  .alta-dropdown:focus-visible { outline: none; box-shadow: var(--alta-focus-ring); }
</style>
