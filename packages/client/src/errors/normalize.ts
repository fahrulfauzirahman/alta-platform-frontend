import { ApiError } from '../http.js';

export interface NormalizedError {
  code: string;
  message: string;
  status: number;
  requestId?: string;
  retryable: boolean;
}

export function normalizeError(e: unknown): NormalizedError {
  if (e instanceof ApiError) {
    return { code: e.code, message: e.message, status: e.status, requestId: e.requestId, retryable: e.retryable };
  }
  if (e instanceof Error) return { code: 'CLIENT_ERROR', message: e.message, status: 0, retryable: false };
  return { code: 'UNKNOWN', message: 'Something went wrong.', status: 0, retryable: false };
}

export function isSessionExpired(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 401 || e.code === 'SESSION_EXPIRED');
}
