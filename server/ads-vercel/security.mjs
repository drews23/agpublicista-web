import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual,
  createCipheriv, createDecipheriv } from 'node:crypto';
export class AccessError extends Error {
  constructor(code, status = 403) { super(code); this.code = code; this.status = status; }
}
export function requireThat(ok, code = 'ACCESS_REQUIRED', status = 403) {
  if (!ok) throw new AccessError(code, status);
}
export const token = () => randomBytes(32).toString('hex');
export const challengeId = () => randomBytes(16).toString('hex');
export const otp = () => String(randomInt(100000000)).padStart(8, '0');
export const hash = value => createHash('sha256').update(value).digest('hex');
// PHP used the hex pepper as a UTF-8 string, not decoded bytes. Keep identities stable.
export const keyed = (pepper, value) => createHmac('sha256', pepper).update(value).digest('hex');
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const first = Buffer.from(a), second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}
export function email(value) {
  requireThat(typeof value === 'string', 'INVALID_EMAIL', 400);
  value = value.trim().toLowerCase();
  requireThat(value.length <= 254 && /^[\x21-\x7e]+$/.test(value) &&
    /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(value), 'INVALID_EMAIL', 400);
  return value;
}
export const day = seconds => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(seconds * 1000));
export function strictJSON(raw, keys, max = 2048) {
  requireThat(typeof raw === 'string' && Buffer.byteLength(raw) <= max, 'REQUEST_TOO_LARGE', 413);
  let value; try { value = JSON.parse(raw); } catch { throw new AccessError('INVALID_JSON', 400); }
  requireThat(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join('\0') === [...keys].sort().join('\0'), 'INVALID_REQUEST', 400);
  return value;
}
export function seal(pepper, scope, id, message) {
  const raw = Buffer.from(JSON.stringify({ id, message }));
  requireThat(raw.length <= 4096, 'INVALID_MAIL_JOB', 400);
  const plain = Buffer.alloc(4100, 32); plain.writeUInt32BE(raw.length); raw.copy(plain, 4);
  const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm',
    Buffer.from(keyed(pepper, `mail-key-v1:${scope}`), 'hex'), nonce);
  cipher.setAAD(Buffer.from(`lienzo:${scope}:${id}`));
  return Buffer.concat([nonce, cipher.update(plain), cipher.final(), cipher.getAuthTag()]).toString('base64');
}
export function open(pepper, scope, id, ciphertext) {
  const bytes = Buffer.from(ciphertext, 'base64');
  requireThat(bytes.length === 4128, 'MAIL_CIPHERTEXT_INVALID', 503);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(keyed(pepper, `mail-key-v1:${scope}`), 'hex'), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(`lienzo:${scope}:${id}`)); decipher.setAuthTag(bytes.subarray(-16));
  const plain = Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]);
  const length = plain.readUInt32BE(); requireThat(length <= 4096, 'MAIL_CIPHERTEXT_INVALID', 503);
  const value = JSON.parse(plain.subarray(4, 4 + length).toString('utf8'));
  requireThat(value.id === id, 'MAIL_CIPHERTEXT_INVALID', 503); return value.message;
}
