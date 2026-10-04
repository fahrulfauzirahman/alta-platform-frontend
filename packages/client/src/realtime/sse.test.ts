import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createEventStream, sseUrl } from './sse.js';
import { MockEventSource, installMockEventSource } from '@alta/testing/mocks';
import { FIXTURE_TENANT_ID, fixtureEvent } from '@alta/testing/fixtures';

beforeEach(() => { MockEventSource.reset(); installMockEventSource(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('sseUrl', () => {
  it('encodes tenant and cursor', () => {
    expect(sseUrl('/api', FIXTURE_TENANT_ID, 'abc')).toContain('tenantId=');
    expect(sseUrl('/api', FIXTURE_TENANT_ID, 'abc')).toContain('lastEventId=abc');
  });
});

describe('createEventStream', () => {
  it('delivers typed event once and dedupes duplicates', () => {
    const onEvent = vi.fn();
    const h = createEventStream('/api', FIXTURE_TENANT_ID, onEvent, { baseDelayMs: 10, maxDelayMs: 20 });
    const es = MockEventSource.instances[0];
    const ev = fixtureEvent();
    es.emit('reference_item.created.v1', JSON.stringify(ev));
    es.emit('reference_item.created.v1', JSON.stringify(ev));
    expect(onEvent).toHaveBeenCalledTimes(1);
    h.close();
  });
  it('ignores other-tenant events and malformed payloads', () => {
    const onEvent = vi.fn();
    const onError = vi.fn();
    const h = createEventStream('/api', FIXTURE_TENANT_ID, onEvent, { onError, baseDelayMs: 10, maxDelayMs: 20 });
    const es = MockEventSource.instances[0];
    es.emit('reference_item.created.v1', JSON.stringify({ ...fixtureEvent(), tenant_id: '99999999-9999-4999-8999-999999999999' }));
    es.emit('reference_item.created.v1', '{bad json');
    expect(onEvent).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    h.close();
  });
  it('reconnects with bounded attempts and closes cleanly', () => {
    const onState = vi.fn();
    const h = createEventStream('/api', FIXTURE_TENANT_ID, () => {}, { onState, baseDelayMs: 5, maxDelayMs: 10, maxRetries: 2 });
    const es = MockEventSource.instances[0];
    es.fail();
    vi.advanceTimersByTime(50);
    expect(MockEventSource.instances.length).toBeGreaterThan(1);
    h.close();
    expect(onState.mock.calls).toContainEqual(['closed']);
  });
});
