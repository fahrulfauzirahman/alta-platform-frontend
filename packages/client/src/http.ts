import type { components } from './generated/types.js';

export type ErrorEnvelope = components['schemas']['ErrorEnvelope'];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly retryable: boolean;
  constructor(opts: { status: number; code: string; message: string; requestId?: string }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.requestId = opts.requestId;
    this.retryable = opts.status === 408 || opts.status === 429 || opts.status >= 500;
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseErrorEnvelope(body: unknown, status: number): Pick<ErrorEnvelope, 'code' | 'message' | 'request_id'> {
  if (isRecord(body) && typeof body.code === 'string' && typeof body.message === 'string') {
    return {
      code: body.code,
      message: body.message,
      request_id: typeof body.request_id === 'string' ? body.request_id : undefined
    };
  }
  return { code: `HTTP_${status}`, message: `Request failed (${status})` };
}

export function statusToCode(status: number, fallback: string): string {
  if (status === 400) return 'VALIDATION_ERROR';
  if (status === 401) return 'SESSION_EXPIRED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';
  return fallback;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
  actorId?: string;
}

export function resolveBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed === '' || trimmed === '/api') return '/api';
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  throw new ApiError({ status: 0, code: 'INVALID_BASE_URL', message: 'Invalid API base URL' });
}

export async function requestJson<T>(url: string, init: RequestInit, opts: RequestOptions = {}): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, credentials: 'same-origin' });
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
        code: isRecord(body) && typeof body.code === 'string' ? String(body.code) : statusToCode(res.status, parsed.code),
        message: userMessageFor(res.status, parsed.message),
        requestId: parsed.request_id ?? res.headers.get('x-request-id') ?? undefined
      });
    }
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      if (opts.signal?.aborted) throw new ApiError({ status: 0, code: 'ABORTED', message: 'Request was cancelled.' });
      throw new ApiError({ status: 0, code: 'TIMEOUT', message: 'Request timed out. You can retry safely.' });
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Backend is unreachable. Check your connection and retry.' });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }
}

export function userMessageFor(status: number, serverMessage: string): string {
  if (status === 400) return serverMessage || 'Check the highlighted field and try again.';
  if (status === 401) return 'Your session expired. Sign in again to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'That item no longer exists. Refresh the list.';
  if (status === 409) return 'Already saved. Refresh to see the current state.';
  if (status === 429) return 'Too many requests. Wait a moment and retry.';
  if (status >= 500) return 'Something went wrong on our side. Your input is preserved — retry in a moment.';
  if (status === 0) return serverMessage;
  return serverMessage || 'Something went wrong. Retry safely — creates are idempotent.';
}

export function newIdempotencyKey(): string {
  try {
    const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    /* fall through to fallback */
  }
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36).padStart(6, '0')}`;
}
