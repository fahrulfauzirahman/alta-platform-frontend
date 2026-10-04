import fs from 'node:fs';
import path from 'node:path';
function sizeKb(dir) {
  let total = 0;
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.js') || p.endsWith('.css')) total += fs.statSync(p).size;
    }
  };
  walk(dir);
  return total / 1024;
}
const rows = [
  ['web client bundle', 'apps/web/.svelte-kit/output/client', 400],
  ['desktop static bundle', 'apps/desktop/build', 400],
  ['storybook bundle', 'apps/storybook/dist', 200],
];
let failed = false;
for (const [name, dir, maxKb] of rows) {
  const kb = sizeKb(dir);
  const ok = kb <= maxKb;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + ': ' + kb.toFixed(1) + ' kB (budget ' + maxKb + ' kB)');
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
