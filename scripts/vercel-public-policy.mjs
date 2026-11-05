import path from 'node:path';

// Only public site roots can enter the deployment. Source, tests and credentials
// remain outside the output even when they are present in a Git checkout.
const roots = new Set(['assets', 'aviso-legal', 'blog', 'boletin', 'codigo-web',
  'contacto', 'cookies', 'css', 'datos', 'en', 'herramientas', 'js', 'licencia',
  'licencias-de-terceros', 'mi-lienzo', 'privacidad', 'recursos', 'sobre-mi']);
const rootFiles = new Set(['404.html', 'ads.txt', 'favicon.svg',
  'googleb7bf25195d1606c4.html', 'index.html', 'robots.txt', 'sitemap.xml']);
const extensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.png',
  '.webp', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf',
  '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.zip', '.wasm', '.txt', '.xml', '.spline']);

export function isPublicPath(file) {
  if (typeof file !== 'string' || !file || file.includes('\\') || file.includes('\0') ||
      path.posix.isAbsolute(file) || file.split('/').some(p => !p || p === '..' || p.startsWith('.'))) return false;
  if (rootFiles.has(file)) return true;
  // These documents are linked from the public catalog as template instructions.
  if (/^(?:codigo-web\/plantillas|en\/templates)\/demos\/[a-z0-9-]+\/(?:LEEME|README)\.md$/.test(file)) return true;
  if (!roots.has(file.split('/')[0]) || !extensions.has(path.posix.extname(file).toLowerCase())) return false;
  return !/(?:^|\/)(?:node_modules|server|scripts|tests|fixtures|private|credentials)(?:\/|$)/i.test(file) &&
    !/(?:^|\/)(?:package(?:-lock)?\.json|[^/]+\.(?:test|spec)\.[^/]+)$/i.test(file) &&
    file !== 'assets/og/og-plantilla.html';
}
