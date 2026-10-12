/* A manual carousel: no timer, duplicate slides, or automatic movement. */
(() => {
  'use strict';
  document.querySelectorAll('[data-discovery]').forEach(root => {
    const track = root.querySelector('[data-discovery-track]');
    const controls = root.querySelector('[data-discovery-controls]');
    const previous = root.querySelector('[data-discovery-previous]');
    const next = root.querySelector('[data-discovery-next]');
    if (!track || !controls || !previous || !next) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    controls.hidden = false;
    track.tabIndex = 0;
    const update = () => {
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    };
    const move = direction => {
      const card = track.firstElementChild;
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({left: direction * (card.getBoundingClientRect().width + gap), behavior: reduced.matches ? 'instant' : 'smooth'});
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    let pointer = null;
    let dragged = false;
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointer = {id: event.pointerId, x: event.clientX, left: track.scrollLeft};
      dragged = false;
    });
    track.addEventListener('pointermove', event => {
      if (!pointer) return;
      const distance = event.clientX - pointer.x;
      if (Math.abs(distance) > 6 && !dragged) {
        dragged = true;
        track.setPointerCapture(pointer.id);
        track.classList.add('is-dragging');
      }
      if (dragged) track.scrollLeft = pointer.left - distance;
    });
    const release = () => {
      if (pointer && track.hasPointerCapture(pointer.id)) track.releasePointerCapture(pointer.id);
      pointer = null;
      track.classList.remove('is-dragging');
      setTimeout(() => { dragged = false; }, 0);
    };
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    track.addEventListener('lostpointercapture', release);
    track.addEventListener('dragstart', event => event.preventDefault());
    track.addEventListener('click', event => {
      if (!dragged || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    track.addEventListener('keydown', event => {
      // Do not capture keys used by links or controls inside a card.
      if (event.target !== track || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') move(-1);
      else if (event.key === 'ArrowRight') move(1);
      else track.scrollTo({left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reduced.matches ? 'instant' : 'smooth'});
    });
    // Keep focused links visible without changing focus or the document's position.
    track.addEventListener('focusin', event => {
      const card = event.target.closest('[data-discovery-card]');
      if (!card) return;
      const viewport = track.getBoundingClientRect();
      const bounds = card.getBoundingClientRect();
      if (bounds.left < viewport.left) track.scrollBy({left: bounds.left - viewport.left, behavior: 'instant'});
      else if (bounds.right > viewport.right) track.scrollBy({left: bounds.right - viewport.right, behavior: 'instant'});
    });
    track.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update, {passive: true});
    update();
  });
})();
