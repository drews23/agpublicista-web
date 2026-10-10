/* English scene previews connect to Spline only after an explicit click. */
(() => {
  document.querySelectorAll('[data-scene-load]').forEach(load => {
    const figure = load.closest('figure');
    const stage = figure.querySelector('.english-scene-stage');
    const stop = figure.querySelector('[data-scene-stop]');
    const status = figure.querySelector('[role="status"]');
    const image = stage.querySelector('img');
    let frame = null;
    const resize = () => {
      if (frame) frame.style.transform = `scale(${stage.clientWidth / 1200})`;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    load.addEventListener('click', () => {
      if (frame) return;
      frame = document.createElement('iframe');
      frame.src = load.dataset.sceneLoad;
      frame.title = `Interactive 3D scene: ${load.dataset.sceneName}`;
      frame.allow = 'fullscreen; xr-spatial-tracking';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      stage.append(frame);
      image.hidden = true;
      resize();
      load.disabled = true;
      stop.disabled = false;
      status.textContent = 'Scene requested from Spline. Loading depends on your connection and device.';
      stop.focus();
    });
    stop.addEventListener('click', () => {
      frame?.remove();
      frame = null;
      image.hidden = false;
      load.disabled = false;
      stop.disabled = true;
      status.textContent = 'Player removed. Static preview restored.';
      load.focus();
    });
  });
})();
