<nav aria-label="Primary"><slot /></nav>
<style>
  @import "@alta/tokens/src/index.css";
  nav { display: flex; flex-direction: column; gap: var(--alta-space-2); }
  @media (max-width: 900px) {
    nav { flex-direction: row; flex-wrap: wrap; }
  }
</style>
