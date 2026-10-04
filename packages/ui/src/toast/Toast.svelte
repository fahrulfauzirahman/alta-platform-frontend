<script lang="ts">export let label = "Toast";</script>
<button class="alta-toast" aria-label={label}><slot>{label}</slot></button>
<style>@import "@alta/tokens/src/index.css"; .alta-toast { padding: var(--alta-space-2); }</style>
