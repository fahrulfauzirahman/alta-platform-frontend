<script lang="ts">export let label = "Input";</script>
<button class="alta-input" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-input { padding: var(--alta-space-2); }</style>
