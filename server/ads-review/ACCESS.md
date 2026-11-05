# Ads Studio access controller and screens

November 4, 2026. Local implementation after commit
`71255e41e161613d553cd79987f1fd1311e921b7`. This milestone does not activate a public
login, send real email, load the actual Gemini key or perform a paid generation.
The existing public ES/EN HTML pages are unchanged.

## User flow

The independent editor remains usable without access. Review preparation is a
collapsible section so authentication does not displace the ad workspace. The
native dialog has three localized steps: invited email, eight-digit code and
explicit authorization. It supports a complete-code paste, email/OTP autocomplete,
visible labels, error announcements, keyboard dismissal and focus return. Codes
are submitted only by POST; neither codes nor mailbox addresses enter a URL,
browser storage or analytics payload.

Authorization starts unchecked on every page load and session change. The user
sees the sharing purpose before accepting. The draft goes to the review endpoint
only after a separate review click with goal and owner-confirmed evidence. The
result never changes the draft automatically. Apply/discard/undo, revision checks
and cancellation reuse the existing review controller. An exhausted allowance
blocks the next request while preserving the last completed proposal. Logging out
or losing authorization discards pending proposal controls and ignores late replies.

The local preview clearly identifies its simulator. It repeats a complete confirmed
fact; it is not a live Gemini result or unrestricted professional copy generation.

## Server boundary

`AdsAccessController` is disabled by default. The mailer and reviewer are explicit
server-owned closures, with no default network transport. `AdsAccessHttp` provides
the PHP bootstrap for a later explicitly configured entry point. No production
route instantiates it.

Prepared routes:

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/ads/session?lang=es` or `en` | Anonymous CSRF or verified summary; no trial allocation |
| POST | `/api/ads/access/start` | Strict JSON `{email}`; generic accepted response |
| POST | `/api/ads/access/verify` | Strict JSON `{code}`; server owns the current challenge |
| POST | `/api/ads/access/logout` | Empty JSON object; revoke and rotate |
| POST | `/api/ads/review` | Existing request contract plus `gemini-review-v1` consent |

The PHP session stores the browser nonce, challenge identifier and opaque verified
session/CSRF tokens. They are never returned as authentication credentials. Only
the separate flow CSRF token reaches JavaScript. The PHP session ID rotates at
bootstrap, successful login, logout and invalid/expired verified access. The product
cookie is host-only `__Host-LIENZO_ADS_SESSION`, Secure, HttpOnly, SameSite=Strict,
path `/`, with no persistent cookie lifetime. Session files live in a private
directory outside the web root; PHP strict mode and cookie-only sessions are used.

The production guard requires direct HTTPS, exact `lienzo.tools` host, exact
`https://lienzo.tools` POST Origin, JSON and CSRF. Cross-site and same-site/subdomain
fetch contexts are rejected. Forwarded headers cannot bypass HTTPS. Anonymous
flows expire after 30 minutes; verified sessions keep the existing eight-hour or
allowlist expiry bound. Codes expire after 10 minutes, have five guesses and a
server-enforced 60-second resend cooldown, in addition to the existing persistent
mailbox/peer/global limits.

Session and quota summaries do not allocate a grant or start the 30-day period.
The first valid, consented review does. Session/language changes preserve the same
mailbox grant and usage. The PHP session lock is released after access checks and
before invoking the provider. Existing SQLite reservations, response validation,
idempotency and the accumulated USD 5 budget remain at the review-service boundary.
Provider availability, budget and billing decisions cannot come from the browser.

## Running the isolated preview

```powershell
.\scripts\start-ads-review-local.ps1 -Access
```

- Spanish: `http://127.0.0.1:8812/herramientas/anuncios/#ads-local-review`
- English: `http://127.0.0.1:8812/en/tools/ads/#ads-local-review`
- Fictional allowlisted email: `preview@example.test`.
- Default private fixture directory: `D:\lienzo-private-dev\ads-access-preview`.
- `preview-mail.json` is a **fictional local outbox**, readable only through the
  local filesystem. It contains the latest test code. No HTTP route serves it.
- `LIENZO_ADS_ACCESS_PRIVATE_DIR` can select a fresh isolated fixture directory.
  The preparer creates a new fictional cohort once; restarting does not reset it.
- The loopback exception requires PHP `cli-server`, an explicit development flag,
  exact `127.0.0.1:8812` Host/Origin and the loopback peer. It cannot run on Hostinger.
- Old `8810` simulation and `8811` token-invitation previews retain their behavior.

No Google adapter or credential loader is loaded by this preview router. The only
review dependency is `PilotReview` with `MockProvider` and a zero-cost policy.
The real production secret loader continues to refuse unverifiable Windows ACLs.

## Validation

- `scripts/tests/ads-access-controller-php.php`: 24 checks, including guard bypasses,
  server-owned nonce, body bounds, generic replies, cooldown, expiry, failed codes,
  rotation, revocation, consent, grant timing and persistent cross-session quota.
- `scripts/tests/ads-access-client.test.cjs`: 14 ES/EN interface checks, including
  independent export, manual application/undo, access errors, late responses,
  logout/expiry and preservation of the final allowed proposal.
- `scripts/tests/ads-access-http.test.cjs`: actual loopback PHP integration with
  real cookies, rotated IDs/CSRF, inaccessible private files, simulated mail,
  same-request caching, shared quota and logout. It uses a fresh private fixture
  and refuses to share the preview's existing cohort.
- Existing review/pilot/Gemini/security PHP suites and 17 previous client checks
  remain regression checks. These tests use synthetic credentials and no provider
  network calls. Browser responsive tests are emulation, not a physical-phone test.

## Before public activation

1. Review the localized screens and commit this new lot separately.
2. Choose an approved transactional sender and private configuration path. Use a
   queued delivery boundary to avoid reflecting provider latency or mailbox
   invitation status in the request. Equal JSON shapes alone do not establish
   timing-resistant enumeration protection. A fake outbox is not mailbox proof.
3. Set and verify production retention/cleanup for challenges, server sessions,
   allowlist metadata and review records. Do not delete or regenerate the existing
   identity pepper or participant databases.
4. Add an explicitly configured HTTPS entry point/routing rule; recheck actual
   hosting cookie rotation and private session storage. Preserve disabled-by-default
   provider gates until the genuine sender, cohort and key configuration are ready.
5. Review credential transfer, any credit purchase and one bounded live generation
   separately. Recheck the existing price-snapshot expiry before that generation.
   Keep the accumulated USD 5 ceiling and reconcile usage; do not infer a reset.

Sources consulted for the controller:
[PHP session settings](https://www.php.net/manual/en/session.security.ini.php) and
[OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
21st catalog metadata 28226, 34821 and 29247 informed the progressive form pattern;
no paid code or hosted generation was used. UI Styling and 21st UI Build were
adapted to the existing static HTML/CSS/JS stack, without a framework migration.
