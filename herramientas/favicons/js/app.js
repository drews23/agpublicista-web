/*
  Galería de favicons — lógica de la herramienta.
  Adaptación en español para agpublicista.com. La codificación de los
  data URIs vive en encode.js; los iconos, en favicons.js. El tema
  claro/oscuro y el toast global los gestiona /js/site.js.
*/
(() => {
  'use strict';

  const { fromSvg, linkTag } = window.FaviconURI;
  const T = window.FaviconTemplates;

  const CATEGORY_LABELS = {
    emoji: 'Emoji',
    shapes: 'Formas',
    gradient: 'Degradados',
    letters: 'Letras',
    dev: 'Código',
    nature: 'Naturaleza',
    pixel: 'Pixel art',
  };

  // Normaliza para buscar sin distinguir mayúsculas ni acentos.
  const fold = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const items = window.FAVICONS.map((item) => {
    const href = item.png ? item.png : fromSvg(item.svg);
    return {
      ...item,
      href,
      tag: linkTag(href),
      isRaster: Boolean(item.png),
      haystack: fold(`${item.name} ${item.tags} ${item.cat} ${CATEGORY_LABELS[item.cat] || ''}`),
    };
  });

  const byId = new Map(items.map((item) => [item.id, item]));

  const $ = (sel) => document.querySelector(sel);
  const grid = $('#grid');
  const chips = $('#chips');
  const search = $('#search');
  const empty = $('#empty');
  const sheet = $('#sheet');
  const backdrop = $('#sheet-backdrop');
  const pageFavicon = $('#page-favicon');

  let activeCat = 'all';
  let query = '';
  let flashTimer;
  let lastFocused = null;

  /* --- portapapeles y avisos ----------------------------------------- */

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('API de portapapeles no disponible');
    } catch {
      // Alternativa para contextos no seguros (incluye algunos file://).
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(scratch);
      scratch.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      scratch.remove();
      return ok;
    }
  }

  // Notificaciones con el toast global del sitio (/js/site.js).
  const notify = (message) => {
    if (typeof window.agpToast === 'function') {
      window.agpToast(message);
    }
  };

  function wearIt(href) {
    if (pageFavicon) pageFavicon.setAttribute('href', href);
  }

  async function copyFavicon(item, cardEl) {
    const ok = await copyText(item.tag);
    if (!ok) {
      notify('No se pudo copiar. Abre los detalles y copia el código manualmente.');
      return;
    }

    wearIt(item.href);
    notify(`«${item.name}» copiado. Pégalo en el <head> de tu página: esta pestaña ya lo estrena.`);

    if (cardEl) {
      clearTimeout(flashTimer);
      document.querySelectorAll('.card.is-copied').forEach((el) => el.classList.remove('is-copied'));
      cardEl.classList.add('is-copied');
      flashTimer = setTimeout(() => cardEl.classList.remove('is-copied'), 1100);
    }
  }

  /* --- galería -------------------------------------------------------- */

  function cardMarkup(item, index) {
    return `
      <div class="card" data-id="${item.id}" data-cat="${item.cat}" style="--i:${Math.min(index, 24)}">
        <div class="card__art">
          <img src="${item.href}" alt="" loading="lazy" width="56" height="56" />
        </div>
        <div class="card__label">
          <span class="card__name">${item.name}</span>
          <span class="card__cat">${CATEGORY_LABELS[item.cat] || item.cat}</span>
        </div>
        <button class="card__hit" type="button" data-action="copy">
          <span class="sr-only">Copiar la etiqueta link de ${item.name}</span>
        </button>
        <button class="card__info" type="button" data-action="details"
                aria-label="Ver detalles y código de ${item.name}" title="Detalles">&lt;/&gt;</button>
        <span class="card__flash">¡Copiado! &#10003;</span>
      </div>`;
  }

  function visibleItems() {
    return items.filter((item) => {
      const catOk = activeCat === 'all' || item.cat === activeCat;
      const queryOk = !query || item.haystack.includes(query);
      return catOk && queryOk;
    });
  }

  function render() {
    const list = visibleItems();
    grid.innerHTML = list.map(cardMarkup).join('');
    empty.hidden = list.length > 0;
  }

  function buildChips() {
    const counts = items.reduce((acc, item) => {
      acc[item.cat] = (acc[item.cat] || 0) + 1;
      return acc;
    }, {});

    const all = [['all', 'Todos', items.length]].concat(
      Object.keys(CATEGORY_LABELS)
        .filter((cat) => counts[cat])
        .map((cat) => [cat, CATEGORY_LABELS[cat], counts[cat]])
    );

    chips.innerHTML = all
      .map(
        ([cat, label, count]) => `
        <button class="chip" type="button" data-cat="${cat}"
                aria-pressed="${cat === activeCat}">
          ${label}<span class="chip__count">${count}</span>
        </button>`
      )
      .join('');
  }

  chips.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    activeCat = chip.dataset.cat;
    chips.querySelectorAll('.chip').forEach((el) => {
      el.setAttribute('aria-pressed', String(el.dataset.cat === activeCat));
    });
    render();
  });

  search.addEventListener('input', () => {
    query = fold(search.value.trim());
    render();
  });

  $('#clear-search').addEventListener('click', () => {
    search.value = '';
    query = '';
    activeCat = 'all';
    buildChips();
    render();
    search.focus();
  });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const card = button.closest('.card');
    const item = byId.get(card.dataset.id);
    if (!item) return;

    if (button.dataset.action === 'copy') {
      copyFavicon(item, card);
    } else {
      openSheet(item);
    }
  });

  /* --- ficha de detalle ----------------------------------------------- */

  const sheetImg = $('#sheet-img');
  const sheetCode = $('#sheet-code');
  const downloadLink = $('#download');
  let sheetItem = null;

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function highlight(href) {
    return (
      '<span class="t-punct">&lt;</span><span class="t-tag">link</span> ' +
      '<span class="t-attr">rel</span><span class="t-punct">=</span><span class="t-val">"icon"</span> ' +
      '<span class="t-attr">href</span><span class="t-punct">=</span>' +
      `<span class="t-val">"${escapeHtml(href)}"</span><span class="t-punct">&gt;</span>`
    );
  }

  function openSheet(item) {
    sheetItem = item;
    lastFocused = document.activeElement;

    $('#sheet-cat').textContent = CATEGORY_LABELS[item.cat] || item.cat;
    $('#sheet-title').textContent = item.name;
    sheetImg.src = item.href;
    sheetImg.dataset.pixelated = String(item.isRaster);
    $('#tabmock-img').src = item.href;
    $('#tabmock-title').textContent = item.name;

    sheet.querySelectorAll('.sizes img').forEach((img) => {
      img.src = item.href;
      img.dataset.pixelated = String(item.isRaster);
    });

    sheetCode.innerHTML = highlight(item.href);

    const bytes = new Blob([item.tag]).size;
    $('#sheet-bytes').textContent = `${bytes} bytes en total · ${
      item.isRaster ? 'PNG 16×16 en base64' : 'SVG en línea'
    } · sin peticiones HTTP adicionales`;

    downloadLink.href = item.href;
    downloadLink.setAttribute('download', `${item.id}.${item.isRaster ? 'png' : 'svg'}`);
    downloadLink.textContent = `Descargar .${item.isRaster ? 'png' : 'svg'}`;

    sheet.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('is-locked');
    $('#copy-tag').focus();
  }

  function closeSheet() {
    sheet.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocused) lastFocused.focus();
  }

  $('#sheet-close').addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);

  $('#copy-tag').addEventListener('click', async () => {
    if (!sheetItem) return;
    await copyFavicon(sheetItem, null);
  });

  $('#copy-href').addEventListener('click', async () => {
    if (!sheetItem) return;
    const ok = await copyText(sheetItem.href);
    notify(ok ? 'Data URI copiado (solo el valor del href).' : 'No se pudo copiar.');
  });

  sheet.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = sheet.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* --- constructores --------------------------------------------------- */

  const QUICK_EMOJI = ['🎯', '🐢', '🍩', '🪐', '🦖', '🎧', '🌵', '📌', '🫐', '🧊'];

  const emojiInput = $('#emoji-input');
  const emojiPreview = $('#emoji-preview');
  const monoInput = $('#mono-input');
  const monoBg = $('#mono-bg');
  const monoFg = $('#mono-fg');
  const monoPreview = $('#mono-preview');
  let monoShape = 'squircle';

  const escapeXml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Las banderas y los emoji de familia son varios puntos de código unidos,
  // así que tomamos el grafema completo y no un solo carácter.
  function firstGrapheme(str) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const [first] = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str);
      return first ? first.segment : '';
    }
    return [...str][0] || '';
  }

  const builders = {
    emoji() {
      const char = firstGrapheme(emojiInput.value.trim()) || '🎯';
      return fromSvg(T.emoji(escapeXml(char)));
    },
    mono() {
      const raw = monoInput.value.trim().slice(0, 2) || 'A';
      const letter = escapeXml(raw);
      const shapes = {
        squircle: `<rect width="100" height="100" rx="24" fill="${monoBg.value}"/>`,
        circle: `<circle cx="50" cy="50" r="50" fill="${monoBg.value}"/>`,
        square: `<rect width="100" height="100" fill="${monoBg.value}"/>`,
      };
      return fromSvg(T.monogram(letter, monoFg.value, shapes[monoShape], raw.length > 1 ? 44 : 58));
    },
  };

  function refreshBuilders() {
    emojiPreview.src = builders.emoji();
    monoPreview.src = builders.mono();
  }

  $('#emoji-quick').innerHTML = QUICK_EMOJI.map(
    (char) => `<button type="button" aria-label="Usar el emoji ${char}">${char}</button>`
  ).join('');

  $('#emoji-quick').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    emojiInput.value = button.textContent.trim();
    refreshBuilders();
  });

  $('#mono-shape').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-shape]');
    if (!button) return;
    monoShape = button.dataset.shape;
    $('#mono-shape')
      .querySelectorAll('button')
      .forEach((el) => el.classList.toggle('is-active', el === button));
    refreshBuilders();
  });

  [emojiInput, monoInput, monoBg, monoFg].forEach((el) =>
    el.addEventListener('input', refreshBuilders)
  );

  document.querySelectorAll('[data-copy-builder]').forEach((button) => {
    button.addEventListener('click', async () => {
      const href = builders[button.dataset.copyBuilder]();
      const ok = await copyText(linkTag(href));
      if (ok) wearIt(href);
      notify(
        ok
          ? 'Favicon copiado: una etiqueta, cero archivos, listo para pegar.'
          : 'No se pudo copiar. Intenta seleccionar el código manualmente.'
      );
    });
  });

  /* --- teclado --------------------------------------------------------- */

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!sheet.hidden) {
        closeSheet();
      } else if (document.activeElement === search && search.value) {
        search.value = '';
        query = '';
        render();
      }
      return;
    }

    const typingInField = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (event.key === '/' && !typingInField) {
      event.preventDefault();
      search.focus();
      search.select();
    }
  });

  /* --- arranque -------------------------------------------------------- */

  search.placeholder = `Busca entre ${items.length} favicons…`;
  buildChips();
  render();
  refreshBuilders();
})();
