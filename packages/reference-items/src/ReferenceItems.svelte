<!-- Neutral reference/demo feature. Not an ALTA business domain. -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Button, Input, Skeleton, Toast, Badge } from '@alta/ui';
  import {
    listReferenceItems,
    createReferenceItem,
    validateTitle,
    normalizeError,
    isSessionExpired,
    createEventStream,
    newIdempotencyKey,
    type ReferenceItem,
    type SseHandle
  } from '@alta/client';

  export let baseUrl = '/api';
  export let tenantId = '';
  export let actorId: string | undefined = undefined;
  export let heading = 'Reference items';
  export type PlatformLike = {
    kind: string;
    notify: (input: { title: string; body?: string }) => Promise<void>;
    saveFile: (input: { name: string; contents: string }) => Promise<{ saved: boolean; path?: string }>;
  };
  export let platform: PlatformLike | undefined = undefined;

  let items: ReferenceItem[] = [];
  let title = '';
  let loading = true;
  let creating = false;
  let error: string | null = null;
  let requestId: string | undefined = undefined;
  let sessionExpired = false;
  let validation: string | null = null;
  let offline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  let sseState: 'connecting' | 'open' | 'reconnecting' | 'closed' = 'connecting';
  let lastEventId: string | undefined = undefined;
  let sseHandle: SseHandle | null = null;
  let abort: AbortController | null = null;
  let platformNote: string | null = null;

  function onOnline(): void { offline = false; void load(); }
  function onOffline(): void { offline = true; }

  async function load(): Promise<void> {
    if (!tenantId) {
      error = 'Missing tenant context.';
      loading = false;
      return;
    }
    abort?.abort();
    abort = new AbortController();
    loading = true;
    error = null;
    requestId = undefined;
    sessionExpired = false;
    try {
      items = await listReferenceItems(baseUrl, tenantId, { signal: abort.signal, actorId });
    } catch (e) {
      const n = normalizeError(e);
      error = n.message;
      requestId = n.requestId;
      sessionExpired = isSessionExpired(e);
    } finally {
      loading = false;
    }
  }

  async function create(): Promise<void> {
    validation = validateTitle(title);
    if (validation) return;
    if (!tenantId || creating) return;
    creating = true;
    error = null;
    requestId = undefined;
    sessionExpired = false;
    const value = title;
    const key = newIdempotencyKey();
    try {
      const { item, replayed } = await createReferenceItem(baseUrl, tenantId, value, key, { actorId });
      title = '';
      validation = null;
      if (!items.some((it) => it.id === item.id)) items = [...items, item];
      void replayed;
      await load();
    } catch (e) {
      const n = normalizeError(e);
      error = n.message;
      requestId = n.requestId;
      sessionExpired = isSessionExpired(e);
    } finally {
      creating = false;
    }
  }

  function applyRemote(item: ReferenceItem): void {
    if (item.tenant_id !== tenantId) return;
    if (items.some((it) => it.id === item.id)) return;
    items = [...items, item];
  }

  async function saveList(): Promise<void> {
    platformNote = null;
    try {
      const contents = JSON.stringify(items, null, 2);
      if (platform) {
        const res = await platform.saveFile({ name: 'reference-items.json', contents });
        platformNote = res.saved ? 'List saved via platform adapter.' : 'Save cancelled.';
      } else {
        const blob = new Blob([contents], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        try {
          const a = document.createElement('a');
          a.href = url;
          a.download = 'reference-items.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          platformNote = 'List downloaded.';
        } finally {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      }
    } catch {
      platformNote = 'Save failed.';
    }
  }

  async function notifyCount(): Promise<void> {
    platformNote = null;
    try {
      if (platform) {
        await platform.notify({ title: 'Reference items', body: items.length + ' items' });
        platformNote = 'Notification sent via platform adapter (' + platform.kind + ').';
      } else {
        platformNote = 'Platform adapter not wired.';
      }
    } catch {
      platformNote = 'Notify failed.';
    }
  }

  onMount(() => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    void load();
    if (tenantId) {
      try {
        sseHandle = createEventStream(
          baseUrl,
          tenantId,
          (env) => {
            lastEventId = env.event_id;
            applyRemote({
              id: String(env.payload.id),
              tenant_id: env.tenant_id,
              title: String(env.payload.title),
              created_at: String(env.payload.created_at)
            });
          },
          {
            onState: (s) => { sseState = s; },
            onError: () => {}
          }
        );
      } catch {
        sseState = 'closed';
      }
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    }
    abort?.abort();
    sseHandle?.close();
  });
</script>
<section aria-label={heading}>
  <div class="head">
    <h1>{heading} <span class="demo">(reference demo)</span></h1>
    <Badge tone={sseState === 'open' ? 'success' : sseState === 'reconnecting' ? 'warning' : 'neutral'} label={'Realtime ' + sseState}>
      {sseState}{#if lastEventId} · {lastEventId.slice(0, 8)}{/if}
    </Badge>
  </div>

  {#if offline}
    <Toast tone="info" label="Offline">You are offline. Creates will fail until you reconnect.</Toast>
  {/if}

  {#if loading}
    <Skeleton label="Loading reference items" />
  {:else if error}
    <p id="ref-error" role="alert" class="error">
      {error}
      {#if requestId}<span class="req"> · ref {requestId}</span>{/if}
      {#if sessionExpired}<span> — sign in again, then retry.</span>{/if}
      <Button label="Retry" variant="secondary" type="button" onclick={() => load()}>Retry</Button>
    </p>
  {/if}

  {#if !loading && !error && items.length === 0}
    <p class="empty">Empty — create your first item.</p>
  {/if}

  {#if !loading && !error && items.length > 0}
    <ul>
      {#each items as it (it.id)}
        <li>{it.title}</li>
      {/each}
    </ul>
    <div class="row">
      <Button label="Save list" variant="secondary" type="button" onclick={() => saveList()}>Save list</Button>
      <Button label="Notify count" variant="secondary" type="button" onclick={() => notifyCount()}>Notify count</Button>
    </div>
    {#if platformNote}<p class="note" role="status">{platformNote}</p>{/if}
  {/if}

  <form on:submit|preventDefault={create}>
    <Input label="Title" bind:value={title} placeholder="New item" invalid={!!validation} errorId={validation ? 'title-error' : ''} />
    {#if validation}<p id="title-error" role="alert" class="error">{validation}</p>{/if}
    <Button label={creating ? 'Creating' : 'Create'} type="submit" busy={creating} disabled={creating || !tenantId}>Create</Button>
  </form>
</section>
<style>
  @import "@alta/tokens/src/index.css";
  section { display: grid; gap: var(--alta-space-4); }
  .head { display: flex; align-items: center; justify-content: space-between; gap: var(--alta-space-4); flex-wrap: wrap; }
  h1 { font-size: var(--alta-font-size-lg); margin: 0; }
  .demo { font-size: var(--alta-font-size-sm); color: var(--alta-muted); font-weight: normal; }
  .error { border: 1px solid var(--alta-danger); background: var(--alta-danger-bg); color: var(--alta-danger); padding: var(--alta-space-2); border-radius: var(--alta-radius-md); }
  .req { font-size: var(--alta-font-size-sm); }
  .empty { color: var(--alta-muted); }
  ul { display: grid; gap: var(--alta-space-2); padding: 0; list-style: none; }
  li { border: 1px solid var(--alta-border); border-radius: var(--alta-radius-md); padding: var(--alta-space-2); }
  form { display: grid; gap: var(--alta-space-2); max-width: 420px; }
  .row { display: flex; gap: var(--alta-space-2); flex-wrap: wrap; }
  .note { color: var(--alta-muted); font-size: var(--alta-font-size-sm); }
</style>
