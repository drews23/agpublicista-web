# Ads Studio: Node.js controller and durable PostgreSQL outbox

## Delivery state

This migration lot targets the existing independent `lienzo-tools` Vercel
project, using Node.js 24 and Neon PostgreSQL. It preserves the current Spanish
and English pages and the existing access-screen JSON contract. It does not
activate login, send real mail, connect Gemini, change DNS or migrate production
data. Neon Free is provisioned for Preview, and a synthetic marker persisted
across independent SQL editor visits. The PostgreSQL engine used for automated
tests is PGlite, including a disk close/reopen test. Deployed HTTP functionality
and distributed Neon concurrency remain separate verification gates.

## Private function and persistence

The curated static build now also bundles a private Node.js function using esbuild.
Its route is `/api/ads/*`; `server/`, tests and node_modules remain absent from
static output. `.vc-config.json` selects Node.js 24 without request-body helpers,
because the application reads and bounds its own raw JSON stream. The runtime is
closed unless `LIENZO_ADS_ACCESS_ENABLED=1` on an actual Vercel Preview/Production
environment. It does not perform database migrations on incoming requests.

Neon Pool connections use an explicit TLS connection URL, a bounded pool and
connection/statement/lock timeouts. Mutations use PostgreSQL transactions and a
transaction-scoped advisory lock, appropriate to this 20-person pilot. The lock is
shared by serverless instances, while Preview and Production use separate schemas
and different lock IDs. No runtime business state is stored on local disk.

Private tables contain allowlist HMACs, hashed opaque session cookies, challenges,
rate events, encrypted jobs, mail attempt counters, budget checkpoint and usage.
The same UTF-8 pepper representation as PHP preserves mailbox identities. A
pepper check is bound to the schema/environment; changing the pepper fails closed
instead of silently creating new identities or resetting consumption.

## Browser/access contract

- GET `/api/ads/session?lang=es|en`: anonymous CSRF or verified summary.
- POST `/api/ads/access/start`: strict JSON `{email}`, generic 202 for invited and
  unknown addresses. Both queue a fixed-size encrypted job; the unknown recipient
  never reaches Brevo. Provider latency is outside this request, but this design
  alone is not a claim of constant-time account-enumeration resistance.
- POST `/api/ads/access/verify`: `{code}`, exactly eight digits, ten-minute expiry,
  five committed guesses, one use, bound to the requesting session.
- POST `/api/ads/access/logout`: `{}`, revocation and anonymous cookie rotation.
- POST `/api/ads/review`: requires valid access and `gemini-review-v1` consent,
  then stays disabled. Full review/response validation and the paid provider
  integration remain the next stage; this lot does not generate suggestions.

The cookie is host-only `__Host-LIENZO_ADS_SESSION`, Secure, HttpOnly,
SameSite=Strict, Path=/, with no persistent Max-Age. Login/logout rotate cookie
and CSRF. Strict host/origin/Fetch Metadata/JSON/CSRF checks precede mutations.
Preview permits only server-owned deployment and branch hosts. Codes, email
addresses and auth tokens do not enter URLs, analytics or browser storage.
Anonymous access expires after 30 minutes; verified access after eight hours or
allowlist expiry. Session inspection does not allocate a review or start a grant.

Limits retain the PHP pilot: capacity 20; start limits 30 global, 5 per peer and
3 per mailbox in 15 minutes; verify limits 200 global and 20 per peer. Same-session
resend cooldown is 60 seconds. No public invitation-creation endpoint exists.

## Mail queue and provider adapter

AES-256-GCM authenticates the environment and challenge ID. Every plaintext is
padded to 4,100 bytes before encryption; the database stores no plaintext recipient
or code. Jobs expire after 120 seconds, queue capacity is 60, and a worker claims
jobs transactionally before networking. It checks challenge/session/invitation
validity immediately before sending. Payloads are scrubbed on terminal outcomes.
Sending leases abandoned for 45 seconds become `uncertain`, never retryable.
Terminal job metadata is removed after 24 hours. Authentication metadata is
cleaned after expiry plus 24 hours; invitation/usage/budget records remain for
pilot accounting and are not reset automatically.

The private mail endpoint is `/api/ads/internal/mail`, GET or POST with an exact
Bearer `CRON_SECRET`. It processes at most three jobs per invocation. Shared
provider attempts are capped at 20 per America/Bogota calendar day; failures do
not refund attempts. The Brevo adapter is disabled by default, has a fixed HTTPS
endpoint, one recipient, no redirect, a 15-second deadline, a 4-KiB response bound,
no retries and no tracking pixel. A valid 201/messageId is provider acceptance,
not proof of inbox delivery. Network uncertainty never causes automatic resends.

A native Vercel cron is generated only for Production with explicit access,
mail and cron activation flags plus its worker secret. No cron is generated for
Preview or this unconfigured local lot. Do not enable it merely to inspect status.

## Lifetime USD 5 accounting

The database enforces a ceiling no greater than 5,000,000 integer micro-USD.
There is no monthly reset. An explicit immutable carryover checkpoint is required;
Preview has a zero-cost ceiling and refuses any paid reservation, so it cannot
create a second USD 5 allowance alongside the single Production pilot budget.
It is not initialized to zero on boot or restart. New reservations atomically
include the carryover, completed actual costs and the full amount of pending or
uncertain reservations. An idempotency key cannot be reused for another draft.
Unknown outcomes retain the reserve; accounting above the reserved maximum pauses
the pilot. The server, never browser JSON, will choose the maximum model cost.

Per-mailbox limits remain five reviews in 30 days and two per Bogota day, shared
across browser sessions and Spanish/English. First valid paid-review reservation
activates the period; opening the editor and receiving a code do not. The model
adapter remains disconnected until its current pricing, token bounds and result
validator are rechecked. The USD 5 cap covers Gemini, not an unapproved database
subscription; use the selected Neon Free plan without paid upgrades.

## Provisioning and secrets

Use the Vercel Marketplace Neon integration, scoped to `lienzo-tools`, starting
with database `lienzo-ads-studio` and the region closest to its iad1 functions.
Select the current Free plan in the actual provisioning screen. Do not enable
Neon Auth, Realtime or additional products. The integration currently requires
accepting Vercel's Marketplace End User Addendum, Neon Terms and privacy notice,
which must be confirmed before acceptance.

Server variables (never public prefixes, source, chat, screenshots or report values):

- `LIENZO_ADS_DATABASE_URL`: environment-specific Neon TLS connection.
- `LIENZO_ADS_IDENTITY_PEPPER`: existing pepper, transferred privately, not regenerated.
- `LIENZO_ADS_ACCESS_ENABLED`: `1` only after database/migration/mail verification.
- `LIENZO_ADS_BREVO_API_KEY`: separately approved restricted credential, still uncreated.
- `LIENZO_ADS_MAIL_ENABLED`: `1` only after the real sender is configured.
- `CRON_SECRET`: private worker secret, only when enabling that worker.
- `LIENZO_ADS_MAIL_CRON_ENABLED`: production schedule opt-in; leave unset for now.

Provisioning update, November 5: Neon `lienzo-ads-studio` is created in iad1 on
`free_v3` (Free, no payment method), with Auth and Realtime both false. It is
connected exclusively to `lienzo-tools` Preview. The managed integration creates
16 Secret variables with prefix `LIENZO_ADS_DATABASE`; its actual connection name
is `LIENZO_ADS_DATABASE_DATABASE_URL`. The server adapter explicitly maps that name
or the direct `LIENZO_ADS_DATABASE_URL`, rejecting conflicting values. Credentials
were not revealed, copied to source or saved locally. Production/Development
connection and automatic deployment-branch creation remain unselected.

Installation `icfg_MoyUbewgJbWK3VNVpOLBu8An`, store `store_XIZgAtlz7mRQ2r1a`,
Neon project `restless-heart-47886492`. After the user's verification, Vercel Query
successfully executed SQL against `neondb`. The nine empty Preview tables were
created idempotently using the exact schema from `schema.mjs`, in one atomic
`DO` block. That editor rejects multiple top-level prepared commands; the first
multi-statement attempt did not apply. No identity key, allowlist, budget checkpoint
or existing usage was initialized or reset.

A separate synthetic marker in `lienzo_ads_checks.persistence_probe` was inserted
and read again after reopening the editor in a new tab. A final SQL audit confirmed
nine Preview tables, zero invited users, zero budget checkpoints, zero review
records, zero mail jobs and no Production schema. Read-only mode was restored.
This proves actual cloud SQL persistence, not deployed controller functionality
or distributed SDK concurrency. Those runtime checks remain separate gates.

The latest local suites pass 22 backend tests and 16,237 static assertions, including
all 154 sitemap URLs. The managed-variable mapping is included in these tests.

Do not pull all environment values to local disk. Keep Preview separate from
Production. An integration may inject multiple generic names; use a reviewed
server-only mapping rather than publishing or logging their values.

## Administrative migration and cutover

The CLI `scripts/ads-vercel-admin.mjs` accepts secrets only from its process
environment. Scope must be explicit. Supported operations: `migrate`,
`checkpoint <carriedMicroUsd> <reference>`, `pause true|false`, and `invite`/`revoke`
with a bounded JSON document on stdin. It does not log recipient or secret values.
Repeated migrations are idempotent; a different carryover checkpoint is refused.

Before enabling access, audit/export the existing private PHP cohort, grants and
usage without printing secrets. Reconcile all spent, pending and uncertain costs;
do not assume a zero baseline. Preserve participant activation dates and prior
quota usage when importing. The current CLI does not import that legacy ledger:
prepare and verify that import against the actual existing state before cutover.
Do not operate two independent live pilot budgets at the same time.

Old PHP cookies and pending Sodium-encrypted jobs are deliberately not copied to
the new Node.js session/outbox. Stop old starts, let existing jobs/codes expire,
invalidate remaining old challenges, then require a fresh code in the new system.
This does not reset the existing participant allowances or lifetime cost ledger.
Keep Hostinger and its private records intact until the migration is verified.

## Validation and remaining checks

Run `npm run test:backend`, `node scripts/build-vercel.mjs` and
`node scripts/tests/vercel-static.test.mjs`. Tests use synthetic data and substituted
provider calls, never Brevo or Gemini network requests. PGlite tests execute real
PostgreSQL statements; their local pool bridge serializes transactions. Verify
concurrency again using independent Neon connections before calling the distributed
locking production-proven. Cloud HTTP cookies, worker auth, provider delivery,
retention schedule and deployed function compatibility remain activation gates.

The native HTTP regression suite uses real Node.js IncomingMessage and
ServerResponse objects over loopback, with a server-owned database connector
substitution. It covers raw/chunked body limits, invalid UTF-8, strict origin and
CSRF checks, generic access replies, the encrypted outbox with a fictional sender,
cookie/CSRF rotation, ES/EN session continuity, disabled review and logout. Browser
requests cannot choose that connector. Test cookies are inspected and sent
explicitly; this is not a browser Secure-cookie/TLS proof, a Neon SDK concurrency
proof or evidence of real email delivery.

Primary references: [Neon driver](https://neon.com/docs/serverless/serverless-driver),
[current Neon pricing](https://neon.com/pricing),
[Vercel-managed integration](https://neon.com/docs/guides/vercel-managed-integration),
[Vercel Build Output primitives](https://vercel.com/docs/build-output-api/primitives).
