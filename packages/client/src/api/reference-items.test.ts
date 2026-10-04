import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateTitle, listReferenceItems, createReferenceItem } from './reference-items.js';
import { FIXTURE_TENANT_ID, fixtureItem } from '@alta/testing/fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('validateTitle', () => {
  it('rejects empty', () => expect(validateTitle('  ')).toBe('Title is required.'));
  it('rejects overlong', () => expect(validateTitle('x'.repeat(201))).toContain('200'));
  it('accepts valid', () => expect(validateTitle('hello')).toBeNull());
});

describe('listReferenceItems', () => {
  it('returns items array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [fixtureItem()] }), { status: 200 })));
    await expect(listReferenceItems('/api', FIXTURE_TENANT_ID)).resolves.toHaveLength(1);
  });
  it('throws SESSION_EXPIRED on 401 with user-safe message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'SESSION_EXPIRED', message: 'nope' }), { status: 401 })));
    await expect(listReferenceItems('/api', FIXTURE_TENANT_ID)).rejects.toMatchObject({ code: 'SESSION_EXPIRED', status: 401 });
  });
});

describe('createReferenceItem', () => {
  it('requires idempotency key', async () => {
    await expect(createReferenceItem('/api', FIXTURE_TENANT_ID, 't', '')).rejects.toThrow('idempotencyKey');
  });
  it('reports replayed on 200 vs created on 201', async () => {
    const item = fixtureItem();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(item), { status: 201 })));
    await expect(createReferenceItem('/api', FIXTURE_TENANT_ID, 't', 'k1')).resolves.toMatchObject({ replayed: false });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(item), { status: 200 })));
    await expect(createReferenceItem('/api', FIXTURE_TENANT_ID, 't', 'k1')).resolves.toMatchObject({ replayed: true });
  });
});
