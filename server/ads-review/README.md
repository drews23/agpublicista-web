# Ads Studio: local review backend prototype

The HTTP preview remains a complete **local simulation**, not a deployable public
API. Its `MockProvider` repeats a confirmed offer fact verbatim. It does not create
professional copy, interpret the goal semantically, browse a destination, approve
ads, or predict campaign results. Use fictional test data.

`Gemini.php` adds a separate integration seam and usage-based accounting.
`GeminiHttps.php` now prepares a closed-by-default HTTPS transport, `PrivateFiles.php`
validates private credential files and `VerifiedAccess.php` prepares invite-only
email-code access. Neither the previous development routers nor a public page loads
the Google transport. The new `-Access` preview uses only fictional email and a local
simulator with the prepared controller and ES/EN screens; see [ACCESS.md](ACCESS.md).
Tests use synthetic keys, simulated mail and substituted network calls only. See
[the Gemini contract](GEMINI.md) and [the secure preparation contract](SECURE.md).

## Run locally on Windows

PHP 8.3 is required, with PDO SQLite, intl and mbstring. A portable official PHP
8.3.36 runtime was verified against the official SHA-256 and placed under
`output/ads-review-runtime/php/`; its source metadata is in the parent folder.
No system installation or PATH change is needed. Runtime binaries are not source files.

Run `powershell -File scripts/start-ads-review-local.ps1` from the repository.
Use `-PhpPath` for another compatible PHP executable. The server is bound only to
`127.0.0.1:8810`; stop it with Ctrl+C. The [PHP development server](https://www.php.net/manual/en/features.commandline.webserver.php)
is for this controlled test, not public hosting.

- Spanish: `http://127.0.0.1:8810/herramientas/anuncios/#ads-local-review`
- English: `http://127.0.0.1:8810/en/tools/ads/#ads-local-review`

## Local invitation pilot

Run `powershell -File scripts/start-ads-review-local.ps1 -Pilot` to start the separate
loopback server on port **8811**. The existing port 8810 simulation is unchanged.
No query parameter enables the pilot. No public HTML page loads this test panel.

The pilot keeps the editor open but requires a single-use test invitation for the
simulated review. Its test policy is 20 participants, a fixed 30-day access period,
5 review attempts during that period and 2 per Bogotá calendar day. These are local
trial settings, not published terms or an approved paid budget. Spanish and English
use the same server-side participant allowance, independent of browser sessions.

The CLI-only `scripts/prepare-ads-pilot-local.php` issues a token for a fictional
participant ID when `LIENZO_ADS_DEV_PILOT=1`. Pass the private directory and the
participant ID; the token is written to `invitation-token.txt` there, never stdout.
The default directory is `D:/lienzo-private-dev/ads-review-pilot/`. Set
`LIENZO_ADS_PRIVATE_DIR` consistently on the server and tests for a fresh QA cohort.
No HTTP route creates invitations. Reissuing an invitation for the same participant
retains their identity and quota; it invalidates their prior unused token.

`Pilot.php` stores hashed invitation tokens and opaque participant hashes in private
SQLite storage. Activation rotates the local session and CSRF token. Revocation and
expiry are checked before every review, including cached results. This is possession
of an invitation, **not verified email, production sign-in or public abuse protection**.
The activation attempt limit is session-based and can be bypassed by new sessions;
do not present it as protection for an Internet-facing endpoint.

The private ledger atomically reserves review slots and integer micro-USD amounts
using `BEGIN IMMEDIATE`. Exact successful retries within the response-cache window
do not consume another slot. After response expiry, the ledger prevents the same ID
from silently invoking the provider again. Uncertain work retains its slot and maximum
reservation; mismatched cost accounting pauses further execution. A slot and a monetary
reservation are different. The pilot route uses only `MockProvider`, with zero reserved
cost and **paid budget zero**. The separate offline Gemini seam has a conservative
model-bound reservation and simulated receipt settlement. No real provider execution
or reconciliation against a Google invoice has been verified.

The monetary cap applies to the entire pilot database lifetime across all calendar
months and participants. `budget_period` records a month for accounting only; it
does not renew the budget. On 2026-11-04 the owner approved a total pilot consumption
cap of USD 5, not a recurring monthly allowance. The local route still reserves zero
and remains simulated; that approval does not configure Google billing or a provider.

Expired invitations and access grants stop working, but metadata/usage tombstones are
not automatically purged. Production retention and scheduled cleanup remain pending.
An admin-defined participant ID is not proof of a unique person. Verified email,
account recovery and protection against multiple accounts still need implementation.

New tests: `scripts/tests/ads-pilot-php.php`, `ads-pilot-http.test.cjs` and invitation
cases in `ads-review-client.test.cjs`. They use fictional participants and simulated
costs. The HTTP suite requires both local servers and a matching private directory.
For a repeatable fresh cohort, restart only the pilot server with a new private path;
never erase a real participant database to rerun tests. DOM tests can use jsdom in an
isolated QA directory; no dependency or lock file was added to the public website.

Load the existing fictional example via More options, enter a goal and a different
offer fact, check both confirmations, then review. Apply, discard, or undo a proposed
change. Existing save/export controls remain available. A change to the draft or
evidence invalidates the proposal; undo never overwrites subsequent edits.

## Boundaries

The router requires the explicit `LIENZO_ADS_DEV=1` flag, PHP's CLI server SAPI,
loopback remote address, and exact host. The normal site HTML never loads the review
scripts or enables the local marker. The router injects the scripts and corrects
privacy copy only into its local responses. Backend source paths are denied by the
repository root and directory `.htaccess`; the local router uses a static allowlist.
The router has no Gemini connection or credential handling. The standalone transport
implementation remains closed by default and is not connected to either HTTP preview.

`GET /api/ads/session` establishes a local HttpOnly, SameSite=Strict session and CSRF
token. `POST /api/ads/review` requires the matching token, exact Origin, JSON media
type and a bounded 64 KiB request. The prototype's HTTP cookie deliberately does
not use Secure because the server is loopback HTTP; this is not production session
configuration or public user authentication.

Request and response schemas reject unknown properties. Campaign, account, ad group,
pasted landing text and general fact notes are excluded from the request. Locale and
ad language remain separate. The canonical draft projection has a SHA-256 revision;
the browser and PHP share tested Unicode character-counting rules. The existing
`LienzoAdsEngine` remains responsible for browser drafting/export invariants.

Only a full, confirmed offer fact from the same destination can be proposed by this
simulator. No text is silently clipped. A fact over 30 characters can be proposed as
a description when it fits 90 characters. The response validator independently
checks field/index, previous text, evidence, length, duplicates, controls and review
status. This restricted extractive check is not general semantic validation of LLM output.

## Persistence and duplicate prevention

Default storage is `lienzo-private-dev/ads-review` beside the repository, **outside
the public root**. The service rejects a database directory inside that root.
`LIENZO_ADS_PRIVATE_DIR` can choose another private path for the test. No source or
request logs contain credentials; original/proposed ad text does exist in the private
response cache. Filesystem access permissions still need an actual hosting check.

SQLite `BEGIN IMMEDIATE`, a unique session/request key, and a stored body fingerprint
reserve requests atomically. Repeated ID/body returns the saved result; conflicting
body or pending work returns 409. Sessions have separate caches. Failed work is not
automatically retried. The local prototype allows 6 new requests per session/minute
and 60 globally/minute. These are test request limits, **not a paid API budget**.

Cache records expire for reuse after ten minutes and are purged on the next request.
An idle database may retain expired data until that next request. Scheduled cleanup,
protected production storage and a retention policy are still required before real data.
The provider is not invoked inside the SQLite transaction. See the official
[PDO transaction documentation](https://www.php.net/manual/en/pdo.transactions.php).

## Tests

`scripts/tests/ads-review-php.php` exercises the PHP contract/service with a fresh
private directory supplied as its argument. `ads-review-http.test.cjs` requires the
local server above; it tests real HTTP, PHP/browser counting parity and two independent
PHP processes racing on one request. `ads-review-client.test.cjs` exercises the actual
editor/controller with jsdom, including errors, cancel, late results and preserved downloads.
Set `LIENZO_JSDOM_PATH` to the already installed jsdom runtime when needed.

## Before any public or Gemini activation

An isolated **web-SAPI** check on November 4, 2026 at 21:50:17 Bogotá passed 33/33
checks using PHP 8.3.36 LiteSpeed. It exercised the current modules with synthetic
fixtures outside the web root: effective UID/private permissions, the strict JSON
credential reader, SQLite, an email-code/session/logout flow, real same-origin
POST/CSRF validation and a Chrome cookie roundtrip. Cookie options were Secure,
HttpOnly, SameSite=Strict with a host-only prefix. Two parallel web requests reached
different worker processes and produced exactly one SQLite reservation.

Unauthenticated HTTPS HEAD to Google's root verified TLS only (404, cURL error 0).
No real key was read, mail sent or generation called. The temporary public bridge
was moved to trash and its URL verified at 404; no cron was created. ES/EN Ads pages
remained byte-for-byte identical to the pre-test baseline at HTTP 200. Evidence:
`output/ads-web-hosting-2026-11-04/hostinger-web-report.json` and
`cleanup-and-public-verification.json`. This is isolated hosting evidence, not a
published login controller, authenticated Gemini request or real mail delivery.

An isolated hosting check on 2026-11-04 verified PHP 8.3.36 **CLI** execution,
private directory/file permissions, SQLite transactions, duplicate reservations and
two-connection writer locking outside `public_html`. An unauthenticated HTTPS HEAD
to Google's API host verified TLS reachability only; no provider generation ran.
The temporary cron was removed and the empty cron list was verified afterward.
Evidence: `output/ads-hosting-check-2026-11-04/hostinger-report.json` (local artifact).
`hosting-probe.php` is CLI-only, expires after fifteen minutes from upload, runs once
per dedicated private directory, and must never become a public HTTP diagnostic.

On 2026-11-04 an exclusive Google project and Gemini-only service-account-bound
credential were created in Cloud; the secret remains in Google. This is not a
working backend connection. Still required: the actual public controller/interface
and its hosting configuration, public authentication/abuse protection, live
validation of reservation bounds and current model/pricing,
verified hosting permissions and credential provisioning, actual provider timeout/
billing behavior, visible access/consent screens, transactional mail delivery, and
production retention/monitoring. The underlying secure-file, HTTPS, email-code and
Google consent helpers exist but have not been activated on hosting. These are explicit
next gates. The offline server contract accepts a separate `gemini-review-v1` purpose
only when explicitly selected by the server; the normal local contract rejects it.
The provider must stay unavailable if any required configuration or budget is absent.
Do not deploy this development router as the public API. No credentials belong in this
directory, the repository, browser code, logs, or chat.
