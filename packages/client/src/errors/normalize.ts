export function normalizeError(e: unknown): { code: string; message: string } {
  if (e instanceof Error) return { code: 'CLIENT_ERROR', message: e.message };
  return { code: 'UNKNOWN', message: String(e) };
}
