import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const input = 'contracts/openapi/alta-platform-v1.yaml';
const outDir = 'packages/client/src/generated';
const outFile = path.join(outDir, 'types.ts');

fs.mkdirSync(outDir, { recursive: true });
execSync(`npx openapi-typescript "${input}" -o "${outFile}"`, { stdio: 'inherit' });

let text = fs.readFileSync(outFile, 'utf8');
const header = `/**\n * GENERATED — do not edit by hand.\n * Source: ${input}\n * Generator: openapi-typescript (see scripts/generate-api.mjs)\n * Verify: node scripts/verify-contracts.mjs\n */\n`;
if (!text.startsWith('/**')) text = header + text;
else if (!text.includes('GENERATED')) text = header + text;
fs.writeFileSync(outFile, text);
console.log(`generate-api: wrote ${outFile}`);
