import { execSync } from 'node:child_process';

const bad = [];
const run = (cmd) => {
  try { return execSync(cmd).toString(); } catch { return ''; }
};

// 1. Tauri isolation: no static or dynamic Tauri imports outside platform tauri adapter + desktop composition root
const tauriLeak = run(`grep -Rn "from ['\\"]@tauri\\|from ['\\"]tauri-plugin\\|import(['\\"]@tauri\\|import(['\\"]tauri-plugin\\|__TAURI__" apps/web packages/ui packages/app-shell packages/client packages/reference-items 2>/dev/null || true`);
if (tauriLeak.trim()) bad.push(`web/ui/app-shell/client/reference-items must not import Tauri directly (use @alta/platform adapter):\n${tauriLeak}`);

// 1b. Web must not select the desktop adapter; desktop must not select the web adapter
const webTauriAdapter = run(`grep -Rn "@alta/platform/tauri" apps/web/src 2>/dev/null || true`);
if (webTauriAdapter.trim()) bad.push(`apps/web must use @alta/platform/web only:\n${webTauriAdapter}`);
const deskWebAdapter = run(`grep -Rn "@alta/platform/web" apps/desktop/src 2>/dev/null || true`);
if (deskWebAdapter.trim()) bad.push(`apps/desktop must use @alta/platform/tauri only:\n${deskWebAdapter}`);

// 2. app-shell must not depend on client/tauri
const shellClient = run(`grep -Rn "@alta/client\\|@tauri\\|tauri-plugin" packages/app-shell/src 2>/dev/null || true`);
if (shellClient.trim()) bad.push(`app-shell must not depend on client/Tauri:\n${shellClient}`);

// 3. ui must not depend on client/app-shell/tauri/routing
const uiBad = run(`grep -Rn "@alta/client\\|@alta/app-shell\\|@tauri\\|tauri-plugin\\|sveltejs/kit.*navigation\\|\\$app/navigation" packages/ui/src 2>/dev/null || true`);
if (uiBad.trim()) bad.push(`ui must depend on tokens only:\n${uiBad}`);

// 4. client must not depend on visual packages
const clientVisual = run(`grep -Rn "@alta/ui\\|@alta/app-shell\\|\\.svelte" packages/client/src 2>/dev/null || true`);
if (clientVisual.trim()) bad.push(`client must not depend on visual packages:\n${clientVisual}`);

// 5. No `any` in source (excluding generated)
const anyLeak = run(`grep -Rn ": any\\|<any\\|as any" apps/web/src apps/desktop/src packages/client/src packages/platform/src packages/ui/src packages/app-shell/src packages/reference-items/src 2>/dev/null | grep -v "generated/" || true`);
if (anyLeak.trim()) bad.push(`no explicit any allowed:\n${anyLeak}`);

// 6. No direct fetch/EventSource outside client transport
const fetchOutside = run(`grep -Rn "fetch(\\|new EventSource" apps/web/src apps/desktop/src packages/ui/src packages/app-shell/src packages/platform/src packages/reference-items/src 2>/dev/null || true`);
if (fetchOutside.trim()) bad.push(`fetch/EventSource must live in @alta/client only:\n${fetchOutside}`);

// 6b. Idempotency keys must go through newIdempotencyKey (no raw crypto.randomUUID outside http.ts)
const uuidLeak = run(`grep -Rn "crypto.randomUUID" apps/web/src apps/desktop/src packages/client/src packages/platform/src packages/ui/src packages/app-shell/src packages/reference-items/src 2>/dev/null | grep -v "http.ts" || true`);
if (uuidLeak.trim()) bad.push(`use newIdempotencyKey() from @alta/client instead of crypto.randomUUID directly:\n${uuidLeak}`);

// 7. Generated marker present
import fs from 'node:fs';
const genFile = 'packages/client/src/generated/types.ts';
if (!fs.existsSync(genFile)) bad.push(`missing ${genFile} — run node scripts/generate-api.mjs`);
else {
  const g = fs.readFileSync(genFile, 'utf8');
  if (!g.includes('GENERATED') && !g.includes('auto-generated')) bad.push(`${genFile} missing generated marker`);
}

if (bad.length) { console.error(bad.join('\n---\n')); process.exit(1); }
console.log('frontend dependency rules ok');
