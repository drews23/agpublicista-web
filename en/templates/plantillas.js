/* Una única ventana nativa para las tres demos; los ZIP son archivos reales. */
(() => {
  const dialog = document.querySelector('[data-preview-dialog]');
  const frame = dialog.querySelector('iframe');
  const title = dialog.querySelector('[data-preview-title]');
  const download = dialog.querySelector('[data-preview-download]');
  const full = dialog.querySelector('[data-preview-full]');
  const stage = dialog.querySelector('[data-preview-stage]');
  const loading = dialog.querySelector('[data-preview-loading]');
  const themeButton = dialog.querySelector('[data-preview-theme]');
  const allowed = new Set(['botones-cristal', 'botones-capas', 'carrusel-recursos']);
  let opener = null;
  let theme = 'dark';

  function syncTheme() {
    themeButton.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
    frame.contentWindow?.postMessage({ type: 'lienzo:theme', theme }, '*');
  }

  document.querySelectorAll('[data-preview]').forEach(link => {
    link.addEventListener('click', event => {
      if (!allowed.has(link.dataset.preview) || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      opener = link;
      const card = link.closest('.template');
      title.textContent = card.querySelector('h2').textContent;
      download.href = card.querySelector('[download]').href;
      download.download = card.querySelector('[download]').download;
      full.href = link.href;
      stage.dataset.view = 'desktop';
      dialog.querySelectorAll('[data-preview-view]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.previewView === 'desktop'));
      });
      theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      loading.hidden = false;
      frame.title = 'Interactive demo: ' + title.textContent;
      const previewUrl = new URL(link.href);
      previewUrl.searchParams.set('view', 'component');
      frame.src = previewUrl.href;
      document.documentElement.classList.add('preview-open');
      dialog.showModal();
    });
  });

  frame.addEventListener('load', () => {
    if (!dialog.open) return;
    loading.hidden = true;
    syncTheme();
  });
  themeButton.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    syncTheme();
  });
  window.addEventListener('message', event => {
    if (!dialog.open || event.source !== frame.contentWindow || event.data?.type !== 'lienzo:theme-changed') return;
    if (!['light', 'dark'].includes(event.data.theme)) return;
    theme = event.data.theme;
    themeButton.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  });
  dialog.querySelectorAll('[data-preview-view]').forEach(button => {
    button.addEventListener('click', () => {
      stage.dataset.view = button.dataset.previewView;
      dialog.querySelectorAll('[data-preview-view]').forEach(other => {
        other.setAttribute('aria-pressed', String(other === button));
      });
    });
  });
  dialog.querySelector('[data-preview-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('preview-open');
    frame.src = 'about:blank';
    opener?.focus();
  });
})();
