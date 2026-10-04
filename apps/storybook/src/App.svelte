<script lang="ts">
  import { Button, Input, Dialog, Skeleton, Toast, Badge, Dropdown } from '@alta/ui';
  import { AppShell } from '@alta/app-shell';

  let name = '';
  let choice = 'One';
  let dialogOpen = false;
</script>
<AppShell>
  <span slot="topbar"><strong>ALTA UI</strong>&nbsp;Explorer (production components)</span>
  <span slot="sidebar">Primitives · States · Themes</span>

  <h1>Button</h1>
  <Button label="Primary">Primary</Button>
  <Button label="Secondary" variant="secondary">Secondary</Button>
  <Button label="Busy" busy={true}>Busy</Button>
  <Button label="Disabled" disabled={true}>Disabled</Button>

  <h1>Input</h1>
  <Input label="Name" bind:value={name} placeholder="Type…" />
  <Input label="Invalid" value="x" invalid={true} errorId="demo-err" />
  <p id="demo-err" role="alert">Demo error text.</p>

  <h1>Dropdown</h1>
  <Dropdown label="Choice" bind:value={choice} options={['One', 'Two', 'Three']} />

  <h1>Dialog</h1>
  <Button label="Open dialog" on:click={() => (dialogOpen = true)}>Open dialog</Button>
  <Dialog label="Demo dialog" bind:open={dialogOpen}><p>Focus enters here. Press Escape to close.</p></Dialog>

  <h1>Skeleton / Toast / Badge</h1>
  <Skeleton label="Loading demo" />
  <Toast label="Saved" tone="success">Saved.</Toast>
  <Toast label="Failed" tone="danger">Failed.</Toast>
  <Badge label="Neutral">Neutral</Badge>
  <Badge label="OK" tone="success">OK</Badge>
  <Badge label="Warn" tone="warning">Warn</Badge>
  <Badge label="Bad" tone="danger">Bad</Badge>
</AppShell>
<style>
  h1 { font-size: 1.1rem; margin: 24px 0 8px; }
</style>
