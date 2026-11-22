(() => {
  const panel = document.querySelector('[data-music-youtube]');
  if (!panel) return;
  const details = panel.querySelector('details');
  const target = panel.querySelector('[data-music-frame]');
  const control = panel.querySelector('[data-music-load]');
  const fullDemo = panel.querySelector('[data-music-demo]');
  const status = panel.querySelector('[data-music-status]');
  const clips = document.querySelectorAll('audio');
  const id = panel.dataset.videoId;
  if (window.self !== window.top) {
    control.hidden = true;
    fullDemo.hidden = false;
    return;
  }
  if (location.hash === '#youtube-music') details.open = true;
  function unload() { target.replaceChildren(); control.hidden = false; }
  control.addEventListener('click', () => {
    if (!/^https?:$/.test(location.protocol) || !/^[\w-]{11}$/.test(id)) {
      status.textContent = status.dataset.offline;
      return;
    }
    clips.forEach(clip => clip.pause());
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1';
    iframe.title = 'YouTube · Kimiko Ishizaka, Bach BWV 846';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    target.replaceChildren(iframe);
    status.textContent = '';
    control.hidden = true;
    iframe.focus();
  });
  details.addEventListener('toggle', () => { if (!details.open) unload(); });
  clips.forEach(clip => clip.addEventListener('play', unload));
})();
