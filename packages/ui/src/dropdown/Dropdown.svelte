<script lang="ts">export let label = "Dropdown";</script>
<button class="alta-dropdown" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-dropdown { padding: var(--alta-space-2); }</style>
