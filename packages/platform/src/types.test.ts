import { describe, it, expect } from 'vitest';
import { assertSafeExternalUrl, assertSafeFileName } from './types.js';

describe('platform guards', () => {
  it('allows https', () => expect(assertSafeExternalUrl('https://example.com/x').protocol).toBe('https:'));
  it('rejects javascript:', () => expect(() => assertSafeExternalUrl('javascript:alert(1)')).toThrow());
  it('rejects file:', () => expect(() => assertSafeExternalUrl('file:///etc/passwd')).toThrow());
  it('rejects unsafe filenames', () => {
    expect(() => assertSafeFileName('../evil')).toThrow();
    expect(() => assertSafeFileName('..')).toThrow();
    expect(() => assertSafeFileName('a..b')).toThrow();
    expect(() => assertSafeFileName('.hidden')).toThrow();
    expect(() => assertSafeFileName('')).toThrow();
    expect(assertSafeFileName('notes.txt')).toBe('notes.txt');
  });
});
