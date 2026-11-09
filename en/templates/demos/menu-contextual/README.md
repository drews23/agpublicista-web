# Context Menu for Cards · Lienzo

Use this HTML, CSS, and JavaScript component to group the actions for each card in a catalog, portfolio, or library under a ⋯ button. The demo includes three Lienzo cards with working links. Adapt the cards and their actions to the site where you use the component.

## Explore and organize

Select Try the menu or use a card’s ⋯ button. For example, save CSS Gradients and switch to Favorites to see it there. You can also open a card’s menu by right-clicking it or pressing Shift + F10.

Choose Edit card to open Image or icon. Pick a preset illustration or icon, or upload a PNG, JPG, or WebP image up to 8 MB. Image changes apply right away. Remove your image to return to the preset. In Text and Link and color, select Apply to save the fields. Hide the panel to return to the same card’s draft fields later.

The menu can expand a preview, edit content, duplicate, save or remove a favorite, choose one of the three logo accents, and remove a resource with undo. The collection supports six visible resources. When it is full, remove one before undoing a removal. History, filters, and view preferences are kept in an exported HTML file; reloading the hosted demo starts a new session.

Search titles, descriptions, and categories. Press / to focus search when you are not typing in a form. Switch between all/favorites and grid/list. The browser processes the images you choose and embeds them in the exports.

## Keyboard and accessibility

Tab moves through controls. On a card’s main button, left/right and Home/End move focus through the collection without changing the selection. In the menu, up/down and Home/End move focus; typing letters finds an action. Right opens the accent submenu; up/down moves through its choices. Left or Escape closes the submenu. Another Escape closes the menu and restores focus. Tab closes the menu and continues. The expanded view uses a native dialog with dismissal and focus restoration.

Decorative motion is limited to the card being interacted with and respects the Pause button, reduced-motion preferences, and studio pausing.

## Two different downloads

Open Export to choose a format.

- **Save JSON data** downloads the collection data for your own integration.
- **Download HTML** saves the entire edited studio. Keep the HTML beside the other files and the ZIP’s `assets/` folder.

Extract the ZIP and open `index.html`; no packages are required. Hosted demos use noindex; the ZIP omits that directive. HTTP(S) links are validated, text is inserted as text, and serialized JSON escapes `<`. Do not replace those safeguards with unsanitized HTML.

## Credits and licenses

Original Lienzo code and compositions, in collaboration with MD Estudio Creativo. Read `LICENSE-LIENZO.txt`, `SOURCE-NOTES.md`, and the Fraunces and Instrument Sans OFL notices in `assets/`. Visual references are documented separately; their code, images, brands, and dependencies are not included. Font files retain their own licenses.


## Stable editing workspace

Open Settings to keep the preview beside the form. Apply commits content changes; Cancel discards unapplied fields. Hiding Settings preserves those fields. Image and motion controls update immediately and are labeled separately. Keep editor-workspace.css and editor-workspace.js beside the HTML, including when using a downloaded edited HTML.


## Your brand

Choose your own three accent colors in Your brand. Optional surface/text colors and display/body fonts apply only to the reusable piece, while the authoring interface keeps Lienzo identity. Brand changes apply immediately and are independent of content Apply/Cancel. Local font uploads stay in the browser and are embedded in exported HTML. Use only fonts you have permission to distribute. Keep template-brand.css and template-brand.js beside full-studio HTML; individual scene/panel exports embed their current brand styles.
