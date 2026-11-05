import { isIP } from 'node:net';
import { requireThat, strictJSON, equal, AccessError } from './security.mjs';

export const COOKIE = '__Host-LIENZO_ADS_SESSION';
export function parseCookie(header = '') {
  const values = header.split(';').map(v => v.trim()).filter(v => v.startsWith(COOKIE + '='));
  if (values.length !== 1) return '';
  const value = values[0].slice(COOKIE.length + 1); return /^[a-f0-9]{64}$/.test(value) ? value : '';
}
export function setCookie(value) { return `${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict`; }
export class AccessController {
  constructor({ store, origin, enabled = false }) {
    const url = new URL(origin);
    requireThat(url.protocol === 'https:' && url.origin === origin && !url.username && !url.password, 'INVALID_ORIGIN_CONFIGURATION', 503);
    this.store = store; this.origin = origin; this.host = url.host; this.enabled = enabled;
  }
  async handle({ method, path, headers = {}, body = '', peer }) {
    requireThat(this.enabled, 'ACCESS_NOT_CONFIGURED', 503);
    requireThat(headers.host === this.host && !['cross-site', 'same-site'].includes(headers['sec-fetch-site']), 'ACCESS_REQUIRED', 403);
    const url = new URL(path, this.origin), language = url.searchParams.get('lang') || 'es';
    requireThat(['es', 'en'].includes(language) && [...url.searchParams.keys()].every(key => key === 'lang') &&
      url.searchParams.getAll('lang').length <= 1, 'INVALID_LANGUAGE', 400);
    const expected = { '/api/ads/session': 'GET', '/api/ads/access/start': 'POST',
      '/api/ads/access/verify': 'POST', '/api/ads/access/logout': 'POST', '/api/ads/review': 'POST' }[url.pathname];
    requireThat(expected, 'NOT_FOUND', 404); requireThat(method === expected, 'METHOD_NOT_ALLOWED', 405);
    const cookie = parseCookie(headers.cookie);
    if (method === 'GET') return { status: 200, ...await this.store.session(cookie, language) };
    requireThat(headers.origin === this.origin && (headers['content-type'] || '').split(';')[0].trim().toLowerCase() === 'application/json' &&
      cookie && equal(this.store.csrf(cookie), headers['x-csrf-token']), 'ACCESS_REQUIRED', 403);
    requireThat(isIP(peer) > 0, 'ACCESS_REQUIRED', 403);
    if (url.pathname.endsWith('/start')) {
      const data = strictJSON(body, ['email']);
      return { status: 202, body: await this.store.start(cookie, data.email, peer) };
    }
    if (url.pathname.endsWith('/verify')) {
      const data = strictJSON(body, ['code'], 128);
      return { status: 200, ...await this.store.verify(cookie, data.code, peer, language) };
    }
    if (url.pathname.endsWith('/logout')) {
      strictJSON(body, [], 32); return { status: 200, ...await this.store.logout(cookie, language) };
    }
    const data = strictJSON(body, ['schemaVersion', 'requestId', 'draftRevision', 'locale', 'goal', 'draft', 'evidence', 'constraints', 'consent'], 65536);
    requireThat(data.consent?.version === 'gemini-review-v1' && data.consent?.confirmed === true, 'CONSENT_REQUIRED', 403);
    const status = await this.store.session(cookie, language);
    requireThat(status.body.authenticated, 'ACCESS_REQUIRED', 403);
    // Access + mail migration does not connect a paid provider. A future reviewer
    // must validate the complete old contract, then reserve a server-owned maximum.
    throw new AccessError('GEMINI_PILOT_DISABLED', 503);
  }
}
