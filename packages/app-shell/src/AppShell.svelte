<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';
</script>
<a class="skip" href="#main">Skip to content</a>
<div class="shell">
  <Topbar><slot name="topbar" /></Topbar>
  <div class="body">
    <Sidebar><slot name="sidebar" /></Sidebar>
    <main id="main" tabindex="-1"><slot /></main>
  </div>
</div>
<style>
  @import "@alta/tokens/src/index.css";
  .skip { position: absolute; left: -9999px; top: 0; background: var(--alta-accent); color: var(--alta-accent-fg); padding: var(--alta-space-2); border-radius: var(--alta-radius-sm); }
  .skip:focus { left: var(--alta-space-2); top: var(--alta-space-2); }
  .shell { display: grid; grid-template-rows: auto 1fr; min-height: 100vh; background: var(--alta-bg); color: var(--alta-fg); }
  .body { display: grid; grid-template-columns: 240px 1fr; gap: var(--alta-space-4); padding: var(--alta-space-4); }
  main { min-width: 0; }
  main:focus { outline: none; }
  main:focus-visible { box-shadow: var(--alta-focus-ring); }
  @media (max-width: 900px) {
    .body { grid-template-columns: 1fr; }
  }
</style>
