export interface NotificationInput { title: string; body?: string; }
export interface SaveFileInput { name: string; contents: string; }
export interface SaveFileResult { saved: boolean; path?: string; }
export interface PlatformAdapter {
  kind: 'web' | 'desktop';
  notify(input: NotificationInput): Promise<void>;
  openExternal(url: string): Promise<void>;
  saveFile(input: SaveFileInput): Promise<SaveFileResult>;
  getSecureValue(key: string): Promise<string | null>;
  setBadgeCount(count: number): Promise<void>;
}
