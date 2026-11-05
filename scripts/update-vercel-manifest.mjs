import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isPublicPath } from './vercel-public-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean).filter(isPublicPath).sort();
writeFileSync(new URL('./vercel-public-manifest.json', import.meta.url),
  JSON.stringify({ version: 1, files }, null, 2) + '\n');
console.log(`Public manifest: ${files.length} files`);
