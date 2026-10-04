export async function loadSession(baseUrl: string, tenantId: string) {
  const r = await fetch(`${baseUrl}/v1/session`, { headers: { 'X-Tenant-Id': tenantId } });
  if (!r.ok) throw new Error('session failed');
  return r.json();
}
