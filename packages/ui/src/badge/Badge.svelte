<script lang="ts">export let label = "Badge";</script>
<button class="alta-badge" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-badge { padding: var(--alta-space-2); }</style>
