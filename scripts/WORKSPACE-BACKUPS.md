# Workspace backup recovery

The Spanish and English engines retain independent storage keys and the v1 JSON schema. Both expose `validarRespaldo(text)` as a pure validation operation and `importar(text)` as a validated, single-write replacement. Validation covers profile, creations, stable creation kinds, IDs, bounded strings, known favorites, visit records, dates, flags, and size. A failed validation or storage write does not replace existing data. Unknown root fields are discarded; valid names and saved CSS are not translated or reformatted.

Both onboarding and dashboard controllers share a restore handler. Onboarding offers import without first creating a profile. Existing local data triggers a replacement confirmation after the file validates. Cancel returns without writing. Successful imports with a null profile return to onboarding. File input values reset after success, failure, or cancellation so the same file can be selected again.

Limits: 7,000,000 bytes at the file chooser, 7,000,000 text characters in the engine, 60 creations and 60 dates, 100,000 characters of CSS per creation. These are validation limits, not promises about available browser storage. Keep exporting before clearing site data.

English localization sources include the new recovery messages in code-translations.tsv and code-phrases.json. localize-english-code.cjs retains English storage isolation and no longer injects its earlier English-only importer: full validation now originates in the Spanish source and is maintained in both engines. Do not run broad site generators merely for this patch.

After changing an engine, update its content-hash query in existing HTML references. The English finalizer already computes English asset hashes; current Spanish references were updated without rebuilding documents. The recovery tranche changes script references in 151 tracked HTML files; their content is preserved. The two home pages also contain the separately authorized artwork restoration.

QA: output/backup-recovery-2026-10-13/qa-validation.cjs checks malformed structures, limits, pure validation, cross-language roundtrips, and storage failure using simulated storage. Browser restore tests use isolated origin 8784 and synthetic fixtures only. Production user data is not touched. Publishing requires the normal explicit commit/push authorization and production verification.

## QR/audio favorites and workspace messages

The ES and EN registries now include the stable IDs `qr` and `audio`, linking only to their principal localized tools. The original 16 IDs, storage keys, saved-code types and v1 backup schema remain unchanged. Opening either principal tool records a visit; favorites store navigation links, not QR payloads, audio files or tool settings. Variant pages are not new registry entries in this tranche.

Dashboard labels describe recorded visits rather than completed work. Favorite controls update both aria-pressed and their accessible action after a toggle. Spanish onboarding and editorial/FAQ messages scope local storage claims to My Lienzo, acknowledge access through the browser profile, explain deliberate ES/EN backup transfer, and remove the weekly publishing promise and old channel name. English copy and localization sources retain the same behavior and a localized explanation. Existing header, footer, canonical and alternate links are preserved.

QA and isolated browser evidence: output/workspace-favorites-2026-10-13/. Port 8785 uses synthetic profiles only. Engine checks cover persistence, removal, visit detection, v1 compatibility, no QR/audio creation saving and independent language storage. Previous backup validation checks also pass. Publishing this tranche requires a separate authorized commit/push and public verification.
