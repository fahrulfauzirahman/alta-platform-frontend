import { describe, it, expect } from 'vitest';
import { newIdempotencyKey } from './http.js';

describe('newIdempotencyKey', () => {
  it('returns a non-empty string', () => {
    expect(typeof newIdempotencyKey()).toBe('string');
    expect(newIdempotencyKey().length).toBeGreaterThan(0);
  });
  it('generates unique values', () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey());
  });
});
