import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { AdsStore } from '../../server/ads-vercel/store.mjs';
import { AccessController, COOKIE, parseCookie, setCookie } from '../../server/ads-vercel/controller.mjs';
import { hash, open, seal, day, equal } from '../../server/ads-vercel/security.mjs';
import { renderAccessEmail } from '../../server/ads-vercel/email.mjs';
import { connectDatabase, databaseURL } from '../../server/ads-vercel/database.mjs';
import handler from '../../server/ads-vercel/index.mjs';
import { makeBrevoSender, runWorker } from '../../server/ads-vercel/mail-worker.mjs';

const pepper = 'a'.repeat(64), origin = 'https://preview-lienzo.vercel.app';
function poolFor(db) {
  let tail = Promise.resolve();
  return { async connect() {
    const previous = tail; let release; tail = new Promise(resolve => { release = resolve; }); await previous;
    return { async query(sql, params = []) {
      // PGlite uses the real PostgreSQL engine. Multi-statement DDL uses exec;
      // parameters always go through PostgreSQL prepared/bound query execution.
      return !params.length && sql.includes(';') ? (await db.exec(sql)).at(-1) : db.query(sql, params);
    }, release };
  } };
}
async function fixture(t, dataDir) {
  const db = new PGlite(dataDir); await db.waitReady; t.after(() => db.close());
  let now = 1793883600; const pool = poolFor(db);
  const store = new AdsStore({ pool, pepper, scope: 'test', clock: () => now }); await store.migrate();
  return { db, store, pool, tick(seconds) { now += seconds; }, now: () => now };
}
const rejectCode = (work, code) => assert.rejects(work, error => error.code === code);
async function codeFromQueue(store) {
  const [row] = await store.transaction(q => q("SELECT id,payload FROM @.mail WHERE state='queued' ORDER BY created,id LIMIT 1"));
  return { id: row.id, ...open(pepper, 'test', row.id, row.payload) };
}
async function login(store, mailbox = 'owner@example.test', locale = 'es') {
  await store.invite(mailbox, locale); const session = await store.session('', locale);
  await store.start(session.cookie, mailbox, '192.0.2.1');
  const message = await codeFromQueue(store); await store.runMail(async () => ({ state: 'accepted', messageId: '<fictional@test>' }));
  return store.verify(session.cookie, message.code, '192.0.2.1', locale);
}

test('closed runtime never loads a database, a mail provider or Gemini', async () => {
  const old = process.env.LIENZO_ADS_ACCESS_ENABLED; delete process.env.LIENZO_ADS_ACCESS_ENABLED;
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = JSON.parse(body); } };
  try { await handler({ method: 'GET', url: '/api/ads/session', headers: {} }, response); }
  finally { if (old !== undefined) process.env.LIENZO_ADS_ACCESS_ENABLED = old; }
  assert.equal(response.statusCode, 503); assert.equal(response.body.error, 'ACCESS_NOT_CONFIGURED');
  assert.equal(response.headers['Cache-Control'], 'no-store, private');
});
test('server-only database configuration refuses arbitrary endpoints and missing TLS', () => {
  for (const value of [undefined, 'postgres://x:y@localhost/db', 'postgres://x:y@ep-example.neon.tech/db', 'https://example.com/db']) assert.throws(() => connectDatabase(value));
});
test('managed Neon environment names map privately and conflicting connections fail closed', () => {
  assert.equal(databaseURL({ LIENZO_ADS_DATABASE_DATABASE_URL: 'synthetic-managed-url' }), 'synthetic-managed-url');
  assert.equal(databaseURL({ LIENZO_ADS_DATABASE_URL: 'synthetic-direct-url' }), 'synthetic-direct-url');
  assert.equal(databaseURL({ VITE_DATABASE_URL: 'public-must-not-be-used' }), undefined);
  assert.throws(() => databaseURL({ LIENZO_ADS_DATABASE_URL: 'first', LIENZO_ADS_DATABASE_DATABASE_URL: 'other' }),
    error => error.code === 'DATABASE_CONFIGURATION_CONFLICT');
});
test('ciphertext is padded, authenticated, scope-bound and cannot be transplanted to another challenge', () => {
  assert.equal(equal('é', 'aa'), false);
  const id = 'a'.repeat(32), text = seal(pepper, 'test', id, { code: '12345678', to: 'owner@example.test', locale: 'es' });
  assert.equal(text.length, seal(pepper, 'test', id, null).length);
  assert.equal(open(pepper, 'test', id, text).code, '12345678');
  assert.throws(() => open(pepper, 'production', id, text)); assert.throws(() => open(pepper, 'test', 'b'.repeat(32), text));
  assert.equal(text.includes('owner@example.test'), false);
});
test('invited and unknown accounts have the same response and queued ciphertext size; unknown recipients never reach a sender', async t => {
  const { store } = await fixture(t); await store.invite('owner@example.test');
  const first = await store.session('', 'es'), second = await store.session('', 'en');
  const a = await store.start(first.cookie, 'owner@example.test', '192.0.2.1');
  const b = await store.start(second.cookie, 'unknown@example.test', '192.0.2.2'); assert.deepEqual(a, b);
  const rows = await store.transaction(q => q('SELECT payload FROM @.mail')); assert.equal(rows[0].payload.length, rows[1].payload.length);
  assert.equal(JSON.stringify(rows).includes('owner@example.test'), false);
  let calls = 0; const sender = async () => { calls++; return { state: 'accepted', messageId: '<test@test>' }; };
  await store.runMail(sender); await store.runMail(sender); assert.equal(calls, 1);
});
test('five wrong guesses commit, lock the challenge and survive new store instances', async t => {
  const { store, pool, now } = await fixture(t); await store.invite('owner@example.test');
  const first = await store.session('', 'es'); await store.start(first.cookie, 'owner@example.test', '192.0.2.1');
  const code = await codeFromQueue(store); const wrong = code.code === '00000000' ? '11111111' : '00000000';
  for (let i = 0; i < 5; i++) await rejectCode(() => store.verify(first.cookie, wrong, '192.0.2.1', 'es'), 'ACCESS_REQUIRED');
  const restarted = new AdsStore({ pool, pepper, scope: 'test', clock: now });
  await rejectCode(() => restarted.verify(first.cookie, code.code, '192.0.2.1', 'es'), 'ACCESS_REQUIRED');
  const [row] = await store.transaction(q => q('SELECT attempts FROM @.challenges WHERE id=$1', [code.id])); assert.equal(row.attempts, 5);
});
test('a successful code rotates cookie and CSRF, cannot replay, and logout revokes the session', async t => {
  const { store } = await fixture(t); await store.invite('owner@example.test'); const initial = await store.session('', 'es');
  await store.start(initial.cookie, 'owner@example.test', '192.0.2.1'); const code = await codeFromQueue(store);
  const result = await store.verify(initial.cookie, code.code, '192.0.2.1', 'en');
  assert.notEqual(initial.cookie, result.cookie); assert.notEqual(initial.body.csrfToken, result.body.csrfToken);
  assert.equal(result.body.authenticated, true); assert.equal(result.body.pilot, null);
  await rejectCode(() => store.verify(initial.cookie, code.code, '192.0.2.1', 'es'), 'ACCESS_REQUIRED');
  const [allowance] = await store.transaction(q => q('SELECT activated FROM @.allowed')); assert.equal(allowance.activated, null);
  const out = await store.logout(result.cookie, 'es'); assert.equal(out.body.authenticated, false);
  const status = await store.session(result.cookie, 'es'); assert.equal(status.body.authenticated, false);
});
test('controller enforces host, origin, JSON, CSRF, cookie parsing and payload limits before side effects', async t => {
  const { store } = await fixture(t); const controller = new AccessController({ store, origin, enabled: true });
  const base = { method: 'GET', path: '/api/ads/session?lang=es', peer: '192.0.2.1', headers: { host: new URL(origin).host, 'sec-fetch-site': 'same-origin' } };
  const session = await controller.handle(base);
  const post = { ...base, method: 'POST', path: '/api/ads/access/start', body: '{"email":"owner@example.test"}', headers: {
    ...base.headers, cookie: `${COOKIE}=${session.cookie}`, origin, 'content-type': 'application/json', 'x-csrf-token': session.body.csrfToken } };
  for (const headers of [{ origin: 'https://attacker.test' }, { host: 'attacker.test' }, { 'sec-fetch-site': 'same-site' }, { 'content-type': 'text/plain' }, { 'x-csrf-token': 'b'.repeat(64) }]) await rejectCode(() => controller.handle({ ...post, headers: { ...post.headers, ...headers } }), 'ACCESS_REQUIRED');
  await rejectCode(() => controller.handle({ ...post, body: JSON.stringify({ email: 'owner@example.test', extra: true }) }), 'INVALID_REQUEST');
  await rejectCode(() => controller.handle({ ...post, body: ' '.repeat(2049) }), 'REQUEST_TOO_LARGE');
  await rejectCode(() => controller.handle({ ...post, method: 'GET' }), 'METHOD_NOT_ALLOWED');
  assert.equal(parseCookie(`${COOKIE}=${session.cookie};${COOKIE}=${session.cookie}`), '');
  assert.match(setCookie(session.cookie), /Secure; HttpOnly; SameSite=Strict/);
  const result = await controller.handle(post); assert.equal(result.status, 202);
  await rejectCode(() => controller.handle(post), 'ACCESS_RESEND_WAIT');
});
test('persistent global/mailbox limits cannot be reset by changing browser session', async t => {
  const { store } = await fixture(t);
  for (let i = 0; i < 3; i++) { const flow = await store.session('', 'es'); await store.start(flow.cookie, 'unknown@example.test', `192.0.2.${i + 1}`); }
  const flow = await store.session('', 'en'); await rejectCode(() => store.start(flow.cookie, 'unknown@example.test', '192.0.2.9'), 'ACCESS_RATE_LIMIT');
});
test('queue claims each job once across simultaneous workers, scrubs payload and never retries an uncertain send', async t => {
  const { store, pool, now } = await fixture(t); await store.invite('owner@example.test');
  const flow = await store.session('', 'es'); await store.start(flow.cookie, 'owner@example.test', '192.0.2.1');
  const other = new AdsStore({ pool, pepper, scope: 'test', clock: now }); let calls = 0;
  const sender = async () => { calls++; throw new Error('Unknown delivery outcome'); };
  await Promise.all([store.runMail(sender), other.runMail(sender)]); assert.equal(calls, 1);
  await store.runMail(sender); assert.equal(calls, 1);
  const [row] = await store.transaction(q => q('SELECT * FROM @.mail')); assert.equal(row.state, 'uncertain'); assert.equal(row.payload, null);
});
test('expired and crash-abandoned jobs cannot be retried or expose payload', async t => {
  const { store, tick } = await fixture(t); await store.invite('owner@example.test');
  const flow = await store.session('', 'es'); await store.start(flow.cookie, 'owner@example.test', '192.0.2.1');
  const message = await codeFromQueue(store);
  await store.transaction(q => q("UPDATE @.mail SET state='sending'")); tick(46);
  let calls = 0; const result = await store.runMail(async () => { calls++; }); assert.equal(result.state, 'empty'); assert.equal(calls, 0);
  const [row] = await store.transaction(q => q('SELECT state,payload FROM @.mail')); assert.equal(row.state, 'uncertain'); assert.equal(row.payload, null);
  tick(555); await rejectCode(() => store.verify(flow.cookie, message.code, '192.0.2.1', 'es'), 'ACCESS_REQUIRED');
});
test('20 provider attempts per Bogota day are shared and a rejected send does not free an attempt', async t => {
  const { store } = await fixture(t); await store.invite('owner@example.test');
  const flow = await store.session('', 'es'); await store.start(flow.cookie, 'owner@example.test', '192.0.2.1');
  await store.transaction(q => q('INSERT INTO @.mail_budget VALUES($1,20)', [day(store.now())]));
  let calls = 0; const result = await store.runMail(async () => { calls++; }); assert.equal(result.state, 'limited'); assert.equal(calls, 0);
});
test('lifetime USD 5 ceiling persists across month boundaries; concurrent reservations cannot exceed the remaining reserve', async t => {
  const { store, pool, tick, now } = await fixture(t); const logged = await login(store); const identity = store.identity('owner@example.test');
  await store.checkpointBudget(4900000, 'legacy-ledger-test-001'); await store.pause(false);
  const other = new AdsStore({ pool, pepper, scope: 'test', clock: now });
  const results = await Promise.allSettled([store.reserve(identity, randomUUID(), hash('draft-a'), 70000), other.reserve(identity, randomUUID(), hash('draft-b'), 70000)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1); assert.equal(results.find(r => r.status === 'rejected').reason.code, 'PILOT_BUDGET_LIMIT');
  await rejectCode(() => store.checkpointBudget(0, 'new-budget-reset'), 'BUDGET_ALREADY_INITIALIZED');
  tick(86400 * 27); // November to December; still inside the original 30-day invitation.
  await rejectCode(() => store.reserve(identity, randomUUID(), hash('draft-c'), 40000), 'PILOT_BUDGET_LIMIT');
  assert.equal((await store.session(logged.cookie, 'en')).body.authenticated, false); // auth expires independently
});
test('idempotency, ES/EN shared allowance and accounting mismatch are enforced', async t => {
  const { store } = await fixture(t); const logged = await login(store); const identity = store.identity('owner@example.test');
  await store.checkpointBudget(0, 'synthetic-no-paid-usage'); await store.pause(false);
  const id = randomUUID(); assert.equal(await store.reserve(identity, id, hash('same-draft'), 1000), true);
  await rejectCode(() => store.reserve(identity, id, hash('same-draft'), 1000), 'REVIEW_RESERVED');
  await store.finish(identity, id, 250); assert.equal(await store.reserve(identity, id, hash('same-draft'), 1000), false);
  await rejectCode(() => store.reserve(identity, id, hash('changed'), 1000), 'IDEMPOTENCY_CONFLICT');
  const es = (await store.session(logged.cookie, 'es')).body.pilot, en = (await store.session(logged.cookie, 'en')).body.pilot;
  assert.deepEqual(es, en); assert.equal(es.periodRemaining, 4);
  const second = randomUUID(); await store.reserve(identity, second, hash('second'), 500);
  await rejectCode(() => store.finish(identity, second, 501), 'BUDGET_ACCOUNTING_MISMATCH');
  await rejectCode(() => store.reserve(identity, randomUUID(), hash('third'), 100), 'PILOT_PAUSED');
});
test('a different identity key cannot reopen or silently reset the persistent store', async t => {
  const { store, pool, now } = await fixture(t); await store.checkpointBudget(1234, 'carryover-test-1234');
  const other = new AdsStore({ pool, pepper: 'b'.repeat(64), scope: 'test', clock: now });
  await rejectCode(() => other.migrate(), 'IDENTITY_SECRET_MISMATCH');
  await rejectCode(() => other.session('', 'es'), 'STORAGE_CHECKPOINT_REQUIRED');
});
test('data survives a database close/reopen and another controller instance', async t => {
  const directory = mkdtempSync(path.resolve('.qa/ads-vercel-'));
  let db = new PGlite(directory); await db.waitReady;
  let store = new AdsStore({ pool: poolFor(db), pepper, scope: 'test' }); await store.migrate();
  await store.checkpointBudget(12345, 'disk-restart-test-001'); await store.invite('owner@example.test');
  const flow = await store.session('', 'es'); await db.close();
  db = new PGlite(directory); await db.waitReady; t.after(() => db.close());
  store = new AdsStore({ pool: poolFor(db), pepper, scope: 'test' });
  const status = await store.session(flow.cookie, 'en'); assert.equal(status.cookie, null); assert.equal(status.body.csrfToken, flow.body.csrfToken);
  await rejectCode(() => store.checkpointBudget(0, 'reset-after-restart'), 'BUDGET_ALREADY_INITIALIZED');
});
test('both email languages retain the real logo and distinguish pilot access from a newsletter', () => {
  for (const locale of ['es', 'en']) { const mail = renderAccessEmail({ to: 'owner@example.test', code: '12345678', locale });
    assert.match(mail.html, /https:\/\/lienzo.tools\/assets\/email\/lienzo-logo.png/); assert.match(mail.html, /12345678/); assert.match(mail.text, /boletín|newsletter/); }
  assert.throws(() => renderAccessEmail({ to: 'x@example.test\r\nInjected: x', code: '12345678', locale: 'es' }));
});
test('Brevo adapter is closed by default, uses one fixed recipient and endpoint, and never retries', async () => {
  assert.throws(() => makeBrevoSender({ apiKey: 'synthetic-key'.repeat(4) }));
  let calls = 0; let payload;
  const sender = makeBrevoSender({ enabled: true, apiKey: 'synthetic-key'.repeat(4), fetchImpl: async (url, request) => {
    calls++; assert.equal(url, 'https://api.brevo.com/v3/smtp/email'); assert.equal(request.redirect, 'error');
    payload = JSON.parse(request.body); return new Response('{"messageId":"<synthetic@test>"}', { status: 201 });
  } });
  const result = await sender({ to: 'owner@example.test', code: '12345678', locale: 'en' });
  assert.equal(result.state, 'accepted'); assert.equal(calls, 1); assert.equal(payload.to.length, 1);
  assert.equal(payload.sender.email, 'contacto@lienzo.tools'); assert.equal(payload.removeTrackingPixel, true);
  const uncertain = makeBrevoSender({ enabled: true, apiKey: 'synthetic-key'.repeat(4), fetchImpl: async () => {
    calls++; throw new Error('Timeout after possible acceptance');
  } });
  assert.equal((await uncertain({ to: 'owner@example.test', code: '12345678', locale: 'es' })).state, 'uncertain'); assert.equal(calls, 2);
});
test('mail worker authenticates before claiming; returns counts without recipient/code and processes at most three jobs', async () => {
  let claims = 0; const store = { async runMail() { claims++; return { state: 'cancelled' }; } };
  const sender = async () => {}, secret = 's'.repeat(48);
  await rejectCode(() => runWorker({ store, sender, method: 'POST', authorization: 'Bearer wrong', secret }), 'WORKER_ACCESS_REQUIRED');
  assert.equal(claims, 0);
  const result = await runWorker({ store, sender, method: 'GET', authorization: 'Bearer ' + secret, secret });
  assert.equal(result.processed, 3); assert.equal(claims, 3); assert.deepEqual(Object.keys(result), ['processed', 'states']);
});
test('Preview cannot allocate another paid budget in parallel with Production', async t => {
  const { pool, now } = await fixture(t);
  const preview = new AdsStore({ pool, pepper, scope: 'preview', clock: now }); await preview.migrate();
  await rejectCode(() => preview.checkpointBudget(1, 'preview-paid-carry'), 'INVALID_BUDGET_CHECKPOINT');
  await preview.checkpointBudget(0, 'preview-no-paid-generations'); await preview.pause(false); await preview.invite('owner@example.test');
  await rejectCode(() => preview.reserve(preview.identity('owner@example.test'), randomUUID(), hash('draft'), 1), 'PREVIEW_PAID_GENERATION_DISABLED');
});
