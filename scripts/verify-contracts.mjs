import fs from 'node:fs';
const openapi = fs.readFileSync('contracts/openapi/alta-platform-v1.yaml', 'utf8');
for (const p of ['/healthz', '/v1/session', '/v1/reference-items', '/v1/events']) {
  if (!openapi.includes(p)) { console.error('missing ' + p); process.exit(1); }
}
console.log('contracts ok');
