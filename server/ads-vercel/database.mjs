import { Pool } from '@neondatabase/serverless';
import { requireThat, equal } from './security.mjs';
// Vercel's managed Neon integration prefixes DATABASE_URL (not just URL).
// Support its exact server-only name without copying or revealing credentials.
export function databaseURL(environment = process.env) {
  const direct = environment.LIENZO_ADS_DATABASE_URL;
  const managed = environment.LIENZO_ADS_DATABASE_DATABASE_URL;
  requireThat(direct === undefined || managed === undefined || equal(direct, managed),
    'DATABASE_CONFIGURATION_CONFLICT', 503);
  return direct ?? managed;
}
export function connectDatabase(value) {
  let url; try { url = new URL(value); } catch {}
  requireThat(url && ['postgres:', 'postgresql:'].includes(url.protocol) &&
    /^[a-z0-9.-]+\.neon\.tech$/.test(url.hostname) && url.username && url.password &&
    url.pathname.length > 1 && ['require', 'verify-full'].includes(url.searchParams.get('sslmode')),
    'DATABASE_NOT_CONFIGURED', 503);
  return new Pool({ connectionString: value, max: 2, connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 1000, statement_timeout: 10000, lock_timeout: 5000 });
}
