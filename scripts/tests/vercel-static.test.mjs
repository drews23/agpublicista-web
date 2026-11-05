import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublicPath } from '../vercel-public-policy.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, '.vercel/output/static');
const { files } = JSON.parse(readFileSync(path.join(root, 'scripts/vercel-public-manifest.json')));
const { routes } = JSON.parse(readFileSync(path.join(root, '.vercel/output/config.json')));
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
for (const file of files) {
  check(isPublicPath(file) && existsSync(path.join(output, file)), `Missing or unsafe: ${file}`);
  if (file !== 'robots.txt') check(hash(path.join(root, file)) === hash(path.join(output, file)), `Changed content: ${file}`);
}
const publicFiles = new Set(files);
let existingReferences = 0;
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
    let url;
    try { url = new URL(match[1].replace(/&amp;/g, '&'), 'https://lienzo.tools/' + file); } catch { continue; }
    if (!['http:', 'https:'].includes(url.protocol) || url.host !== 'lienzo.tools') continue;
    let candidate;
    try { candidate = decodeURIComponent(url.pathname).slice(1); } catch { continue; }
    if (!candidate || candidate.endsWith('/')) candidate += 'index.html';
    if (existsSync(path.join(root, candidate)) && statSync(path.join(root, candidate)).isFile()) {
      check(publicFiles.has(candidate), `Linked public file omitted: ${file} -> ${candidate}`);
      existingReferences++;
    }
  }
}
for (const file of ['../index.html', 'assets/../server/key.json', '/index.html', 'assets/.env',
  'server/ads-review/Gemini.php', 'scripts/test.js', 'en/.htaccess', 'assets/package.json',
  'assets/og/og-plantilla.html', 'assets/test.spec.js', 'en/private/key.json']) {
  check(!isPublicPath(file), `Private path: ${file}`);
}
for (const route of routes.filter(route => route.src)) new RegExp('^' + route.src + '$');
function resolveRoute(url, host = 'preview.vercel.app') {
  let headers = {};
  for (const route of routes) {
    if (route.handle === 'filesystem') {
      if (existsSync(path.join(output, url)) && statSync(path.join(output, url)).isFile()) return { status: 200, file: url, headers };
      continue;
    }
    if (route.has?.some(condition => condition.type !== 'host' || !new RegExp('^(?:' + condition.value + ')$').test(host))) continue;
    const match = new RegExp('^' + route.src + '$').exec(url);
    if (!match) continue;
    const replace = value => value.replace(/\$(\d+)/g, (_, n) => match[Number(n)] || '');
    headers = { ...headers, ...Object.fromEntries(Object.entries(route.headers || {}).map(([key, value]) => [key, replace(value)])) };
    if (!route.continue) return { status: route.status || 200, file: route.dest && replace(route.dest), headers };
  }
  return { status: 404, headers };
}
const locations = [...readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
for (const url of locations) {
  const result = resolveRoute(url);
  check(result.status === 200 && existsSync(path.join(output, result.file)), `Sitemap URL failed: ${url}`);
  check(result.headers['X-Robots-Tag'] === 'noindex, nofollow', `Preview indexable: ${url}`);
}
for (const file of files.filter(file => file.endsWith('/index.html'))) {
  const directory = '/' + file.slice(0, -10);
  check(resolveRoute(directory).file === '/' + file, `Directory lookup: ${directory}`);
  check(resolveRoute(directory.slice(0, -1)).headers.Location === directory, `Slash redirect: ${directory}`);
}
for (const [url, destination] of [
  ['/herramientas/qr/hub/', 'https://lienzo.tools/herramientas/qr/'],
  ['/animacion-logo-after-effects/attachment/', '/blog/plantillas-after-effects-gratis/'],
  ['/category/diseno-grafico/recursos-visuales/', '/recursos/'],
  ['/services/demo/', '/sobre-mi/'],
]) check(resolveRoute(url).status === 301 && resolveRoute(url).headers.Location === destination, `Legacy redirect: ${url}`);
for (const host of ['agpublicista.com', 'www.agpublicista.com', 'www.lienzo.tools']) {
  check(resolveRoute('/blog/', host).headers.Location === 'https://lienzo.tools/blog/', `Domain redirect: ${host}`);
}
for (const url of ['/server/ads-review/Gemini.php', '/scripts/build-vercel.mjs', '/unknown-page/', '/.git/config', '/assets/og/og-plantilla.html']) {
  check(resolveRoute(url).status === 404, `Exposed internal URL: ${url}`);
}
check(resolveRoute('/contacto/').status === 200, 'Contact page must remain independent');
check(resolveRoute('/en/tools/qr/').status === 200, 'English QR');
check(resolveRoute('/assets/fonts/fraunces/fraunces-latin.woff2').headers['Access-Control-Allow-Origin'] === '*', 'Public font CORS');
check(readFileSync(path.join(output, 'robots.txt'), 'utf8') === 'User-agent: *\nDisallow: /\n', 'Preview robots');
const production = spawnSync(process.execPath, ['scripts/build-vercel.mjs'], { cwd: root,
  encoding: 'utf8', env: { ...process.env, VERCEL_ENV: 'production', LIENZO_ENABLE_VERCEL_PRODUCTION: '' } });
check(production.status !== 0 && production.stderr.includes('Production migration is not enabled'), 'Accidental production deployment must fail');
console.log(JSON.stringify({ checks, files: files.length, existingReferences, sitemapUrls: locations.length, routes: routes.length, previewOnly: true }));
