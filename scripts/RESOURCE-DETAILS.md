# Resource details: Spanish and English

The four reviewed articles have a short resource summary before their first preview. It identifies the contents, archive and editable format, requirements, and shortcuts to preview, download, and usage terms.

Run `python scripts/resource_details.py` after regenerating those articles. This narrow pass preserves the rest of each document. It is also called by the English resource builder and finalizer. Do not run broad English generators merely to refresh these summaries: those generators own other pages and may require the existing navigation and discovery final passes afterward.

The same pass maintains related-resource cards on all six reviewed pages, including both template collections. Their content is defined in `resource_related.py`: three recommendations per task with destinations in the current language. English article sources and the template builder preserve the same cards. The Spanish template introduction identifies the downloads as reusable UI pieces; the two Spanish article closings invite users to continue without promising a weekly release. Neither pass changes downloads, previews, licenses, metadata, or the rest of the guides.

Both template collections also receive three native anchor shortcuts before the grid. `template_shortcuts.py` maintains the localized labels and adds `tabindex="-1"` to existing cards so keyboard users can reach the chosen card and continue to its controls. These shortcuts work without JavaScript. The companion CSS preserves normal Fraunces spacing, visible focus, a target border, and clearance below the fixed header. Demos, ZIPs, and modal behavior remain independent of the shortcuts.

The summary deliberately does not promise a minimum After Effects version, a plugin-free project, or unverified audio specifications. Spanish text animations retain their RAR download; the independent English project uses its English ZIP. Both transition articles retain the original 16-WAV RAR.

English template destinations and accessible names are maintained in `build-english-templates.py`. After changing a demo, rebuild its corresponding English ZIP and update the download query version in `en/templates/index.html`. ZIP entries use fixed metadata so unchanged contents produce reproducible archives. Do not replace the Spanish demos or archives.

Local verification for this tranche is in `output/resource-details-2026-10-12/`: structural comparisons against HEAD, ZIP CRC and demo equivalence, responsive observations, and screenshots. These checks do not represent production publication or verification of the externally hosted MediaFire archives.

## QR formats and AI icon shortcuts (October 13, 2026)

The narrow pass also maintains summaries on both AI icon guides. The existing Spanish video and English style comparison remain the preview targets. Native fragment links focus the preview, download, and terms headings/sections. The inventory distinguishes 25 concepts from 75 SVG and 75 PNG files; the original ZIP and separate credits remain unchanged. The English source removes obsolete Spanish labels only for guides that already have English editions.

`qr_formats.py` adds six English format links before the main QR editor, with scoped `qr-formats.css`. The editor itself continues to handle text/links. The six dedicated pages, engines, export controls, and Spanish QR page remain unchanged. This enhancer runs from the narrow pass, the English tool builder, and the finalizer through `enhance_document`. No broad regeneration is needed.

## Remaining icon and Spline guides (October 13, 2026)

`resource_access.py`, called by `resource_details.py`, adds summaries to five additional icon packs and both Spline collections in each language (14 pages). Icons receive preview, contents, download, and usage shortcuts. Spline adds web integration; summaries distinguish editable `.spline` projects from preview images, live demos, HTML, and GLB exports. Only quantities and file types already described by the guides are restated; no minimum Spline version or export entitlement is invented.

Existing IDs remain valid. New targets use `data-resource-access-target`, `tabindex="-1"`, and scoped CSS for header clearance and visible focus. All original video, image, scene-player, download, and credit markup remains unchanged. Spanish weekly promises are replaced in these 14 guides only. Stale Spanish labels are corrected for existing English destinations; filenames and original Spanish credits are still identified as Spanish.

The narrow pass is idempotent, including after BeautifulSoup serialization. English icon sources and the resource builder preserve the update; the English guide builder now calls `enhance_document` before writing Spline guides. The English finalizer already applies it. No broad rebuild is needed for these edits. Evidence: `output/resource-access-2026-10-13/`.
