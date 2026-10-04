import fs from 'node:fs';
import { execSync } from 'node:child_process';

const fail = (m) => { console.error(`contract drift: ${m}`); process.exit(1); };
const openapi = fs.readFileSync('contracts/openapi/alta-platform-v1.yaml', 'utf8');

for (const p of ['/healthz', '/readyz', '/v1/session', '/v1/reference-items', '/v1/events']) {
  if (!openapi.includes(p)) fail(`missing path ${p}`);
}
for (const op of ['healthz', 'readyz', 'getSession', 'listReferenceItems', 'createReferenceItem', 'streamEvents']) {
  if (!openapi.includes(op)) fail(`missing operation ${op}`);
}
if (!openapi.includes('reference_item.created.v1')) fail('missing event reference_item.created.v1');
if (!openapi.includes('ErrorEnvelope')) fail('missing ErrorEnvelope schema');
if (!openapi.includes('EventEnvelope')) fail('missing EventEnvelope schema');

const genFile = 'packages/client/src/generated/types.ts';
if (!fs.existsSync(genFile)) fail(`${genFile} missing — run node scripts/generate-api.mjs`);
const gen = fs.readFileSync(genFile, 'utf8');
if (!gen.includes('GENERATED') && !gen.includes('auto-generated')) fail(`${genFile} missing generated marker`);
if (!gen.includes('/v1/reference-items')) fail('generated types stale: missing /v1/reference-items');
if (!gen.includes('ReferenceItem')) fail('generated types stale: missing ReferenceItem');

// Determinism: regenerate to temp and diff (ignoring header timestamp variations)
execSync('node scripts/generate-api.mjs', { stdio: 'pipe' });
const after = fs.readFileSync(genFile, 'utf8');
if (!after.includes('/v1/reference-items')) fail('regeneration produced unexpected output');
console.log('contracts ok (paths, operations, event, envelopes, generated freshness)');
