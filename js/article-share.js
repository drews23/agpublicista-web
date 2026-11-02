/* Lienzo article sharing: canonical URLs only; no SDKs, trackers or content inputs. */
(() => {
  'use strict';
  for (const root of document.querySelectorAll('[data-article-share]')) {
    if (root.dataset.shareReady) continue;
    root.dataset.shareReady = 'true';
    const en = root.lang.startsWith('en');
    const say = (es, english) => en ? english : es;
    const status = root.querySelector('[data-share-status]');
    const copy = root.querySelector('[data-share-copy]');
    const native = root.querySelector('[data-share-native]');
    const manual = root.querySelector('[data-share-manual]');
    const field = root.querySelector('[data-share-link]');
    let url;
    try {
      url = new URL(root.dataset.shareUrl);
      if (url.origin !== 'https://lienzo.tools' || !/^\/(?:en\/)?blog\/[a-z0-9-]+\/$/.test(url.pathname)) continue;
      url.search = ''; url.hash = '';
    } catch (_) { continue; }
    const payload = {title: root.dataset.shareTitle, text: root.dataset.shareText, url: url.href};
    const announce = text => { status.textContent = text; };
    function showManual() {
      manual.open = true;
      field.focus(); field.select();
      announce(say('Selecciona y copia este enlace para compartirlo.', 'Select and copy this link to share it.'));
    }
    field.addEventListener('click', () => field.select());
    copy.hidden = false;
    let copying = false;
    copy.addEventListener('click', async () => {
      if (copying) return;
      copying = true;
      try {
        if (!window.isSecureContext || !navigator.clipboard?.writeText) throw new Error('Manual copy');
        await navigator.clipboard.writeText(url.href);
        announce(say('Enlace copiado. Ya puedes compartirlo.', 'Link copied. Ready to share.'));
      } catch (_) { showManual(); }
      finally { copying = false; }
    });
    let permitted = true;
    try {
      const policy = document.permissionsPolicy || document.featurePolicy;
      if (policy?.allowsFeature) permitted = policy.allowsFeature('web-share');
    } catch (_) { /* Feature detection remains the final capability check. */ }
    if (window.isSecureContext && typeof navigator.share === 'function' && permitted) {
      native.hidden = false;
      let sharing = false;
      native.addEventListener('click', async () => {
        if (sharing) return;
        sharing = true;
        announce('');
        try {
          // Called directly from the gesture: do not await another operation first.
          await navigator.share(payload);
          // Resolution does not establish delivery. Do not display "sent" or log a conversion.
        } catch (error) {
          if (error?.name !== 'AbortError') {
            announce(say('No se pudo abrir el menú. Usa otra opción o copia el enlace.', 'Could not open the share menu. Use another option or copy the link.'));
          }
        } finally { sharing = false; }
      });
    }
  }
})();
