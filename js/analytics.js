/* Lienzo: optional analytics. Never read tool content, filenames or form values. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.mount(root, root.document);
})(typeof window === 'object' ? window : null, function () {
  'use strict';
  const ID = 'G-XLSVC67FTF';
  const KEY = 'lienzo-analytics-consent';
  const VERSION = 1;
  const MAX_AGE = 180 * 86400000;
  const STYLE_URL = '/css/analytics.css?v=4eac0b504c5a';
  const RESOURCES = new Set(['botones-cristal', 'botones-capas', 'carrusel-recursos',
    'laboratorio-3d', 'tarjetas-producto', 'iconos-animados', 'carrusel-progreso',
    'tarjetas-hover', 'escenas-css', 'galeria-expandible', 'menu-indicador',
    'menu-contextual', 'imagen-particulas', 'tarjeta-perfil']);
  const FORMATS = new Set(['wav16', 'wav24', 'opus', 'png', 'svg']);
  const EVENTS = new Set(['resource_preview_open', 'resource_download_click',
    'tool_export_ready', 'tool_download_click', 'newsletter_request_accepted']);
  const REFERRERS = new Set(['lienzo.tools', 'creativomarketingdigital.com', 'google.com',
    'www.google.com', 'bing.com', 'www.bing.com', 'duckduckgo.com', 'facebook.com',
    'www.facebook.com', 'm.facebook.com', 'l.facebook.com', 'instagram.com',
    'www.instagram.com', 'l.instagram.com', 'youtube.com', 'www.youtube.com',
    't.co', 'linkedin.com', 'www.linkedin.com', 'chatgpt.com']);

  function readChoice(raw, now = Date.now()) {
    try {
      const value = JSON.parse(raw);
      return value && value.version === VERSION && ['granted', 'denied'].includes(value.choice)
        && Number.isFinite(value.at) && value.at <= now && now - value.at < MAX_AGE
        ? value.choice : null;
    } catch (_) { return null; }
  }

  function contextFor(canonical, actual, referrer) {
    try {
      const page = new URL(canonical);
      const location = new URL(actual);
      if (page.origin !== 'https://lienzo.tools' || page.search || page.hash
        || !/^\/(?:[a-z0-9-]+\/)*$/.test(page.pathname)) return null;
      const language = page.pathname.startsWith('/en/') ? 'en' : 'es';
      let referral = '';
      try {
        const url = new URL(referrer);
        if (url.protocol === 'https:' && REFERRERS.has(url.hostname)) referral = url.origin + '/';
      } catch (_) { /* Unknown origins and referrer paths are deliberately omitted. */ }
      // Only reviewed campaign values. Never forward arbitrary queries or click IDs.
      const params = location.searchParams;
      const sources = new Set(['fb', 'ig', 'facebook', 'instagram', 'youtube', 'tiktok', 'newsletter']);
      const mediums = new Set(['paid_social', 'organic_social', 'social', 'email']);
      const campaigns = new Set(['lienzo_recursos_mx_piloto_202610', 'reel-marca']);
      const contents = new Set(['reel_minimalismo_45s']);
      const campaign = {};
      if (sources.has(params.get('utm_source')) && mediums.has(params.get('utm_medium'))
        && campaigns.has(params.get('utm_campaign'))) {
        campaign.campaign_source = params.get('utm_source');
        campaign.campaign_medium = params.get('utm_medium');
        campaign.campaign_name = params.get('utm_campaign');
        if (contents.has(params.get('utm_content'))) campaign.campaign_content = params.get('utm_content');
      }
      return { path: page.pathname, location: page.href, language, referral, campaign,
        live: location.origin === 'https://lienzo.tools' && location.pathname.replace(/index\.html$/, '') === page.pathname };
    } catch (_) { return null; }
  }

  function eventData(name, input = {}) {
    if (!EVENTS.has(name)) return null;
    if (name.startsWith('resource_')) {
      if (!RESOURCES.has(input.resource_id)) return null;
      return { resource_id: input.resource_id };
    }
    if (name.startsWith('tool_')) {
      if (!['audio-studio', 'qr'].includes(input.tool_id) || !FORMATS.has(input.format)) return null;
      if (input.tool_id === 'qr' && !['png', 'svg'].includes(input.format)) return null;
      if (input.tool_id === 'audio-studio' && !['wav16', 'wav24', 'opus'].includes(input.format)) return null;
      return { tool_id: input.tool_id, output_format: input.format };
    }
    return ['home', 'newsletter'].includes(input.placement) ? { placement: input.placement } : null;
  }

  function createController({ context, transport, storage, now = () => Date.now(), onChange = () => {} }) {
    let choice;
    let ready = false;
    let epoch = 0;
    let pageSent = false;
    function save(next) {
      try { storage.setItem(KEY, JSON.stringify({ version: VERSION, choice: next, at: now() })); }
      catch (_) { /* Choice still applies to this page when storage is unavailable. */ }
    }
    async function setConsent(next, persist = true) {
      if (!['granted', 'denied', null].includes(next)) return;
      if (persist && next) save(next);
      if (choice === next && (ready || next !== 'granted')) { onChange(status()); return; }
      choice = next;
      ready = false;
      const ticket = ++epoch;
      if (choice !== 'granted') {
        if (context.live) transport.stop();
        onChange(status());
        return;
      }
      onChange(status());
      if (!context.live) return;
      try {
        await transport.load();
        if (ticket !== epoch || choice !== 'granted') return;
        transport.configure(context);
        ready = true;
        if (!pageSent) {
          transport.send('page_view', { site_language: context.language });
          pageSent = true;
        }
      } catch (_) { ready = false; }
      onChange(status());
    }
    function track(name, input) {
      try {
        if (choice !== 'granted' || !ready || !context.live) return false;
        const data = eventData(name, input);
        if (!data) return false;
        transport.send(name, { ...data, site_language: context.language });
        return true;
      } catch (_) { return false; } // Measurement must never interrupt a tool.
    }
    function status() { return { choice, ready, live: context.live }; }
    function restore() {
      let stored = null;
      try { stored = readChoice(storage.getItem(KEY), now()); } catch (_) { /* Default denied. */ }
      return setConsent(stored, false);
    }
    return { setConsent, track, status, restore };
  }

  function makeTransport(win, doc) {
    let loading = null;
    let loaded = false;
    const layer = 'lienzoAnalyticsLayer';
    const tag = function () { win[layer].push(arguments); };
    const denied = { analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied' };
    function clearCookies() {
      const domains = ['', '; domain=lienzo.tools', '; domain=.lienzo.tools'];
      doc.cookie.split(';').forEach(part => {
        const name = part.split('=')[0].trim();
        if (!/^lienzo_ga(?:_|$)/.test(name)) return;
        domains.forEach(domain => { doc.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax; Secure'; });
      });
    }
    return {
      load() {
        if (loaded) return Promise.resolve();
        if (loading) return loading;
        win['ga-disable-' + ID] = true;
        win[layer] = win[layer] || [];
        tag('consent', 'default', denied);
        tag('js', new Date());
        loading = new Promise((resolve, reject) => {
          const script = doc.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID + '&l=' + layer;
          script.referrerPolicy = 'no-referrer';
          script.onload = () => { loaded = true; resolve(); };
          script.onerror = () => { script.remove(); loading = null; reject(new Error('Analytics unavailable')); };
          doc.head.append(script);
        });
        return loading;
      },
      configure(context) {
        win['ga-disable-' + ID] = false;
        tag('consent', 'update', { ...denied, analytics_storage: 'granted' });
        tag('config', ID, {
          send_page_view: false, allow_google_signals: false,
          allow_ad_personalization_signals: false, cookie_prefix: 'lienzo',
          cookie_expires: 15552000, cookie_update: false, cookie_flags: 'SameSite=Lax;Secure',
          page_location: context.location, page_referrer: context.referral,
          page_title: 'Lienzo | ' + context.language + ' | ' + context.path,
          ignore_referrer: !context.referral, ...context.campaign
        });
      },
      send(name, params) { tag('event', name, { ...params, send_to: ID }); },
      stop() {
        win['ga-disable-' + ID] = true;
        if (win[layer]) {
          win[layer].length = 0;
          if (loaded) tag('consent', 'update', denied);
        }
        clearCookies();
      }
    };
  }

  function mount(win, doc) {
    if (!doc || win.LienzoAnalytics) return;
    const canonical = doc.querySelector('link[rel="canonical"]')?.href;
    const context = contextFor(canonical, win.location.href, doc.referrer);
    if (!context || !doc.querySelector('.site-footer')) return;
    const en = context.language === 'en';
    const words = en ? {
      heading: 'Help shape a better Lienzo',
      body: 'With your permission, we measure page visits and use of resources. Your files and what you type stay out of analytics.',
      accept: 'Allow analytics', reject: 'Decline analytics', settings: 'Analytics preferences',
      privacy: 'Privacy details', saved: 'Analytics preference saved.', region: 'Optional analytics'
    } : {
      heading: 'Ayúdanos a mejorar Lienzo',
      body: 'Con tu permiso, medimos visitas y uso de recursos. Tus archivos y lo que escribes quedan fuera de la analítica.',
      accept: 'Aceptar analítica', reject: 'Rechazar analítica', settings: 'Preferencias de analítica',
      privacy: 'Detalles de privacidad', saved: 'Preferencia de analítica guardada.', region: 'Analítica opcional'
    };
    const style = doc.createElement('link');
    style.rel = 'stylesheet'; style.href = STYLE_URL; doc.head.append(style);
    const notice = doc.createElement('section');
    notice.className = 'analytics-notice'; notice.hidden = true;
    notice.setAttribute('aria-label', words.region);
    const heading = doc.createElement('h2'); heading.textContent = words.heading;
    const body = doc.createElement('p'); body.textContent = words.body;
    const buttons = doc.createElement('div'); buttons.className = 'analytics-notice__actions';
    const accept = doc.createElement('button'); accept.type = 'button'; accept.textContent = words.accept;
    const reject = doc.createElement('button'); reject.type = 'button'; reject.textContent = words.reject;
    accept.className = reject.className = 'btn';
    accept.dataset.analyticsChoice = 'granted'; reject.dataset.analyticsChoice = 'denied';
    const privacy = doc.createElement('a'); privacy.textContent = words.privacy;
    privacy.href = (en ? '/en/privacy/' : '/privacidad/') + '#analytics';
    buttons.append(accept, reject); notice.append(heading, body, buttons, privacy); doc.body.append(notice);
    const preferences = doc.createElement('button'); preferences.type = 'button';
    preferences.className = 'analytics-preferences'; preferences.textContent = words.settings;
    preferences.setAttribute('aria-expanded', 'false');
    const footer = doc.querySelector('.site-footer__bottom') || doc.querySelector('.site-footer');
    footer.append(preferences);
    const feedback = doc.createElement('span'); feedback.className = 'sr-only';
    feedback.setAttribute('role', 'status'); footer.append(feedback);
    let storage;
    try { storage = win.localStorage; } catch (_) { storage = { getItem: () => null, setItem() {} }; }
    const controller = createController({ context, storage, transport: makeTransport(win, doc),
      onChange(state) {
        notice.hidden = state.choice !== null;
        preferences.setAttribute('aria-expanded', String(!notice.hidden));
        accept.setAttribute('aria-pressed', String(state.choice === 'granted'));
        reject.setAttribute('aria-pressed', String(state.choice === 'denied'));
      }
    });
    function showPreferences() {
      notice.hidden = false; preferences.setAttribute('aria-expanded', 'true');
      accept.focus({ preventScroll: true });
    }
    win.LienzoAnalytics = { track: controller.track, showPreferences, status: controller.status };
    [accept, reject].forEach(button => button.addEventListener('click', () => {
      controller.setConsent(button.dataset.analyticsChoice);
      feedback.textContent = words.saved;
      preferences.focus({ preventScroll: true });
    }));
    preferences.addEventListener('click', showPreferences);
    notice.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      // Closing without a choice is equivalent to declining, never to accepting.
      if (!controller.status().choice) controller.setConsent('denied');
      notice.hidden = true; preferences.setAttribute('aria-expanded', 'false'); preferences.focus({ preventScroll: true });
    });
    win.addEventListener('storage', event => { if (event.key === KEY) controller.restore(); });
    doc.addEventListener('click', event => {
      const link = event.target.closest?.('a');
      if (!link || event.defaultPrevented && !link.dataset.preview) return;
      if (link.dataset.preview && doc.querySelector('[data-preview-dialog]')?.open) {
        controller.track('resource_preview_open', { resource_id: link.dataset.preview });
      } else if (link.hasAttribute('download')) {
        if (/^\/(?:en\/tools\/audio|herramientas\/audio)\/$/.test(context.path)
          && link.hasAttribute('data-download') && link.getAttribute('href')?.startsWith('blob:')) {
          controller.track('tool_download_click', { tool_id: 'audio-studio', format: doc.querySelector('[data-export-format]')?.value });
        } else {
          try {
            const url = new URL(link.href);
            const match = url.pathname.match(/^\/recursos\/descargas\/plantillas-web\/([a-z0-9-]+)-lienzo(?:-en)?\.zip$/);
            if (url.origin === 'https://lienzo.tools' && match) controller.track('resource_download_click', { resource_id: match[1] });
          } catch (_) { /* Non-resource links are outside this measurement contract. */ }
        }
      }
    });
    controller.restore();
  }
  return { contextFor, eventData, readChoice, createController, makeTransport, mount, ID, KEY };
});
