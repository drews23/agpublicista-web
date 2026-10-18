# Resource Desk and Context Menu · Lienzo

Original HTML, CSS, JavaScript, and SVG artwork. This is a sample collection with three resources, not a file manager for your operating system. Replace the names, descriptions, categories, links, and accents before integrating it into a real application.

## Explore and organize

Select a card to see its details in the inspector. Open its actions using the ⋯ button, a right-click on that card, or Shift + F10. Outside the cards, browser menus and shortcuts keep working normally. On touchscreens, use the ⋯ button.

The menu can expand a preview, edit content, duplicate, save or remove a favorite, choose one of the three logo accents, and remove a resource with undo. The collection supports six visible resources. When it is full, remove one before undoing a removal. History, filters, and view preferences are kept in an exported HTML file; reloading the hosted demo starts a new session.

Search titles, descriptions, and categories. Press / to focus search when you are not typing in a form. Switch between all/favorites and grid/list. Counts reflect actual sample items, not business metrics. There is no persistent storage, API, disk access, or external service.

## Keyboard and accessibility

Tab moves through controls. On a card’s main button, left/right and Home/End move focus through the collection without changing the selection. In the menu, up/down and Home/End move focus; typing letters finds an action. Right opens the accent submenu; up/down moves through its choices. Left or Escape closes the submenu. Another Escape closes the menu and restores focus. Tab closes the menu and continues. The expanded view uses a native dialog with dismissal and focus restoration.

Decorative motion is limited to the card being interacted with and respects Pause motion, reduced motion, and studio pausing. No JavaScript animation loop runs while idle. Frame rates depend on the browser and device and are not guaranteed.

## Two different downloads

- **Save JSON data** downloads only the collection data for your own integration. It does not contain the interface or install a resource manager.
- **Get HTML** saves the entire edited studio. Keep the HTML beside `studio.css`, `studio.js`, `component.css`, `component.js`, and the ZIP’s `assets/` folder. The HTML alone is not standalone.

Extract the ZIP and open `index.html`; no packages are required. Hosted demos use noindex; the ZIP omits that directive. HTTP(S) links are validated, text is inserted as text, and serialized JSON escapes `<`. Do not replace those safeguards with unsanitized HTML.

## Credits and licenses

Original Lienzo code and compositions, in collaboration with MD Estudio Creativo. Read `LICENSE-LIENZO.txt`, `SOURCE-NOTES.md`, and the Fraunces and Instrument Sans OFL notices in `assets/`. Visual references are documented separately; their code, images, brands, and dependencies are not included. Font files retain their own licenses.
