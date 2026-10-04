import type { components } from '../generated/types.js';
import { requestJson, resolveBase, type RequestOptions } from '../http.js';

export type Session = components['schemas']['Session'];

export async function loadSession(
  baseUrl: string,
  tenantId: string,
  opts: RequestOptions = {}
): Promise<Session> {
  const base = resolveBase(baseUrl);
  return requestJson<Session>(
    `${base}/v1/session`,
    {
      headers: {
        'X-Tenant-Id': tenantId,
        ...(opts.actorId ? { 'X-Actor-Id': opts.actorId } : {})
      }
    },
    opts
  );
}

export async function checkHealth(baseUrl: string, opts: RequestOptions = {}): Promise<boolean> {
  try {
    const base = resolveBase(baseUrl);
    await requestJson<unknown>(`${base}/healthz`, {}, { ...opts, timeoutMs: 5000 });
    return true;
  } catch {
    return false;
  }
}
