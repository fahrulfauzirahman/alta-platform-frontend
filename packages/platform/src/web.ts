import type { PlatformAdapter } from './types.js';
export const webAdapter: PlatformAdapter = {
  kind: 'web',
  async notify(input) { if ('Notification' in window && Notification.permission === 'granted') { new Notification(input.title, { body: input.body }); } },
  async openExternal(url) { window.open(url, '_blank', 'noopener'); },
  async saveFile(input) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([input.contents])); a.download = input.name; a.click(); return { saved: true }; },
  async getSecureValue() { return null; },
  async setBadgeCount() {}
};
