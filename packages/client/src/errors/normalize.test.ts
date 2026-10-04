import { describe, it, expect } from 'vitest';
import { normalizeError, isSessionExpired } from './normalize.js';
import { ApiError } from '../http.js';

describe('normalizeError', () => {
  it('preserves ApiError status/code/requestId', () => {
    const e = new ApiError({ status: 401, code: 'SESSION_EXPIRED', message: 'expired', requestId: 'r1' });
    expect(normalizeError(e)).toMatchObject({ code: 'SESSION_EXPIRED', status: 401, requestId: 'r1' });
  });
  it('detects session expiry', () => {
    expect(isSessionExpired(new ApiError({ status: 401, code: 'SESSION_EXPIRED', message: 'x' }))).toBe(true);
    expect(isSessionExpired(new ApiError({ status: 500, code: 'SERVER_ERROR', message: 'x' }))).toBe(false);
  });
  it('maps unknown to UNKNOWN', () => {
    expect(normalizeError('boom').code).toBe('UNKNOWN');
  });
});
