export const FIXTURE_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const FIXTURE_ACTOR_ID = '00000000-0000-0000-0000-000000000002';

export function fixtureItem(overrides: Partial<{ id: string; tenant_id: string; title: string; created_at: string }> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    tenant_id: FIXTURE_TENANT_ID,
    title: 'Example item',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

export function fixtureSession() {
  return { tenant_id: FIXTURE_TENANT_ID, actor_id: FIXTURE_ACTOR_ID, authenticated: true };
}

export function fixtureEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_id: '22222222-2222-4222-8222-222222222222',
    event_type: 'reference_item.created.v1',
    event_version: 1,
    tenant_id: FIXTURE_TENANT_ID,
    occurred_at: '2026-01-01T00:00:01.000Z',
    payload: fixtureItem(),
    ...overrides
  };
}

export const fixtures = { tenantId: FIXTURE_TENANT_ID };
