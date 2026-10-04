import { vi } from 'vitest';

export function mockFetchOnce(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const status = init.status ?? 200;
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const res = new Response(payload, {
    status,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
  });
  const fn = vi.fn().mockResolvedValue(res);
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function mockFetchSequence(responses: Array<{ body: unknown; status?: number }>) {
  const fn = vi.fn().mockImplementation((..._args: unknown[]) => {
    const next = responses.shift() ?? { body: { items: [] }, status: 200 };
    return Promise.resolve(
      new Response(JSON.stringify(next.body), { status: next.status ?? 200, headers: { 'Content-Type': 'application/json' } })
    );
  });
  void _args;
  vi.stubGlobal('fetch', fn);
  return fn;
}

export class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: ((e: unknown) => void) | null = null;
  onmessage: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  listeners = new Map<string, Array<(e: unknown) => void>>();
  closed = false;
  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  removeEventListener(type: string, cb: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    this.listeners.set(type, list.filter((x) => x !== cb));
  }
  addEventListener(type: string, cb: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }
  emit(type: string, data: unknown): void {
    for (const cb of this.listeners.get(type) ?? []) cb({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }
  fail(): void {
    this.onerror?.(new Error('mock sse error'));
  }
  open(): void {
    this.onopen?.({});
  }
  close(): void {
    this.closed = true;
  }
  static reset(): void {
    MockEventSource.instances = [];
  }
}

export function installMockEventSource(): typeof MockEventSource {
  vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource);
  return MockEventSource;
}

export function mockPlatform() {
  return {
    kind: 'web' as const,
    notify: vi.fn().mockResolvedValue(undefined),
    openExternal: vi.fn().mockResolvedValue(undefined),
    saveFile: vi.fn().mockResolvedValue({ saved: true }),
    getSecureValue: vi.fn().mockResolvedValue(null),
    setBadgeCount: vi.fn().mockResolvedValue(undefined)
  };
}
