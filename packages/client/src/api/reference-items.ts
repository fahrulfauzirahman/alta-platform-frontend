export interface ReferenceItem { id: string; tenant_id: string; title: string; created_at: string; }
export async function listReferenceItems(baseUrl: string, tenantId: string): Promise<ReferenceItem[]> {
  const r = await fetch(`${baseUrl}/v1/reference-items`, { headers: { 'X-Tenant-Id': tenantId } });
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  const j = await r.json();
  return j.items ?? j;
}
export async function createReferenceItem(baseUrl: string, tenantId: string, title: string, idempotencyKey?: string): Promise<ReferenceItem> {
  const r = await fetch(`${baseUrl}/v1/reference-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId, ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
    body: JSON.stringify({ title })
  });
  if (!r.ok) throw new Error(`create failed: ${r.status}`);
  return r.json();
}
