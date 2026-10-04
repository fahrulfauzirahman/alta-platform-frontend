import { execSync } from 'node:child_process';
import fs from 'node:fs';
const bad = [];
const src = execSync('grep -R "from .@tauri" apps/web packages/ui packages/app-shell packages/client 2>/dev/null || true').toString();
if (src.trim()) bad.push('web/ui must not import Tauri:\n' + src);
const gen = 'packages/client/src/generated';
if (fs.existsSync(gen)) {
  // generated files must not be hand-edited: placeholder check
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('frontend dependency rules ok');
