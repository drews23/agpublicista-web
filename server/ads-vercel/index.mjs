import { AccessController, setCookie } from './controller.mjs';
import { AdsStore } from './store.mjs';
import { connectDatabase, databaseURL } from './database.mjs';
import { AccessError, requireThat } from './security.mjs';
import { makeBrevoSender, runWorker } from './mail-worker.mjs';

async function readBody(request) {
  requireThat(!request.headers['content-length'] || /^\d+$/.test(request.headers['content-length']) &&
    Number(request.headers['content-length']) <= 65536, 'REQUEST_TOO_LARGE', 413);
  let bytes = 0; const chunks = [];
  for await (const chunk of request) {
    const value = Buffer.from(chunk); bytes += value.length;
    requireThat(bytes <= 65536, 'REQUEST_TOO_LARGE', 413); chunks.push(value);
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)); }
  catch { throw new AccessError('INVALID_JSON', 400); }
}
// This server-owned seam supports real local HTTP regression tests. Browser
// requests cannot choose a connector or override the production environment.
export const createHandler = ({ openDatabase = connectDatabase } = {}) => async function handler(request, response) {
  for (const [key, value] of Object.entries({ 'Cache-Control': 'no-store, private',
    'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie' })) response.setHeader(key, value);
  let pool;
  try {
    requireThat(process.env.VERCEL === '1' && process.env.LIENZO_ADS_ACCESS_ENABLED === '1', 'ACCESS_NOT_CONFIGURED', 503);
    const scope = process.env.VERCEL_ENV;
    requireThat(['preview', 'production'].includes(scope), 'INVALID_STORAGE_SCOPE', 503);
    const allowedHosts = scope === 'production' ? ['lienzo.tools'] :
      [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(host => /^[a-z0-9-]+\.vercel\.app$/.test(host || ''));
    requireThat(allowedHosts.includes(request.headers.host), 'INVALID_ORIGIN_CONFIGURATION', 503);
    const origin = `https://${request.headers.host}`;
    pool = openDatabase(databaseURL());
    const store = new AdsStore({ pool, pepper: process.env.LIENZO_ADS_IDENTITY_PEPPER, scope });
    if (new URL(request.url, origin).pathname === '/api/ads/internal/mail') {
      const sender = makeBrevoSender({ enabled: process.env.LIENZO_ADS_MAIL_ENABLED === '1', apiKey: process.env.LIENZO_ADS_BREVO_API_KEY });
      const result = await runWorker({ store, sender, method: request.method,
        authorization: request.headers.authorization, secret: process.env.CRON_SECRET });
      response.statusCode = 200; response.end(JSON.stringify(result)); return;
    }
    const controller = new AccessController({ store, origin, enabled: true });
    // Vercel supplies this deployment's proxy address; raw client-provided address
    // fields/body never choose the rate bucket. Global/mailbox caps remain primary.
    const peer = (request.headers['x-vercel-forwarded-for'] || request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const result = await controller.handle({ method: request.method, path: request.url,
      headers: request.headers, body: request.method === 'POST' ? await readBody(request) : '', peer });
    if (result.cookie) response.setHeader('Set-Cookie', setCookie(result.cookie));
    response.statusCode = result.status; response.end(JSON.stringify(result.body));
  } catch (error) {
    response.statusCode = error instanceof AccessError ? error.status : 503;
    response.end(JSON.stringify({ error: error instanceof AccessError ? error.code : 'SERVICE_UNAVAILABLE' }));
    if (!(error instanceof AccessError)) console.error('Lienzo access: unexpected backend failure');
  } finally { if (pool) try { await pool.end(); } catch {} }
};
export default createHandler();
