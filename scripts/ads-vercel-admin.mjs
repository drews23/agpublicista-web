import { AdsStore } from '../server/ads-vercel/store.mjs';
import { connectDatabase, databaseURL } from '../server/ads-vercel/database.mjs';
import { requireThat } from '../server/ads-vercel/security.mjs';
// Secrets are inherited from the process. Never accept/publish a connection URL or
// pepper on the command line; no automatic credential generation or budget reset.
async function main() {
  const [operation, scope, ...args] = process.argv.slice(2);
  requireThat(['preview', 'production'].includes(scope), 'EXPLICIT_STORAGE_SCOPE_REQUIRED', 400);
  const pool = connectDatabase(databaseURL());
  try {
    const store = new AdsStore({ pool, pepper: process.env.LIENZO_ADS_IDENTITY_PEPPER, scope });
    if (operation === 'migrate' && args.length === 0) await store.migrate();
    else if (operation === 'checkpoint' && args.length === 2) await store.checkpointBudget(Number(args[0]), args[1]);
    else if (operation === 'pause' && args.length === 1 && ['true', 'false'].includes(args[0])) await store.pause(args[0] === 'true');
    else if (['invite', 'revoke'].includes(operation) && args.length === 0) {
      let raw = ''; for await (const chunk of process.stdin) { raw += chunk; requireThat(Buffer.byteLength(raw) <= 1024, 'ADMIN_INPUT_TOO_LARGE', 400); }
      const input = JSON.parse(raw);
      requireThat(input && Object.keys(input).sort().join(',') === (operation === 'invite' ? 'email,locale,ttl' : 'email'), 'INVALID_ADMIN_INPUT', 400);
      if (operation === 'invite') await store.invite(input.email, input.locale, input.ttl);
      else await store.revoke(input.email);
    }
    else throw new Error('INVALID_ADMIN_OPERATION');
    console.log(JSON.stringify({ operation, scope, completed: true }));
  } finally { await pool.end(); }
}
main().catch(() => { console.error('Administrative operation refused or unavailable. No secret values are logged.'); process.exitCode = 1; });
