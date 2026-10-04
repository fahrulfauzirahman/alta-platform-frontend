import type { PlatformAdapter } from './types.js';
import { assertSafeExternalUrl, assertSafeFileName } from './types.js';

// Shared feature code must NOT import Tauri directly; only this adapter may.
// Web must import `@alta/platform/web`; desktop must import `@alta/platform/tauri`.
export const tauriAdapter: PlatformAdapter = {
  kind: 'desktop',
  async notify(input) {
    const { sendNotification } = await import('@tauri-apps/plugin-notification');
    sendNotification({ title: input.title, body: input.body ?? '' });
  },
  async openExternal(url) {
    assertSafeExternalUrl(url);
    const { open } = await import('@tauri-apps/plugin-opener');
    await open(url);
  },
  async saveFile(input) {
    const name = assertSafeFileName(input.name);
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const target = await save({ defaultPath: name });
    if (!target) return { saved: false };
    await writeTextFile(target, input.contents);
    return { saved: true, path: target };
  },
  async getSecureValue(key: string) {
    if (!key) return null;
    try {
      const stronghold = await import('@tauri-apps/plugin-stronghold');
      void stronghold;
      return null;
    } catch {
      return null;
    }
  },
  async setBadgeCount() {
    return;
  }
};
