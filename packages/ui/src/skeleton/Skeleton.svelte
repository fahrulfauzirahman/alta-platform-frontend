<script lang="ts">export let label = "Skeleton";</script>
<button class="alta-skeleton" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-skeleton { padding: var(--alta-space-2); }</style>
