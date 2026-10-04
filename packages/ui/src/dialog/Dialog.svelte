<script lang="ts">export let label = "Dialog";</script>
<button class="alta-dialog" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-dialog { padding: var(--alta-space-2); }</style>
