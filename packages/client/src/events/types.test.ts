import { describe, it, expect } from 'vitest';
import { parseEventEnvelope } from './types.js';
import { fixtureEvent } from '@alta/testing/fixtures';

describe('parseEventEnvelope', () => {
  it('accepts valid envelope', () => {
    expect(parseEventEnvelope(fixtureEvent())?.event_type).toBe('reference_item.created.v1');
  });
  it('rejects unknown type', () => {
    expect(parseEventEnvelope({ ...fixtureEvent(), event_type: 'other.v9' })).toBeNull();
  });
  it('rejects malformed JSON string', () => {
    expect(parseEventEnvelope('{nope')).toBeNull();
  });
  it('rejects missing id', () => {
    const e = fixtureEvent() as Record<string, unknown>;
    const { event_id: _d, ...rest } = e;
    void _d;
    expect(parseEventEnvelope(rest)).toBeNull();
  });
});
