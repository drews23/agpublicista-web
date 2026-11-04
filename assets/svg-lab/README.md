# Lienzo SVG Lab

Six SVGs selected from the existing Lienzo 3D icon library, created in collaboration
with MD Estudio Creativo. The library's credits and resource terms still apply;
these examples are not relicensed as MIT. See `LICENSE.txt`. SVGO retains its own
license in the existing vendor bundle. The previous geometric fixtures are kept
under their original MIT license in `scripts/fixtures/svg-lab/` for internal checks.

## Purpose

These are recognizable library icons for learning and regression checks. They do
not establish universal visual equivalence, security, accessibility, or savings.
They do not cover fonts, animation, external stylesheets, or JavaScript integrations.

| Fixture | What to inspect |
| --- | --- |
| `editor-cleanup.svg` | Isometric layers: edges, transparency, and depth. |
| `curves-precision.svg` | Bézier pen: the curve, control points, and pen tip. |
| `gradient-references.svg` | Dimensional cube: gradient references and volume. |
| `fine-strokes.svg` | Creative wand: star facets, highlights, and handle joins. |
| `responsive-viewbox.svg` | Creative rocket: framing, fins, and window. |
| `compact-icon.svg` | Light bulb: a source already optimized at precision 3. |

`cases.json` provides Spanish and English names/inspection notes, original source
paths, SHA-256 checksums, palette adaptations, and resource attribution.

Rebuild the selection with `python scripts/prepare-svg-lab.py`. The script adapts
only presentation colors. For the light bulb it additionally runs the existing
SVGO defaults at precision 3, so a second run may show zero savings. No artificial
padding or metadata is added to inflate savings. Library originals remain unchanged.

## Reproduce

Use `/herramientas/optimizar-svg/laboratorio/` or `/en/tools/svg-optimizer/lab/`
through a local HTTP server. The laboratory uses the repository's SVGO browser
bundle, not a downloaded dependency. At creation it reports SVGO 4.0.2.

Choose precision 0–8 and compare. The default is 3, with the optimizer's default
plugin list, multiple passes, and no indented formatting. The JSON report includes
the exact plugin order/options, source and output strings, UTF-8 byte counts, the
timestamp, the asset-set revision, source provenance, and artwork terms. Counts
exclude HTTP compression and request overhead.

Changing precision clears the old comparison and disables report downloads until
another comparison completes. A failed run also clears the report.

The HTML download is a standalone snapshot containing both drawings and settings.
It opens offline; it does not run SVGO again. Keep the JSON for reproducing the run.
Use the Enlarge control on a card to inspect larger previews; Escape or Close
comparison returns to the card. Visual review remains explicitly pending in exported reports. Inspect at real
usage sizes and inside the final consuming application before adopting an output.
