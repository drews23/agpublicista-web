import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { PGlite } from '@electric-sql/pglite';
import { AdsStore } from '../../server/ads-vercel/store.mjs';
import { createHandler } from '../../server/ads-vercel/index.mjs';
import { COOKIE } from '../../server/ads-vercel/controller.mjs';

// Actual Node IncomingMessage/ServerResponse over loopback. PostgreSQL is PGlite,
// the mail callback is fictional, and the Neon/Gemini/Brevo networks are not used.
// Secure cookies are inspected and sent explicitly; this is not a browser TLS test.
const host = 'http-check-lienzo.vercel.app', origin = `https://${host}`;
const pepper = 'e'.repeat(64), mailbox = 'http-owner@example.test';

function localPool(db) {
  let tail = Promise.resolve();
  return { async connect() {
    const previous = tail; let release;
    tail = new Promise(resolve => { release = resolve; }); await previous;
    return { async query(sql, params = []) {
      return !params.length && sql.includes(';') ? (await db.exec(sql)).at(-1) : db.query(sql, params);
    }, release };
  }, async end() {} };
}

async function setup(t) {
  const names = ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'VERCEL_BRANCH_URL',
    'LIENZO_ADS_ACCESS_ENABLED', 'LIENZO_ADS_IDENTITY_PEPPER',
    'LIENZO_ADS_DATABASE_URL', 'LIENZO_ADS_DATABASE_DATABASE_URL',
    'LIENZO_ADS_MAIL_ENABLED', 'LIENZO_ADS_BREVO_API_KEY', 'CRON_SECRET'];
  const original = new Map(names.map(name => [name, process.env[name]]));
  t.after(() => { for (const [name, value] of original) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  } });
  for (const name of names) delete process.env[name];
  Object.assign(process.env, { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_URL: host,
    LIENZO_ADS_ACCESS_ENABLED: '1', LIENZO_ADS_IDENTITY_PEPPER: pepper });
  const db = new PGlite(); await db.waitReady;
  const pool = localPool(db), store = new AdsStore({ pool, pepper, scope: 'preview' });
  await store.migrate();
  let connections = 0;
  const server = createServer(createHandler({ openDatabase() { connections++; return pool; } }));
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await db.close(); });
  const port = server.address().port;
  const call = (path, { method = 'GET', headers = {}, body, chunks } = {}) => new Promise((resolve, reject) => {
    const outgoing = request({ hostname: '127.0.0.1', port, path, method, agent: false,
      headers: { Host: host, 'Sec-Fetch-Site': 'same-origin', 'X-Vercel-Forwarded-For': '192.0.2.1', ...headers } }, response => {
      const values = []; response.on('data', chunk => values.push(chunk)); response.once('error', reject);
      response.once('end', () => {
        const text = Buffer.concat(values).toString('utf8');
        try { resolve({ status: response.statusCode, headers: response.headers, text, body: JSON.parse(text) }); }
        catch (error) { reject(error); }
      });
    });
    outgoing.setTimeout(5000, () => outgoing.destroy(new Error('Local HTTP test timed out')));
    outgoing.once('error', reject);
    if (chunks) { for (const chunk of chunks) outgoing.write(chunk); outgoing.end(); }
    else outgoing.end(body);
  });
  const client = () => {
    let cookie = '', csrf = '';
    return { get cookie() { return cookie; }, get csrf() { return csrf; },
      async call(path, data, extra = {}) {
        const result = await call(path, {
          method: data === undefined ? 'GET' : 'POST',
          headers: { ...(cookie ? { Cookie: cookie } : {}),
            ...(data === undefined ? {} : { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }), ...extra },
          body: data === undefined ? undefined : JSON.stringify(data),
        });
        const set = result.headers['set-cookie']; if (set?.length) cookie = set[0].split(';')[0];
        if (result.body.csrfToken) csrf = result.body.csrfToken;
        return result;
      },
    };
  };
  return { db, store, call, client, connections: () => connections };
}

test('native HTTP access rotates cookies, shares ES/EN state and leaves paid review disabled', async t => {
  const { store, client, call } = await setup(t); await store.invite(mailbox, 'en');
  const unknown = client(), invited = client();
  const first = await unknown.call('/api/ads/session?lang=es');
  assert.equal(first.status, 200); assert.equal(first.body.authenticated, false);
  assert.equal(first.body.mode, 'gemini-pilot'); assert.equal(first.body.reviewAvailable, false);
  assert.equal(first.headers['cache-control'], 'no-store, private');
  assert.equal(first.headers['x-robots-tag'], 'noindex, nofollow');
  assert.equal(first.headers['content-type'], 'application/json; charset=utf-8');
  assert.match(first.headers['set-cookie'][0], new RegExp(`^${COOKIE}=[a-f0-9]{64};`));
  for (const flag of ['Secure', 'HttpOnly', 'SameSite=Strict', 'Path=/']) assert.ok(first.headers['set-cookie'][0].includes(flag));
  assert.doesNotMatch(first.headers['set-cookie'][0], /Domain=|Max-Age=|Expires=/i);
  const unknownRequest = await unknown.call('/api/ads/access/start', { email: 'unknown@example.test' });
  assert.equal(unknownRequest.status, 202);
  await invited.call('/api/ads/session?lang=en');
  const codeRequest = await invited.call('/api/ads/access/start?lang=en', { email: mailbox });
  const generic = await unknown.call('/api/ads/session?lang=es');
  assert.equal(generic.body.challengePending, true);
  assert.deepEqual(codeRequest.body, { accepted: true, expiresIn: 600, resendAfter: 60 });
  assert.deepEqual(codeRequest.body, unknownRequest.body);
  assert.equal((await invited.call('/api/ads/access/start', { email: mailbox })).status, 429);
  const messages = [];
  const sender = async message => { messages.push(message); return { state: 'accepted', messageId: '<http-fictional@example.test>' }; };
  await store.runMail(sender); await store.runMail(sender);
  assert.equal(messages.length, 1); assert.equal(messages[0].to, mailbox); assert.equal(messages[0].locale, 'en');
  const code = messages[0].code, oldCookie = invited.cookie, oldCsrf = invited.csrf;
  assert.match(code, /^\d{8}$/); assert.ok(!codeRequest.text.includes(code)); assert.ok(!codeRequest.text.includes(mailbox));
  const wrong = code === '00000000' ? '00000001' : '00000000';
  assert.equal((await invited.call('/api/ads/access/verify', { code: wrong })).status, 403);
  const [attempt] = await store.transaction(q => q('SELECT attempts FROM @.challenges WHERE allowed=true'));
  assert.equal(attempt.attempts, 1);
  assert.equal((await unknown.call('/api/ads/access/verify', { code })).status, 403);
  const verified = await invited.call('/api/ads/access/verify?lang=en', { code });
  assert.equal(verified.status, 200); assert.equal(verified.body.authenticated, true);
  assert.equal(verified.body.pilot, null); assert.equal(verified.body.reviewAvailable, false);
  assert.notEqual(invited.cookie, oldCookie); assert.notEqual(invited.csrf, oldCsrf);
  assert.ok(!verified.text.includes(code)); assert.ok(!verified.text.includes(mailbox));
  const english = await invited.call('/api/ads/session?lang=en'), spanish = await invited.call('/api/ads/session?lang=es');
  assert.match(english.body.consent.text, /^When you confirm/); assert.match(spanish.body.consent.text, /^Al confirmar/);
  assert.equal(english.body.csrfToken, spanish.body.csrfToken); assert.equal(spanish.headers['set-cookie'], undefined);
  assert.equal((await call('/api/ads/session', { headers: { Cookie: oldCookie } })).body.authenticated, false);
  assert.equal((await invited.call('/api/ads/access/logout', {}, { 'X-CSRF-Token': oldCsrf })).status, 403);
  assert.equal((await invited.call('/api/ads/session')).body.authenticated, true);
  const review = { schemaVersion: 1, requestId: '12345678-1234-4234-8234-123456789012',
    draftRevision: 'a'.repeat(64), locale: 'es-CO', goal: 'Fictional local HTTP check',
    draft: {}, evidence: [], constraints: [], consent: { version: 'gemini-review-v1', confirmed: false } };
  assert.equal((await invited.call('/api/ads/review', review)).status, 403);
  review.consent.confirmed = true;
  const unavailable = await invited.call('/api/ads/review', review);
  assert.equal(unavailable.status, 503); assert.equal(unavailable.body.error, 'GEMINI_PILOT_DISABLED');
  const [counts] = await store.transaction(q => q('SELECT (SELECT count(*)::integer FROM @.budget) AS budgets,(SELECT count(*)::integer FROM @.usage) AS reviews'));
  assert.deepEqual(counts, { budgets: 0, reviews: 0 });
  const signedCookie = invited.cookie, signedCsrf = invited.csrf;
  const logout = await invited.call('/api/ads/access/logout?lang=es', {});
  assert.equal(logout.status, 200); assert.equal(logout.body.authenticated, false);
  assert.notEqual(invited.cookie, signedCookie); assert.notEqual(invited.csrf, signedCsrf);
  assert.equal((await call('/api/ads/session', { headers: { Cookie: signedCookie } })).body.authenticated, false);
  assert.equal((await invited.call('/api/ads/review', review)).status, 403);
});

test('native HTTP rejects closed access, untrusted hosts, origin, methods and oversized or malformed raw JSON', async t => {
  const { call, client, connections, store } = await setup(t);
  delete process.env.LIENZO_ADS_ACCESS_ENABLED;
  const closed = await call('/api/ads/session');
  assert.equal(closed.status, 503); assert.equal(closed.body.error, 'ACCESS_NOT_CONFIGURED');
  assert.equal(closed.headers['set-cookie'], undefined); assert.equal(connections(), 0);
  process.env.LIENZO_ADS_ACCESS_ENABLED = '1';
  assert.equal((await call('/api/ads/session', { headers: { Host: 'evil.example.test' } })).status, 503);
  assert.equal(connections(), 0);
  const browser = client(); await browser.call('/api/ads/session');
  assert.equal((await call('/api/ads/session?lang=es&lang=en')).status, 400);
  assert.equal((await call('/api/ads/session?code=12345678')).status, 400);
  assert.equal((await call('/api/ads/unknown')).status, 404);
  assert.equal((await call('/api/ads/access/start')).status, 405);
  assert.equal((await browser.call('/api/ads/access/start', { email: mailbox }, { Origin: 'https://evil.example.test' })).status, 403);
  assert.equal((await browser.call('/api/ads/access/start', { email: mailbox }, { 'Sec-Fetch-Site': 'same-site' })).status, 403);
  assert.equal((await browser.call('/api/ads/access/start', { email: mailbox }, { 'Content-Type': 'text/plain' })).status, 403);
  assert.equal((await browser.call('/api/ads/access/start', { email: mailbox }, { 'X-CSRF-Token': 'wrong' })).status, 403);
  const headers = { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': browser.csrf, Cookie: browser.cookie };
  assert.equal((await call('/api/ads/access/start', { method: 'POST', headers, body: '{' })).status, 400);
  const invalidUtf8 = await call('/api/ads/access/start', { method: 'POST', headers, body: Buffer.from([0xc3, 0x28]) });
  assert.equal(invalidUtf8.status, 400); assert.equal(invalidUtf8.body.error, 'INVALID_JSON');
  const tooLarge = Buffer.alloc(65537, 0x61);
  assert.equal((await call('/api/ads/access/start', { method: 'POST', headers: { ...headers, 'Content-Length': String(tooLarge.length) }, body: tooLarge })).status, 413);
  const chunked = await call('/api/ads/access/start', { method: 'POST', headers, chunks: [Buffer.alloc(40000, 0x61), Buffer.alloc(30000, 0x61)] });
  assert.equal(chunked.status, 413); assert.equal(chunked.body.error, 'REQUEST_TOO_LARGE');
  const [count] = await store.transaction(q => q('SELECT count(*)::integer AS n FROM @.mail'));
  assert.equal(count.n, 0);
});
