/* Lienzo's own UI. Public Brevo form POST; never store an address or API key. */
(() => {
  'use strict';
  if (!window.fetch || !window.AbortController) return; // Native HTML fallback.
  const english = document.documentElement.lang.startsWith('en');
  const copy = english ? {
    pending: 'Sending your request…',
    accepted: 'Check your inbox. Click the link in Lienzo’s confirmation email to join. If you cannot find it, check your spam folder. You are not subscribed until you confirm.',
    rejected: 'Brevo could not accept this request. Check your email address and try again.',
    uncertain: 'We could not confirm the response. Check your inbox before trying again: the request may have reached Brevo. If needed, contact contacto@lienzo.tools.'
  } : {
    pending: 'Enviando tu solicitud…',
    accepted: 'Revisa tu correo. Pulsa el enlace del email de confirmación de Lienzo para entrar al boletín. Si no lo ves, comprueba la carpeta de spam. No estarás suscrito hasta confirmar.',
    rejected: 'Brevo no pudo aceptar la solicitud. Revisa tu correo electrónico e inténtalo de nuevo.',
    uncertain: 'No pudimos confirmar la respuesta. Revisa tu correo antes de volver a intentarlo: la solicitud puede haber llegado a Brevo. Si necesitas ayuda, escribe a contacto@lienzo.tools.'
  };
  document.querySelectorAll('.newsletter__form').forEach((form) => {
    const fields = form.querySelector('.newsletter__fields');
    const status = form.querySelector('[data-newsletter-status]');
    const button = form.querySelector('button[type="submit"] span');
    if (!fields || !status || !button) return;
    const original = button.textContent;
    let busy = false;
    let accepted = false;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy || accepted) return;
      if (!form.reportValidity()) return;
      if (form.elements.email_address_check.value) return;
      const action = new URL(form.action);
      if (action.protocol !== 'https:' || !/^[a-z0-9]+\.sibforms\.com$/.test(action.hostname) || !action.pathname.startsWith('/serve/')) return;
      const body = new URLSearchParams(new FormData(form));
      busy = true;
      fields.disabled = true;
      form.setAttribute('aria-busy', 'true');
      status.hidden = true;
      button.textContent = copy.pending;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      let message = copy.uncertain;
      try {
        const response = await fetch(action.href, {
          method: 'POST', body, mode: 'cors', credentials: 'omit',
          referrerPolicy: 'no-referrer', signal: controller.signal
        });
        const result = await response.json();
        if (response.ok && result.success === true) {
          accepted = true;
          fields.hidden = true;
          message = copy.accepted;
          try {
            window.LienzoAnalytics?.track('newsletter_request_accepted', {
              placement: location.pathname === '/' || location.pathname === '/en/' ? 'home' : 'newsletter'
            });
          } catch (_) { /* A measurement failure cannot undo an accepted request. */ }
        } else {
          message = copy.rejected;
        }
      } catch (_) {
        // No automatic native retry: a timeout/CORS error can follow acceptance.
      } finally {
        clearTimeout(timer);
        busy = false;
        form.removeAttribute('aria-busy');
        fields.disabled = false;
        button.textContent = original;
        status.dataset.state = accepted ? 'accepted' : 'error';
        status.textContent = message; // Provider HTML is never inserted.
        status.hidden = false;
        status.focus();
      }
    });
  });
})();
