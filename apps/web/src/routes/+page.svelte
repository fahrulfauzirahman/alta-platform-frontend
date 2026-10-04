<script lang="ts">
  import { AppShell } from '@alta/app-shell';
  import { Button } from '@alta/ui';
  import { listReferenceItems, createReferenceItem } from '@alta/client';
  let items: any[] = [];
  let title = '';
  let error = '';
  async function load() {
    try { items = await listReferenceItems('/api', '00000000-0000-0000-0000-000000000001'); }
    catch (e) { error = String(e); }
  }
  async function create() {
    try { await createReferenceItem('/api', '00000000-0000-0000-0000-000000000001', title, crypto.randomUUID()); title=''; await load(); }
    catch (e) { error = String(e); }
  }
  load();
</script>
<AppShell><h1>Reference items (web)</h1>
{#if error}<p role="alert">{error} <button on:click={load}>Retry</button></p>{/if}
{#if items.length === 0}<p>Empty - create your first item.</p>{/if}
<ul>{#each items as it}<li>{it.title}</li>{/each}</ul>
<input bind:value={title} aria-label="Title" placeholder="New item" />
<Button on:click={create}>Create</Button>
</AppShell>
