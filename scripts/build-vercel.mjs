import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync,
  rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublicPath } from './vercel-public-policy.mjs';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(root, '.vercel', 'output');
const preview = process.env.VERCEL_ENV !== 'production';
if (!preview && process.env.LIENZO_ENABLE_VERCEL_PRODUCTION !== '1') {
  throw new Error('Production migration is not enabled. Verify preview and backend first.');
}
const manifest = JSON.parse(readFileSync(new URL('./vercel-public-manifest.json', import.meta.url), 'utf8'));
if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Invalid public manifest');
const files = manifest.files;
if (new Set(files).size !== files.length) throw new Error('Duplicate public paths');
for (const file of files) {
  if (!isPublicPath(file)) throw new Error(`Disallowed public path: ${file}`);
  const absolute = path.join(root, ...file.split('/'));
  const resolved = realpathSync(absolute);
  if (resolved !== absolute || lstatSync(absolute).isSymbolicLink() || !lstatSync(absolute).isFile()) {
    throw new Error(`Public path must be a regular file within checkout: ${file}`);
  }
}
// A fixed, checked output target prevents deletion or copying outside this checkout.
if (output !== path.join(root, '.vercel', 'output')) throw new Error('Invalid build target');
if (existsSync(path.join(root, '.vercel')) && lstatSync(path.join(root, '.vercel')).isSymbolicLink()) throw new Error('Symlinked output parent');
if (existsSync(output) && lstatSync(output).isSymbolicLink()) throw new Error('Symlinked output');
rmSync(output, { recursive: true, force: true });
mkdirSync(path.join(output, 'static'), { recursive: true });
let bytes = 0;
for (const file of files) {
  const destination = path.join(output, 'static', ...file.split('/'));
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(root, file), destination);
  bytes += lstatSync(destination).size;
}
// Preview pages keep production canonicals, but cannot become competing indexable URLs.
if (preview) writeFileSync(path.join(output, 'static', 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const routes = [{ src: '/(.*)', headers: {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...(preview ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
}, continue: true }];
routes.push({ src: '/(.*)', has: [{ type: 'host', value: '(?:www\\.)?agpublicista\\.com|www\\.lienzo\\.tools' }],
  status: 301, headers: { Location: 'https://lienzo.tools/$1' } });
routes.push({ src: '/(?:svg|server|scripts|_facebook|_historial_chat|escenas(?:%20| )3d)(?:/.*)?', status: 404, dest: '/404.html' });
routes.push({ src: '/assets/og/og-plantilla\\.html', status: 404, dest: '/404.html' });

// Keep the exact legacy redirects maintained for Apache, rather than a second
// hand-maintained list that could drift and break old search results.
const apache = readFileSync(path.join(root, '.htaccess'), 'utf8');
for (const line of apache.split(/\r?\n/)) {
  const rule = /^RewriteRule \^(\S+)\$ (\S+) \[R=301,L\]$/.exec(line.trim());
  if (rule) routes.push({ src: '/' + rule[1], status: 301, headers: { Location: rule[2] } });
}
routes.push({ src: '/(.*)\\.(?:woff2?|ttf|otf)', headers: { 'Access-Control-Allow-Origin': '*' }, continue: true });
routes.push({ src: '/(.*)\\.(?:css|js|mjs|json)', headers: { 'Cache-Control': 'public, max-age=2592000' }, continue: true });
routes.push({ src: '/(.*)\\.(?:svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf)', headers: { 'Cache-Control': 'public, max-age=15552000' }, continue: true });
const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const directories = files.filter(file => file.endsWith('/index.html')).map(file => file.slice(0, -10));
for (const directory of directories) {
  routes.push({ src: escaped('/' + directory.slice(0, -1)), status: 308, headers: { Location: '/' + directory } });
  routes.push({ src: escaped('/' + directory), dest: '/' + directory + 'index.html' });
}
routes.push({ src: '/', dest: '/index.html' }, { handle: 'filesystem' }, { src: '/.*', status: 404, dest: '/404.html' });
writeFileSync(path.join(output, 'config.json'), JSON.stringify({ version: 3, routes }, null, 2) + '\n');
writeFileSync(path.join(output, 'build-report.json'), JSON.stringify({ preview, files: files.length,
  bytes, directories: directories.length, routes: routes.length,
  gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || null }, null, 2) + '\n');
console.log(`Built ${files.length} public files (${bytes} bytes), ${directories.length} directories. ${preview ? 'Preview: noindex.' : 'Production.'}`);
