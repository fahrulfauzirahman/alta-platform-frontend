<script lang="ts">export let label = "Button";</script>
<button class="alta-button" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-button { padding: var(--alta-space-2); }</style>
