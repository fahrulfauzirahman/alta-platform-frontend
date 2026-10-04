<script lang="ts">import Sidebar from './Sidebar.svelte'; import Topbar from './Topbar.svelte';</script>
<div class="shell"><Topbar /><div class="body"><Sidebar /><main><slot /></main></div></div>
