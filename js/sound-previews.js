(() => {
  const normalClick = (event) => !event.defaultPrevented && event.button === 0 &&
    !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;

  function setupDeck(deck) {
    const tracks = Array.from(deck.querySelectorAll('[data-sound-panel]'), (panel) => {
      const name = panel.querySelector('h3').textContent;
      const canvas = panel.querySelector('canvas');
      return {
        id: panel.dataset.soundPanel,
        name,
        panel,
        player: panel.querySelector('audio'),
        canvas,
        context: canvas.getContext('2d'),
        peaks: Array.from(canvas.dataset.wave, (value) => parseInt(value, 36) / 35),
        seeker: panel.querySelector('.sound-preview__seek'),
        button: panel.querySelector('.sound-preview__play'),
        mute: panel.querySelector('.sound-preview__mute'),
        elapsed: panel.querySelector('[data-elapsed]'),
        duration: panel.querySelector('[data-duration]'),
        error: panel.querySelector('.sound-preview__error'),
      };
    });

    if (!tracks.length || tracks.some((track) => !track.context)) return;

    const byId = new Map(tracks.map((track) => [track.id, track]));
    const bank = deck.querySelector('.sound-preview__bank');
    const choices = Array.from(bank?.querySelectorAll('a') ?? []);
    const announcement = deck.querySelector('[data-sound-announcement]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const english = document.documentElement.lang.startsWith('en');
    const seconds = new Intl.NumberFormat(english ? 'en-US' : 'es-CO', {
      maximumFractionDigits: 1,
    });
    let active;
    let frame = 0;
    let muted = false;

    function stopFrame() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function trackDuration(track) {
      return Number.isFinite(track.player.duration) && track.player.duration > 0 ?
        track.player.duration : Number(track.seeker.max);
    }

    function draw(track, updateDescription = false) {
      if (track !== active) return;
      const duration = trackDuration(track);
      const time = Math.min(track.player.currentTime, duration);
      const tenths = Math.floor(time * 10);
      const wholeSeconds = String(Math.floor(tenths / 10) % 60).padStart(2, '0');
      const display = Math.floor(tenths / 600) + ':' + wholeSeconds + (english ? '.' : ',') + tenths % 10;
      if (track.elapsed.textContent !== display) track.elapsed.textContent = display;
      track.seeker.value = String(time);
      if (updateDescription) {
        const between = english ? ' of ' : ' de ';
        track.seeker.setAttribute('aria-valuetext', seconds.format(time) + ' s' + between + seconds.format(duration) + ' s');
      }

      const { context, width, height, accent, peaks } = track;
      if (!width || !height) return;
      const progress = time / duration * width;
      const step = width / peaks.length;
      const barWidth = Math.max(1, step * .46);
      context.clearRect(0, 0, width, height);
      for (const [index, peak] of peaks.entries()) {
        const x = index * step + (step - barWidth) / 2;
        const size = Math.max(2, peak * (height - 14));
        context.globalAlpha = x <= progress && time > 0 ? 1 : .63;
        context.fillStyle = accent;
        context.fillRect(x, (height - size) / 2, barWidth, size);
      }
      context.globalAlpha = 1;
      if (time > 0) {
        const position = Math.min(width - 2, progress);
        context.fillStyle = '#fff';
        context.fillRect(position, 0, 2, height);
      }
    }

    function sizeWave() {
      const { canvas, context } = active;
      const scale = Math.min(2, window.devicePixelRatio || 1);
      active.width = canvas.clientWidth;
      active.height = canvas.clientHeight;
      canvas.width = Math.round(active.width * scale);
      canvas.height = Math.round(active.height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      active.accent = getComputedStyle(active.panel).getPropertyValue('--deck-accent').trim();
      draw(active, true);
    }

    function animate(track) {
      draw(track);
      if (track === active && !track.player.paused && !track.player.ended && !reducedMotion.matches) {
        frame = requestAnimationFrame(() => animate(track));
      } else {
        frame = 0;
      }
    }

    function select(track, announce = false) {
      if (!track || track === active) return;
      active?.player.pause();
      active?.panel.classList.remove('is-active');
      active?.panel.removeAttribute('data-animate');
      stopFrame();
      active = track;
      track.panel.classList.add('is-active');
      track.player.muted = muted;
      track.mute.toggleAttribute('data-muted', muted);
      track.mute.setAttribute('aria-label', muted ? track.mute.dataset.unmuteLabel : track.mute.dataset.muteLabel);
      if (announce) {
        track.panel.setAttribute('data-animate', '');
        announcement.textContent = track.name;
      }
      for (const choice of choices) {
        if (choice.hash.slice(1) === track.id) choice.setAttribute('aria-current', 'true');
        else choice.removeAttribute('aria-current');
      }
      sizeWave();
    }

    for (const track of tracks) {
      const { player, seeker, panel, button } = track;
      const updateButton = () => {
        const playing = !player.paused && !player.ended;
        panel.toggleAttribute('data-playing', playing);
        button.setAttribute('aria-label', (playing ? button.dataset.pauseLabel : button.dataset.playLabel) + ' · ' + track.name);
      };
      const showError = () => { track.error.hidden = false; };

      track.mute.addEventListener('click', () => {
        muted = !muted;
        player.muted = muted;
        track.mute.toggleAttribute('data-muted', muted);
        track.mute.setAttribute('aria-label', muted ? track.mute.dataset.unmuteLabel : track.mute.dataset.muteLabel);
      });

      button.addEventListener('click', () => {
        if (!player.paused && !player.ended) {
          player.pause();
          return;
        }
        track.error.hidden = true;
        player.play().catch((error) => {
          if (error.name !== 'AbortError') showError();
        });
      });

      seeker.addEventListener('input', () => {
        player.currentTime = Number(seeker.value);
        draw(track, true);
      });

      player.addEventListener('loadedmetadata', () => {
        const duration = trackDuration(track);
        seeker.max = String(duration);
        track.duration.textContent = seconds.format(duration) + ' s';
        draw(track, true);
      });
      player.addEventListener('timeupdate', () => draw(track, true));
      player.addEventListener('seeking', () => draw(track, true));
      player.addEventListener('play', updateButton);
      player.addEventListener('playing', () => {
        if (track === active && !frame) animate(track);
      });
      for (const event of ['pause', 'ended']) {
        player.addEventListener(event, () => {
          updateButton();
          if (track === active) stopFrame();
          draw(track, true);
        });
      }
      player.addEventListener('error', showError);
      player.querySelector('source').addEventListener('error', showError);
    }

    bank?.addEventListener('click', (event) => {
      const anchor = event.target.closest('.sound-preview__choice');
      const track = byId.get(anchor?.hash.slice(1));
      if (!track || !normalClick(event)) return;
      event.preventDefault();
      select(track, true);
    });

    bank?.addEventListener('keydown', (event) => {
      const index = choices.indexOf(event.target);
      if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
      const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };
      const offset = movement[event.key];
      if (!offset && event.key !== 'Home' && event.key !== 'End') return;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 :
        (index + offset + choices.length) % choices.length;
      event.preventDefault();
      if (next === index) return;
      const choice = choices[next];
      choice.focus();
      select(byId.get(choice.hash.slice(1)), true);
    });

    window.addEventListener('hashchange', () => select(byId.get(window.location.hash.slice(1))));
    reducedMotion.addEventListener('change', () => {
      stopFrame();
      if (active && !active.player.paused) animate(active);
    });

    deck.setAttribute('data-deck-ready', '');
    select(byId.get(window.location.hash.slice(1)) ?? tracks[0]);

    const resize = new ResizeObserver(sizeWave);
    resize.observe(deck.querySelector('.sound-preview__stage'));
  }

  const previews = document.querySelector('[data-sound-preview]');
  if (previews) setupDeck(previews);

  const demo = document.querySelector('[data-sound-demo]');
  if (!demo) return;

  const link = demo.querySelector('a');
  const frame = demo.querySelector('.sound-demo__frame');
  const template = demo.querySelector('template');
  link.addEventListener('click', (event) => {
    if (!frame.hidden || !normalClick(event)) return;

    const iframe = template.content.querySelector('iframe').cloneNode(true);
    const embed = new URL(iframe.src);
    embed.searchParams.set('autoplay', '1');
    iframe.src = embed.href;
    event.preventDefault();
    previews?.querySelectorAll('audio').forEach((player) => player.pause());
    frame.hidden = false;
    frame.append(iframe);
    link.textContent = link.dataset.externalLabel;
  });
})();
