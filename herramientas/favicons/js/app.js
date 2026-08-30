/*
  Galería de favicons — lógica de la herramienta.
  Adaptación en español para lienzo.tools. La codificación de los
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
    /* Colección 3D (ver cargar3D más abajo). Sus categorías van aparte de
       las de arriba: aquellas describen la TÉCNICA del favicon (emoji,
       pixel art, degradado) y estas el TEMA del dibujo. */
    diseno: 'Diseño 3D',
    tecnologia: 'Tecnología 3D',
    naturaleza: 'Naturaleza 3D',
    comida: 'Comida 3D',
    fiesta: 'Fiestas 3D',
    personas: 'Personas 3D',
    lugares: 'Lugares 3D',
    objetos: 'Objetos 3D',
    simbolos: 'Símbolos 3D',
  };

  // Normaliza para buscar sin distinguir mayúsculas ni acentos.
  const fold = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  let items = window.FAVICONS.map((item) => {
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

  /* --- colección 3D ---------------------------------------------------
     Los 60 favicons de favicons.js viven como marcado SVG dentro del JS y
     su data URI se calcula al arrancar. Con los 1720 iconos 3D eso sería
     un archivo de 17 MB bloqueando la carga, así que aquí el trato es otro:
     cada SVG es un archivo suelto en /iconos3d/, la galería sólo carga un
     manifiesto de 186 KB con nombre + categoría + etiquetas, y el data URI
     se construye al vuelo cuando el visitante copia uno concreto.

     Consecuencia asumida: los 60 originales siguen pre-renderizados en el
     HTML y se ven sin JavaScript; la colección 3D necesita JS. Si el
     manifiesto no llega, la galería sigue funcionando con sus 60. */

  const RUTA_3D = '/herramientas/favicons/iconos3d';
  let cargando3D = null;

  function cargar3D() {
    if (cargando3D) return cargando3D;
    cargando3D = fetch('/herramientas/favicons/js/iconos3d.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((lista) => {
        const nuevos = lista.map((it) => ({
          id: it.h,
          name: it.n,
          cat: it.c,
          tags: it.t,
          href: `${RUTA_3D}/${it.h}.svg`,
          es3d: true,
          isRaster: false,
          haystack: fold(`${it.n} ${it.t} ${it.c} ${CATEGORY_LABELS[it.c] || ''}`),
        }));
        items = items.concat(nuevos);
        nuevos.forEach((it) => byId.set(it.id, it));
        search.placeholder = `Busca entre ${items.length} favicons…`;
        buildChips();
        return true;
      })
      .catch(() => false);
    return cargando3D;
  }

  /* El <link> de un icono 3D se arma la primera vez que hace falta: se trae
     el SVG del disco y se codifica igual que los originales. Se memoriza en
     el propio item para no repetir la petición. */
  async function tagDe(item) {
    if (item.tag) return item.tag;
    const res = await fetch(item.href);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    item.dataUri = fromSvg(await res.text());
    item.tag = linkTag(item.dataUri);
    return item.tag;
  }

  async function copyFavicon(item, cardEl) {
    let etiqueta;
    try {
      etiqueta = await tagDe(item);
    } catch {
      notify('No se pudo leer el icono. Recarga la página e inténtalo otra vez.');
      return;
    }
    const ok = await copyText(etiqueta);
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

  /* Render por tandas: con la colección 3D cargada la lista llega a 1780
     items, y volcarlos de una sola vez son 1780 nodos y ~700 KB de HTML
     parseados en el hilo principal. Se pintan de a TANDA y el resto entra
     cuando el centinela del final se asoma al viewport. */
  const TANDA = 120;
  let pendientes = [];
  let centinela = null;
  let vigia = null;

  function pintarTanda() {
    if (!pendientes.length) {
      if (centinela) centinela.remove();
      centinela = null;
      return;
    }
    const lote = pendientes.splice(0, TANDA);
    const base = grid.querySelectorAll('.card').length;
    grid.insertAdjacentHTML(
      'beforeend',
      lote.map((item, i) => cardMarkup(item, base + i)).join('')
    );
    if (pendientes.length) {
      if (!centinela) {
        centinela = document.createElement('div');
        centinela.className = 'grid__centinela';
        centinela.setAttribute('aria-hidden', 'true');
      }
      grid.append(centinela);
      if (!vigia) {
        vigia = new IntersectionObserver(
          (entradas) => {
            if (entradas.some((e) => e.isIntersecting)) pintarTanda();
          },
          { rootMargin: '600px' }
        );
      }
      vigia.observe(centinela);
    } else if (centinela) {
      centinela.remove();
      centinela = null;
    }
  }

  function render() {
    const list = visibleItems();
    if (vigia) vigia.disconnect();
    if (centinela) centinela.remove();
    centinela = null;
    grid.innerHTML = '';
    pendientes = list.slice();
    pintarTanda();
    empty.hidden = list.length > 0;
  }

  // Las 60 tarjetas ya llegan escritas en el HTML (scripts/generar-favicons.mjs):
  // si site.js nunca corre, la galería sigue completa y visible. render()
  // sólo reescribe el grid cuando el visitante de verdad filtra o busca;
  // en el estado inicial (todo, sin búsqueda) el marcado estático es la
  // fuente de verdad y no hay que tocarlo.
  function renderSiCambio() {
    if (activeCat === 'all' && !query) return;
    render();
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

  async function openSheet(item) {
    sheetItem = item;
    lastFocused = document.activeElement;

    /* Un icono 3D llega con la RUTA de su archivo, no con el data URI: la
       ficha muestra el código que se copia, así que hay que resolverlo
       antes de pintarla. */
    if (item.es3d && !item.tag) {
      try {
        await tagDe(item);
      } catch {
        notify('No se pudo leer el icono.');
        return;
      }
    }
    const codigoHref = item.dataUri || item.href;

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

    sheetCode.innerHTML = highlight(codigoHref);

    const bytes = new Blob([item.tag]).size;
    $('#sheet-bytes').textContent = `${bytes} bytes en total · ${
      item.isRaster ? 'PNG 16×16 en base64' : 'SVG en línea'
    } · sin peticiones HTTP adicionales`;

    downloadLink.href = item.href;
    downloadLink.setAttribute(
      'download',
      `${item.es3d ? fold(item.name).replace(/[^a-z0-9]+/g, '-') : item.id}.${item.isRaster ? 'png' : 'svg'}`
    );
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
    const ok = await copyText(sheetItem.dataUri || sheetItem.href);
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
  renderSiCambio();
  refreshBuilders();

  /* La colección 3D entra DESPUÉS del primer pintado: las 60 tarjetas
     estáticas ya están a la vista y el manifiesto (186 KB) no bloquea nada.
     Al llegar, buildChips() se rehace con las categorías nuevas. */
  const arrancar3D = () => cargar3D();
  if ('requestIdleCallback' in window) {
    requestIdleCallback(arrancar3D, { timeout: 2500 });
  } else {
    setTimeout(arrancar3D, 400);
  }
})();
