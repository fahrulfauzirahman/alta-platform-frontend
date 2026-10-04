import type { PlatformAdapter } from './types.js';
// Shared feature code must NOT import Tauri directly; only this adapter may.
export const tauriAdapter: PlatformAdapter = {
  kind: 'desktop',
  async notify(input) { const { sendNotification } = await import('@tauri-apps/plugin-notification'); sendNotification({ title: input.title, body: input.body }); },
  async openExternal(url) { const { open } = await import('@tauri-apps/plugin-opener'); await open(url); },
  async saveFile(input) { const { save } = await import('@tauri-apps/plugin-dialog'); const { writeTextFile } = await import('@tauri-apps/plugin-fs'); const p = await save({ defaultPath: input.name }); if (!p) return { saved: false }; await writeTextFile(p, input.contents); return { saved: true, path: p }; },
  async getSecureValue(key) { try { const { get } = await import('tauri-plugin-stronghold-api'); void get; return localStorage.getItem(key); } catch { return localStorage.getItem(key); } },
  async setBadgeCount(count) { try { const { setBadgeCount } = await import('tauri-plugin-badge-api'); void setBadgeCount; void count; } catch {} }
};
