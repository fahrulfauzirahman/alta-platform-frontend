export function connectEvents(baseUrl: string, tenantId: string, onEvent: (e: unknown) => void): EventSource {
  const es = new EventSource(`${baseUrl}/v1/events`, {});
  // Note: EventSource cannot set headers; web/desktop inject tenant via query in real app.
  // Foundation uses same-origin proxy that attaches X-Tenant-Id.
  es.addEventListener('reference_item.created.v1', (ev) => onEvent((ev as MessageEvent).data));
  void tenantId;
  return es;
}
export function withReconnect(fn: () => EventSource, delayMs = 3000): () => void {
  let es = fn();
  let closed = false;
  es.onerror = () => { if (closed) return; setTimeout(() => { try { es.close(); } catch {} es = fn(); }, delayMs); };
  return () => { closed = true; es.close(); };
}
