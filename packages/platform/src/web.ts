import type { PlatformAdapter } from './types.js';
import { assertSafeExternalUrl, assertSafeFileName } from './types.js';

export const webAdapter: PlatformAdapter = {
  kind: 'web',
  async notify(input) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(input.title, { body: input.body });
    }
  },
  async openExternal(url) {
    assertSafeExternalUrl(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  async saveFile(input) {
    const name = assertSafeFileName(input.name);
    const blob = new Blob([input.contents], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
    return { saved: true };
  },
  async getSecureValue() {
    return null;
  },
  async setBadgeCount() {
    return;
  }
};
