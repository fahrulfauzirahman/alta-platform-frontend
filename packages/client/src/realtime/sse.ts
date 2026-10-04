import { parseEventEnvelope, type EventEnvelope } from '../events/types.js';

export interface SseOptions {
  lastEventId?: string;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onState?: (s: 'connecting' | 'open' | 'reconnecting' | 'closed') => void;
  onError?: (e: unknown) => void;
}

export interface SseHandle {
  close: () => void;
  getLastEventId: () => string | undefined;
  getAttempts: () => number;
}

export function sseUrl(baseUrl: string, tenantId: string, lastEventId?: string): string {
  const base = (baseUrl.replace(/\/+$/, '') || '/api');
  const q = `tenantId=${encodeURIComponent(tenantId)}${lastEventId ? `&lastEventId=${encodeURIComponent(lastEventId)}` : ''}`;
  return `${base}/v1/events?${q}`;
}

function jitter(delay: number): number {
  return Math.round(delay * (0.7 + Math.random() * 0.6));
}

export function createEventStream(
  baseUrl: string,
  tenantId: string,
  onEvent: (e: EventEnvelope) => void,
  opts: SseOptions = {}
): SseHandle {
  if (typeof EventSource === 'undefined') throw new Error('EventSource unavailable in this runtime');
  if (!tenantId) throw new Error('tenantId is required');
  let es: EventSource | null = null;
  let closed = false;
  let attempts = 0;
  let lastEventId = opts.lastEventId;
  const seen = new Set<string>();
  const maxRetries = opts.maxRetries ?? 20;
  const baseDelay = opts.baseDelayMs ?? 1000;
  const maxDelay = opts.maxDelayMs ?? 30000;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (es) { try { es.close(); } catch { /* noop */ } es = null; }
  };

  const deliver = (raw: unknown) => {
    const env = parseEventEnvelope(raw);
    if (!env) {
      opts.onError?.(new Error('Ignored malformed or unknown SSE event'));
      return;
    }
    if (env.tenant_id !== tenantId) return;
    if (seen.has(env.event_id)) return;
    seen.add(env.event_id);
    if (seen.size > 1000) {
      const first = seen.values().next().value as string | undefined;
      if (first) seen.delete(first);
    }
    lastEventId = env.event_id;
    attempts = 0;
    onEvent(env);
  };

  const schedule = () => {
    if (closed || attempts >= maxRetries) {
      opts.onState?.('closed');
      return;
    }
    const exp = Math.min(maxDelay, baseDelay * 2 ** attempts);
    attempts += 1;
    opts.onState?.('reconnecting');
    timer = setTimeout(connect, jitter(exp));
  };

  function connect(): void {
    if (closed) return;
    cleanup();
    opts.onState?.('connecting');
    es = new EventSource(sseUrl(baseUrl, tenantId, lastEventId));
    es.onopen = () => {
      attempts = 0;
      opts.onState?.('open');
    };
    es.addEventListener('reference_item.created.v1', (ev) => {
      deliver((ev as MessageEvent).data);
    });
    es.onmessage = (ev) => deliver((ev as MessageEvent).data);
    es.onerror = () => {
      if (closed) return;
      try { es?.close(); } catch { /* noop */ }
      es = null;
      schedule();
    };
  }

  connect();
  return {
    close: () => { closed = true; cleanup(); opts.onState?.('closed'); },
    getLastEventId: () => lastEventId,
    getAttempts: () => attempts
  };
}

export function connectEvents(
  baseUrl: string,
  tenantId: string,
  onEvent: (e: EventEnvelope) => void
): EventSource {
  if (typeof EventSource === 'undefined') throw new Error('EventSource unavailable in this runtime');
  const es = new EventSource(sseUrl(baseUrl, tenantId));
  es.addEventListener('reference_item.created.v1', (ev) => {
    const env = parseEventEnvelope((ev as MessageEvent).data);
    if (env && env.tenant_id === tenantId) onEvent(env);
  });
  return es;
}

export function withReconnect(fn: () => EventSource, delayMs = 3000): () => void {
  let es = fn();
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const arm = (target: EventSource) => {
    target.onerror = () => {
      if (closed) return;
      timer = setTimeout(() => {
        if (closed) return;
        try { target.close(); } catch { /* noop */ }
        es = fn();
        arm(es);
      }, jitter(delayMs));
    };
  };
  arm(es);
  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    try { es.close(); } catch { /* noop */ }
  };
}
