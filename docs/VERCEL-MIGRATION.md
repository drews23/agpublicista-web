# Lienzo: independent Vercel preview

## Scope and boundaries

The source repository is `drews23/agpublicista-web`. The historical repository
name does not require the public site or its new backend to use agpublicista.com.
The new Vercel project is `lienzo-tools` in `drews23s-projects`.

This first stage preserves the static Spanish and English site. It does not move
DNS, replace the current Hostinger site, create paid storage, enable Gemini,
send email, or publish the PHP source. The existing mail implementation remains
separate work in the original checkout. Preserve its tests as migration evidence.

## Build and verification

Run `node scripts/update-vercel-manifest.mjs` after adding public assets to Git.
Review the explicit manifest diff. The remote build does not require Git metadata:
`node scripts/build-vercel.mjs` copies only manifest-listed public files accepted
by a second path/extension policy into `.vercel/output/static`.

Run `node scripts/tests/vercel-static.test.mjs` after the build. Checks cover file
hash parity, the complete sitemap, directory routes, source exclusions, historic
redirects, font CORS and the production guard. Preview robots and response headers
prevent indexing. Canonicals, hreflang, Spanish/English content, templates, assets
and download ZIPs are copied without editing their contents.

Routing is emitted through Vercel Build Output API version 3. Legacy standalone
301 rules are derived from `.htaccess`; that file remains authoritative for the
still-live Hostinger site. No broad language redirects are added.

## Production gate

A production build fails unless `LIENZO_ENABLE_VERCEL_PRODUCTION=1` is explicitly
set on that environment. Do not set it until the preview passes and backend
requirements are resolved. Do not promote the preview as an already-verified
production build: production must be built and verified in its own environment.

Before moving the web domain, recheck the current DNS zone and save a reversible
snapshot. Preserve MX, SPF, DKIM, DMARC, Brevo verification and other verification
records. Obtain project-specific domain targets from Vercel. Preserve the old
agpublicista.com permanent redirects for incoming links and SEO migration.

Rollback: keep the existing Hostinger site and its current web DNS targets intact
until the new production site passes. If cutover fails, restore only web targets
from that snapshot; do not reset the zone or email records.

## Access controller and Brevo: next stage

The PHP access controller currently expects durable SQLite state, a private
encrypted mail queue and atomic limits. Local serverless files are not a shared
durable database. Port the controller to an appropriate Vercel backend with
transactional external storage before opening access. Preserve invitation-only
access, generic anti-enumeration responses, one-time codes, attempts/expiry,
encryption, atomic daily limits and the USD 5 lifetime Gemini pilot limit.

The user approved a separate Brevo key named `Lienzo Ads Studio - acceso`, with
30-day expiration, restricted Transactional Email `All` and every other resource
`None`. That provider scope also manages transactional templates/logs; it is not
a send-only permission. Create it only when its Vercel server-secret destination
and consumer are ready. Do not store it under the historical Hostinger directory
or expose it to static output, browser code, chat, screenshots or documentation.
No new live mail test or Gemini generation is part of this preview stage.
