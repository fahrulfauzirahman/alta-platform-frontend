import type { components } from '../generated/types.js';

export type EventEnvelope = components['schemas']['EventEnvelope'];
export type ReferenceItemPayload = EventEnvelope['payload'];
export const REFERENCE_ITEM_CREATED = 'reference_item.created.v1' as const;
export const SUPPORTED_EVENTS = [REFERENCE_ITEM_CREATED] as const;
export type SupportedEventType = (typeof SUPPORTED_EVENTS)[number];

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseEventEnvelope(raw: unknown): EventEnvelope | null {
  const data = typeof raw === 'string' ? tryParse(raw) : raw;
  if (!isRecord(data)) return null;
  const { event_id, event_type, event_version, tenant_id, occurred_at, payload } = data;
  if (typeof event_id !== 'string' || !event_id) return null;
  if (event_type !== REFERENCE_ITEM_CREATED) return null;
  if (typeof event_version !== 'number') return null;
  if (typeof tenant_id !== 'string' || !tenant_id) return null;
  if (typeof occurred_at !== 'string' || !occurred_at) return null;
  if (!isRecord(payload)) return null;
  if (typeof payload.id !== 'string' || typeof payload.tenant_id !== 'string') return null;
  if (typeof payload.title !== 'string' || typeof payload.created_at !== 'string') return null;
  return data as unknown as EventEnvelope;
}

function tryParse(s: string): unknown {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

export function isSupportedEventType(t: unknown): t is SupportedEventType {
  return t === REFERENCE_ITEM_CREATED;
}
