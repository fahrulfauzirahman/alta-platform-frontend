import type { components } from '../generated/types.js';
import { ApiError, parseErrorEnvelope, requestJson, resolveBase, statusToCode, userMessageFor, type RequestOptions } from '../http.js';

export type ReferenceItem = components['schemas']['ReferenceItem'];
export type ReferenceItemList = components['schemas']['ReferenceItemList'];
export type CreateReferenceItemRequest = components['schemas']['CreateReferenceItemRequest'];

export function validateTitle(title: string): string | null {
  const t = title.trim();
  if (!t) return 'Title is required.';
  if (t.length > 200) return 'Title must be 200 characters or fewer.';
  return null;
}

function tenantHeaders(tenantId: string, opts: RequestOptions = {}): Record<string, string> {
  if (!tenantId) throw new Error('tenantId is required');
  const h: Record<string, string> = { 'X-Tenant-Id': tenantId };
  if (opts.actorId) h['X-Actor-Id'] = opts.actorId;
  if (opts.idempotencyKey) h['Idempotency-Key'] = opts.idempotencyKey;
  return h;
}

export async function listReferenceItems(
  baseUrl: string,
  tenantId: string,
  opts: RequestOptions & { limit?: number } = {}
): Promise<ReferenceItem[]> {
  const base = resolveBase(baseUrl);
  const limit = opts.limit ?? 50;
  const url = `${base}/v1/reference-items?limit=${encodeURIComponent(String(limit))}`;
  const body = await requestJson<ReferenceItemList | ReferenceItem[]>(
    url,
    { headers: tenantHeaders(tenantId, opts) },
    opts
  );
  if (Array.isArray(body)) return body;
  if (body && Array.isArray((body as ReferenceItemList).items)) return (body as ReferenceItemList).items;
  return [];
}

export async function createReferenceItem(
  baseUrl: string,
  tenantId: string,
  title: string,
  idempotencyKey: string,
  opts: RequestOptions = {}
): Promise<{ item: ReferenceItem; replayed: boolean }> {
  const validation = validateTitle(title);
  if (validation) throw new Error(validation);
  if (!idempotencyKey) throw new Error('idempotencyKey is required for safe retry');
  const base = resolveBase(baseUrl);
  const timeoutMs = opts.timeoutMs ?? 15000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(`${base}/v1/reference-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders(tenantId, { ...opts, idempotencyKey })
      },
      body: JSON.stringify({ title: title.trim() } satisfies CreateReferenceItemRequest),
      credentials: 'same-origin',
      signal: opts.signal?.aborted ? opts.signal : ctrl.signal
    });
    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        throw new ApiError({ status: res.status, code: 'MALFORMED_RESPONSE', message: 'Server returned an unreadable response.' });
      }
    }
    if (!res.ok) {
      const parsed = parseErrorEnvelope(body, res.status);
      throw new ApiError({
        status: res.status,
        code: parsed.code.startsWith('HTTP_') ? statusToCode(res.status, parsed.code) : parsed.code,
        message: userMessageFor(res.status, parsed.message),
        requestId: parsed.request_id ?? res.headers.get('x-request-id') ?? undefined
      });
    }
    return { item: body as ReferenceItem, replayed: res.status === 200 };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError({ status: 0, code: opts.signal?.aborted ? 'ABORTED' : 'TIMEOUT', message: 'Request timed out. Your input is preserved — retry safely.' });
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Backend is unreachable. Check your connection and retry.' });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }
}
