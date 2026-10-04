<script lang="ts">
  export let label = 'Title';
  export let value = '';
  export let placeholder = '';
  export let invalid = false;
  export let errorId = '';
  export let disabled = false;
</script>
<label class="alta-field">
  <span>{label}</span>
  <input
    class="alta-input"
    bind:value
    {placeholder}
    {disabled}
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={invalid && errorId ? errorId : undefined}
  />
</label>
<style>
  @import "@alta/tokens/src/index.css";
  .alta-field { display: grid; gap: var(--alta-space-1); font-size: var(--alta-font-size-md); }
  .alta-input {
    min-height: var(--alta-touch-min);
    padding: var(--alta-space-2);
    border-radius: var(--alta-radius-md);
    border: 1px solid var(--alta-border);
    background: var(--alta-bg);
    color: var(--alta-fg);
  }
  .alta-input:focus-visible { outline: none; box-shadow: var(--alta-focus-ring); border-color: var(--alta-focus); }
  .alta-input[aria-invalid="true"] { border-color: var(--alta-danger); }
  .alta-input:disabled { background: var(--alta-disabled-bg); color: var(--alta-disabled-fg); }
</style>
