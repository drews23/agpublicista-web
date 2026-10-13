# Resource details: Spanish and English

The four reviewed articles have a short resource summary before their first preview. It identifies the contents, archive and editable format, requirements, and shortcuts to preview, download, and usage terms.

Run `python scripts/resource_details.py` after regenerating those articles. This narrow pass preserves the rest of each document. It is also called by the English resource builder and finalizer. Do not run broad English generators merely to refresh these summaries: those generators own other pages and may require the existing navigation and discovery final passes afterward.

The summary deliberately does not promise a minimum After Effects version, a plugin-free project, or unverified audio specifications. Spanish text animations retain their RAR download; the independent English project uses its English ZIP. Both transition articles retain the original 16-WAV RAR.

English template destinations and accessible names are maintained in `build-english-templates.py`. After changing a demo, rebuild its corresponding English ZIP and update the download query version in `en/templates/index.html`. ZIP entries use fixed metadata so unchanged contents produce reproducible archives. Do not replace the Spanish demos or archives.

Local verification for this tranche is in `output/resource-details-2026-10-12/`: structural comparisons against HEAD, ZIP CRC and demo equivalence, responsive observations, and screenshots. These checks do not represent production publication or verification of the externally hosted MediaFire archives.
