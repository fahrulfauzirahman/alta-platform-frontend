export interface NotificationInput {
  title: string;
  body?: string;
}
export interface SaveFileInput {
  name: string;
  contents: string;
}
export interface SaveFileResult {
  saved: boolean;
  path?: string;
}
export interface PlatformAdapter {
  kind: 'web' | 'desktop';
  notify(input: NotificationInput): Promise<void>;
  openExternal(url: string): Promise<void>;
  saveFile(input: SaveFileInput): Promise<SaveFileResult>;
  getSecureValue(key: string): Promise<string | null>;
  setBadgeCount(count: number): Promise<void>;
}

export function assertSafeExternalUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Refusing to open an invalid URL.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Refusing to open a non-http(s) URL.');
  }
  return parsed;
}

export function assertSafeFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('File name is required.');
  if (trimmed.length > 120) throw new Error('File name is too long.');
  let hasControl = false;
  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      hasControl = true;
      break;
    }
  }
  if (
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.includes('\0') ||
    trimmed.startsWith('.') ||
    trimmed === '..' ||
    trimmed.includes('..') ||
    hasControl
  ) {
    throw new Error('File name contains an unsafe path.');
  }
  return trimmed;
}
