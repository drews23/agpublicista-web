(() => {
  if (window.parent === window || new URLSearchParams(location.search).get('view') !== 'component') return;

  const page = document.documentElement;
  page.dataset.view = 'component';
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    const { type, theme } = event.data || {};
    if (type === 'lienzo:theme' && (theme === 'light' || theme === 'dark')) page.dataset.theme = theme;
  });
})();
