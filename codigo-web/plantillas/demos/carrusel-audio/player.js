(() => {
  'use strict';

  const panel = document.querySelector('[data-stack]');
  if (!panel) return;

  const q = (selector, base = panel) => base.querySelector(selector);
  const qa = (selector, base = panel) => Array.from(base.querySelectorAll(selector));
  const es = document.documentElement.lang.startsWith('es');
  const copy = es ? {
    play: 'Reproducir', pause: 'Pausar', local: 'Archivo local', favorite: 'Guardar en favoritos',
    unfavorite: 'Quitar de favoritos', added: 'Música añadida', artwork: 'Portada actualizada',
    invalidImage: 'Elige una imagen JPG, PNG, WebP o AVIF de hasta 10 MB.',
    invalidAudio: 'Elige archivos de audio válidos.', full: 'La lista admite hasta 25 pistas.',
    error: 'No se pudo reproducir esta pista. Comprueba el archivo o prueba otra.',
  } : {
    play: 'Play', pause: 'Pause', local: 'Local file', favorite: 'Add to favorites',
    unfavorite: 'Remove from favorites', added: 'Music added', artwork: 'Cover updated',
    invalidImage: 'Choose a JPG, PNG, WebP, or AVIF image up to 10 MB.',
    invalidAudio: 'Choose valid audio files.', full: 'The playlist holds up to 25 tracks.',
    error: 'This track could not play. Check the file or try another.',
  };

  const deck = q('[data-cover-deck]');
  const list = q('[data-playlist]');
  const audio = q('audio');
  const play = q('[data-play]');
  const seek = q('[data-seek]');
  const volume = q('[data-volume]');
  const elapsed = q('[data-elapsed]');
  const total = q('[data-total]');
  const credit = q('[data-credit-link]');
  const shuffle = q('[data-shuffle]');
  const feedback = q('[data-feedback]');
  const defaults = qa('[data-stack-track]').map((row) => ({
    id: row.dataset.stackTrack,
    row,
    cover: qa('[data-stack-cover]', deck).find((cover) => cover.dataset.stackCover === row.dataset.stackTrack),
    src: row.dataset.src,
    art: row.dataset.art,
    tone: row.dataset.tone,
    credit: row.dataset.credit,
    title: q('strong', row).textContent,
    artist: q('.stack-track-copy span', row).textContent,
    duration: q('.stack-duration', row).textContent,
  }));

  let tracks = defaults.map((track) => ({ ...track }));
  let current = 0;
  let serial = 0;
  let revision = 0;
  let drag = null;
  const localUrls = new Set();
  const favoritesKey = 'lienzo-cover-stack-favorites-v1';
  let favorites = new Set();

  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    if (Array.isArray(stored)) {
      favorites = new Set(stored.filter((id) => defaults.some((track) => track.id === id)));
    }
  } catch {
    // File previews and privacy modes can block localStorage.
  }

  function setFeedback(message = '') {
    feedback.hidden = !message;
    feedback.textContent = message;
  }

  function stamp(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const min = Math.floor(safe / 60);
    return min + ':' + String(safe % 60).padStart(2, '0');
  }

  function trackLength(track) {
    if (!/^\d+:\d{2}$/.test(track.duration)) return 0;
    const [min, sec] = track.duration.split(':').map(Number);
    return min * 60 + sec;
  }

  function syncTime() {
    const track = tracks[current];
    const duration = Number.isFinite(audio.duration) ? audio.duration : trackLength(track);
    const time = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    seek.disabled = duration <= 0;
    seek.max = String(Math.max(0, duration));
    seek.value = String(Math.min(time, duration));
    seek.setAttribute('aria-valuetext', stamp(time) + ' / ' + (duration ? stamp(duration) : '—'));
    elapsed.textContent = stamp(time);
    total.textContent = duration ? stamp(duration) : '—';
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      track.duration = stamp(audio.duration);
      q('.stack-duration', track.row).textContent = track.duration;
    }
  }

  function syncPlaying() {
    const playing = !audio.paused && !audio.ended;
    panel.toggleAttribute('data-playing', playing);
    const label = playing ? copy.pause : copy.play;
    play.setAttribute('aria-label', label);
    play.title = label;
  }

  function setArtwork(track) {
    q('img', track.row).src = track.art;
    q('img', track.cover).src = track.art;
  }

  function renderFavorites() {
    for (const track of tracks) {
      const button = q('[data-favorite]', track.row);
      const saved = favorites.has(track.id);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', (saved ? copy.unfavorite : copy.favorite) + ' · ' + track.title);
      q('span', button).textContent = saved ? '♥' : '♡';
    }
  }

  function renderSelection({ scroll = false } = {}) {
    const active = tracks[current];
    const count = tracks.length;
    tracks.forEach((track, index) => {
      const selected = index === current;
      track.row.toggleAttribute('data-current', selected);
      const control = q('[data-choose]', track.row);
      if (selected) control.setAttribute('aria-current', 'true');
      else control.removeAttribute('aria-current');

      let offset = index - current;
      if (Math.abs(offset) > count / 2) offset += offset > 0 ? -count : count;
      const spread = Math.abs(offset);
      track.cover.style.setProperty('--offset', String(Math.max(-2, Math.min(2, offset))));
      track.cover.style.setProperty('--spread', String(Math.min(2, spread)));
      track.cover.style.setProperty('--depth', String(5 - Math.min(5, spread)));
      track.cover.toggleAttribute('data-distant', spread > 2);
      track.cover.setAttribute('aria-hidden', String(!selected));
    });

    panel.style.setProperty('--stack-tone', active.tone);
    q('[data-atmosphere]').src = active.art;
    q('[data-now-art]').src = active.art;
    q('[data-current-title]').textContent = active.title;
    q('[data-current-artist]').textContent = active.artist;
    credit.hidden = !active.credit;
    if (active.credit) credit.href = active.credit;
    else credit.removeAttribute('href');

    q('[data-move="-1"]').disabled = current === 0;
    q('[data-move="1"]').disabled = current === count - 1;
    if (scroll) {
      const top = active.row.offsetTop - list.offsetTop;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (top + active.row.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = top + active.row.offsetHeight - list.clientHeight;
      }
    }
    syncTime();
    syncPlaying();
  }

  function start() {
    const token = ++revision;
    setFeedback();
    if (audio.ended) audio.currentTime = 0;
    audio.play().catch((error) => {
      if (token !== revision || error.name === 'AbortError') return;
      syncPlaying();
      setFeedback(copy.error);
    });
  }

  function toggle() {
    if (audio.paused || audio.ended) start();
    else {
      revision += 1;
      audio.pause();
    }
  }

  function select(index, continuePlaying = !audio.paused && !audio.ended) {
    if (index < 0 || index >= tracks.length || index === current) return;
    revision += 1;
    audio.pause();
    current = index;
    audio.src = tracks[current].src;
    setFeedback();
    renderSelection({ scroll: true });
    if (continuePlaying) start();
  }

  function relative(direction, continuing = !audio.paused && !audio.ended) {
    const count = tracks.length;
    if (count < 2) return;
    const offset = direction > 0 && shuffle.getAttribute('aria-pressed') === 'true'
      ? 1 + Math.floor(Math.random() * (count - 1))
      : direction;
    select((current + offset + count) % count, continuing);
  }

  function queueNodes() {
    list.replaceChildren(...tracks.map((track) => track.row));
    deck.replaceChildren(...tracks.map((track) => track.cover));
  }

  function storeFavorites() {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify([...favorites].filter(
        (id) => defaults.some((track) => track.id === id),
      )));
    } catch {
      // Favorites remain available in memory.
    }
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const row = button?.closest('[data-stack-track]');
    if (!row) return;
    const index = tracks.findIndex((track) => track.row === row);
    if (index < 0) return;

    if (button.hasAttribute('data-favorite')) {
      const { id } = tracks[index];
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      renderFavorites();
      storeFavorites();
    } else if (button.hasAttribute('data-choose')) {
      select(index);
    }
  });

  list.addEventListener('keydown', (event) => {
    if (!event.target.closest('[data-choose]')) return;
    const direction = ({ ArrowDown: 1, ArrowUp: -1 })[event.key];
    if (!direction) return;
    event.preventDefault();
    const row = event.target.closest('[data-stack-track]');
    const index = tracks.findIndex((track) => track.row === row);
    const target = (index + direction + tracks.length) % tracks.length;
    select(target);
    q('[data-choose]', tracks[target].row).focus({ preventScroll: true });
  });

  deck.addEventListener('keydown', (event) => {
    const direction = ({ ArrowLeft: -1, ArrowRight: 1 })[event.key];
    if (direction) {
      event.preventDefault();
      relative(direction);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(event.key === 'Home' ? 0 : tracks.length - 1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  });

  deck.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || tracks.length < 2) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    deck.setPointerCapture(event.pointerId);
    deck.setAttribute('data-dragging', '');
  });
  deck.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    deck.style.setProperty('--drag', Math.max(-90, Math.min(90, dx * .6)) + 'px');
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag = null;
    deck.removeAttribute('data-dragging');
    deck.style.removeProperty('--drag');
    if (event.type === 'pointerup' && Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy)) {
      relative(dx < 0 ? 1 : -1);
    }
  }
  deck.addEventListener('pointerup', endDrag);
  deck.addEventListener('pointercancel', endDrag);
  deck.addEventListener('lostpointercapture', endDrag);

  play.addEventListener('click', toggle);
  q('[data-next]').addEventListener('click', () => relative(1));
  q('[data-previous]').addEventListener('click', () => {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else relative(-1);
  });
  shuffle.addEventListener('click', () => {
    shuffle.setAttribute('aria-pressed', String(shuffle.getAttribute('aria-pressed') !== 'true'));
  });

  seek.addEventListener('input', () => {
    audio.currentTime = Number(seek.value);
    syncTime();
  });
  volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
  audio.addEventListener('volumechange', () => { volume.value = String(audio.volume); });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked']) {
    audio.addEventListener(event, syncTime);
  }
  for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, syncPlaying);
  audio.addEventListener('ended', () => {
    if (!q('[data-continuous]').checked) return;
    if (current < tracks.length - 1 || shuffle.getAttribute('aria-pressed') === 'true') relative(1, true);
  });

  function addFiles(files) {
    const allowed = Array.from(files).filter((file) => file.size &&
      (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i.test(file.name)));
    if (!allowed.length) {
      setFeedback(copy.invalidAudio);
      return;
    }
    const remaining = Math.max(0, 25 - tracks.length);
    if (!remaining) {
      setFeedback(copy.full);
      return;
    }
    for (const file of allowed.slice(0, remaining)) {
      const id = 'local-' + (++serial);
      const source = defaults[(serial - 1) % defaults.length];
      const src = URL.createObjectURL(file);
      localUrls.add(src);
      const row = source.row.cloneNode(true);
      const cover = source.cover.cloneNode(true);
      const title = file.name.replace(/\.[^.]+$/, '');
      row.dataset.stackTrack = id;
      row.dataset.src = src;
      row.dataset.credit = '';
      cover.dataset.stackCover = id;
      q('strong', row).textContent = title;
      q('.stack-track-copy span', row).textContent = copy.local;
      q('.stack-duration', row).textContent = '—';
      q('strong', cover).textContent = title;
      q('figcaption span', cover).textContent = copy.local;
      const track = { id, src, row, cover, title, artist: copy.local, duration: '—',
        art: source.art, tone: source.tone, credit: '' };
      setArtwork(track);
      tracks.push(track);
    }
    queueNodes();
    renderSelection();
    renderFavorites();
    setFeedback(allowed.length > remaining ? copy.full : copy.added);
  }

  q('[data-add]').addEventListener('change', (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  });

  q('input[data-art]').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 10 * 1024 * 1024 || !file.size) {
      setFeedback(copy.invalidImage);
      return;
    }
    const track = tracks[current];
    const old = track.art;
    track.art = URL.createObjectURL(file);
    localUrls.add(track.art);
    setArtwork(track);
    renderSelection();
    if (localUrls.delete(old)) URL.revokeObjectURL(old);
    setFeedback(copy.artwork);
  });

  qa('[data-move]').forEach((button) => button.addEventListener('click', () => {
    const target = current + Number(button.dataset.move);
    if (target < 0 || target >= tracks.length) return;
    [tracks[current], tracks[target]] = [tracks[target], tracks[current]];
    current = target;
    queueNodes();
    renderSelection({ scroll: true });
  }));

  q('[data-reset]').addEventListener('click', () => {
    revision += 1;
    audio.pause();
    tracks = defaults.map((track) => ({ ...track }));
    current = 0;
    for (const id of [...favorites]) if (id.startsWith('local-')) favorites.delete(id);
    audio.src = tracks[0].src;
    queueNodes();
    tracks.forEach(setArtwork);
    renderSelection();
    renderFavorites();
    for (const url of localUrls) URL.revokeObjectURL(url);
    localUrls.clear();
    setFeedback();
  });

  audio.volume = Number(volume.value);
  renderSelection();
  renderFavorites();
  panel.setAttribute('data-ready', '');
})();
