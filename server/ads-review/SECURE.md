# Ads Studio: secure preparation, not hosting activation

Date: November 4, 2026. Both public language versions and the local MockProvider
previews retain their current behavior. No route loads these new components.

## Private configuration

`PrivateFiles.php` rejects public-root storage, traversal/URL paths, non-regular
secret files and oversized or malformed JSON. On POSIX the directory and file must
be owned by the actual PHP effective user and have no group/world permissions.
The recommended modes are 0700 for the directory and 0600 for JSON files. The POSIX
extension must expose the effective UID; otherwise verification fails closed.

The real secret-file loader deliberately refuses Windows. PHP's Unix-style mode
bits do not establish NTFS ACL privacy. Windows tests exercise path/permission
decisions and synthetic credentials, not a verified real Windows secret store.
Authentication fixtures use private temporary directories with fictional identities.
An isolated Hostinger LiteSpeed check on November 4, 2026 verified the actual web
effective UID, private directories/files, strict reader and SQLite with synthetic
fixtures. A product deployment still needs its own final paths and configuration;
the fixture directory is not the production secret store.

`GeminiCredentials` only accepts the exclusive project
`lienzo-tools-ads-20261104` and a bounded header-safe key value. This project label is
configuration validation, not cryptographic proof that the actual key is bound to
the project; a later authorized live check must establish that. Supported debug
output is redacted, JSON exposes no private fields and PHP serialization is refused.
Sensitive parameters are annotated. Never log, export or print the credential object,
headers, raw email messages or login responses.

`scripts/prepare-ads-private.php` is CLI-only. On a verified POSIX host:

```text
php scripts/prepare-ads-private.php /ABSOLUTE/PRIVATE/lienzo-ads /ABSOLUTE/public_html
```

The two paths are placeholders to resolve against the actual hosting; do not copy
them literally. The command exclusively creates `access.json` with a random identity
pepper and `gemini.json` with an intentionally invalid key placeholder. It refuses
existing files and never overwrites secrets. If preparation fails partway through,
inspect the existing files rather than deleting or regenerating them blindly.
It prints only preparation status, not the pepper/key. This command has **not** been
executed on Hostinger and no actual Google key was provisioned in this milestone.

The identity pepper maps a normalized mailbox to one persistent pilot participant.
Keep it stable and backed up privately. Rotation needs an identity migration plan;
replacing it casually would break account lookup. Google-key rotation is independent.
Configuration files, databases and backups must remain outside Git and the web root.

## Prepared HTTPS transport

`GeminiHttpsTransport` is disabled by default. It validates the exact method,
endpoint, model, body options and caps before reading a credential. It rejects
client-supplied hosts, model changes, extra headers, tools and persistence options.
The key enters only the HTTPS header at the final transport boundary.

The cURL branch verifies the peer certificate and hostname, permits HTTPS only,
disables redirection and inherited proxy configuration, caps connection/total times
at 5/30 seconds and aborts responses over 128 KiB during receipt. It never retries
or falls back to insecure TLS/HTTP. It does not log verbose cURL output or expose
private exceptions. cURL must be present before the real credential is loaded.

The optional wire closure is for isolated tests; production must use the actual
cURL branch. Tests replace the cURL functions to inspect options and simulate
timeouts, TLS failure, redirects and large responses. These are not live TLS or
Google tests. The transport must only be invoked through the protected review
orchestrator; it does not replace the lifetime budget or verified-access gate.

## Prepared verified access

`VerifiedEmailAccess` provides an administrator-managed allowlist of at most 20
mailboxes, separate from Brevo newsletter subscriptions. ASCII email addresses are
normalized by trimming/lowercasing; international/EAI addresses are not supported.
No public registration, email invitation service or mail-provider credentials exist.

The internal flow is:

1. An administrator allowlists a mailbox for at most 30 days.
2. A browser requests an eight-digit code; it expires after 10 minutes and is bound
   to that browser's 256-bit flow nonce. The controller must establish/protect the
   nonce server-side. It must never accept it as an arbitrary unauthenticated field.
3. The explicitly supplied mailer receives a plain-text transactional message in
   Spanish or English. There is no default sender. Fake acceptance in tests is not
   proof of email delivery, mailbox ownership or a Brevo connection.
4. The code is submitted by POST, never by following a state-changing GET link.
   Five failed guesses exhaust it. Attempts are committed even on failed verification.
5. A successful check consumes the code and rotates the session/CSRF tokens. The
   session expires after eight hours or allowlist expiry, whichever occurs first.
   Relogin revokes prior sessions for the same browser flow, not every other device.
6. Each review checks the session, CSRF and allowlist again, binds the mailbox to its
   persistent PilotStore grant and requires separate `gemini-review-v1` consent.
   New sessions or switching ES/EN do not reset the participant's quota.

The database stores HMAC mailbox identities and code hashes, plus hashed session,
nonce, CSRF and peer values; it does not store plaintext addresses or raw codes/tokens.
The mailer temporarily receives the destination and code in memory. Code/session
expiry stops use; it does not erase every metadata row. Retention/cleanup still needs
a production policy. Rate-limit records older than a day are removed on new attempts.

Persistent request limits are 3/mailbox, 5/peer and 30/global per 15 minutes.
Verification is limited to 20/peer and 200/global per 15 minutes. Both known and
unknown mailboxes receive the same response shape and consume request limits.
Mailer failure invalidates its code without exposing delivery status. Uniform reply
shape does not prove timing-resistant enumeration protection. The public controller
still needs review of timing, trusted peer handling, delivery latency and abuse controls.

Logout/revocation blocks existing sessions, including cached Gemini results.
Reinvitation preserves the pilot grant and cannot revive a revoked session or reset
its quota. Revoking someone does not create another cohort slot.

`AdsHttpsGuard` prepares exact POST/JSON/Origin/CSRF checks and host-only
`__Host-LIENZO_ADS_SESSION` cookie options: Secure, HttpOnly, SameSite=Strict, path `/`.
The final web controller must actually use them and rotate the anonymous flow cookie.
The guard trusts the server's direct HTTPS indicator only; `X-Forwarded-*` headers
do not enable HTTPS. Any reverse-proxy exception needs an explicit trusted-proxy
configuration after checking Hostinger's actual web environment. The isolated check
passed the direct HTTPS guard without a proxy exception. It also applied the cookie
settings to a temporary diagnostic and confirmed a real Chrome session roundtrip.
That diagnostic has been removed; a product login controller remains to be deployed.

`VerifiedGeminiReview` is closed by default. The prepared integration validates the
verified session and Google consent before allocating a pilot grant, then delegates
to GeminiPilotReview's shared lifetime budget. Its tests connect the complete path
using synthetic email, a dummy key and a fake HTTPS response. No invoice, genuine
mailbox verification, delivered email or real Gemini result is claimed.

## Activation sequence

1. Verify PHP web-SAPI, cURL/TLS, POSIX permissions, private SQLite access and secure
   session behavior in an isolated hosting check without a Google credential.
2. Prepare the private configuration using actual verified absolute paths, preserving
   existing databases and identity secrets. Do not regenerate the exclusive Cloud key.
3. Review the exact credential transfer destination before provisioning it. Keep
   generation disabled; do not buy credits or modify shared billing in this step.
4. Add the public controller and visible ES/EN access/consent interface, with an
   approved transactional mail sender and retention/abuse controls. Newsletter
   membership must never be inferred as authentication or consent to Google.
5. Review one bounded live test, credit purchase and reconciliation separately.
   Preserve USD 5 accumulated pilot limit and the existing price-expiry gate.

## Sources and tests

- [PHP cURL options](https://www.php.net/manual/en/function.curl-setopt.php)
- [OWASP token/code guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Gemini API keys](https://aistudio.google.com/docs/api-key)

Tests: `ads-secure-php.php` (44), `ads-https-curl-php.php` (8) and
`ads-access-race.test.cjs` (3). They use only synthetic keys, in-memory fake mail,
private temporary fixtures and network substitutes. cURL is loaded for the second
suite, but its actual network functions are replaced and no socket is opened.
