import { requireThat, equal } from './security.mjs';
import { renderAccessEmail } from './email.mjs';

export function makeBrevoSender({ enabled = false, apiKey, fetchImpl = fetch }) {
  requireThat(enabled && typeof apiKey === 'string' && apiKey.length >= 20 && apiKey.length <= 512 &&
    !/[\r\n]/.test(apiKey), 'MAIL_NOT_CONFIGURED', 503);
  return async message => {
    const mail = renderAccessEmail(message);
    try {
      const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ sender: { name: 'Lienzo', email: 'contacto@lienzo.tools' },
          to: [{ email: mail.to }], subject: mail.subject, textContent: mail.text,
          htmlContent: mail.html, removeTrackingPixel: true }),
      });
      let length = 0; const chunks = [];
      if (response.body) for await (const chunk of response.body) {
        length += chunk.byteLength; requireThat(length <= 4096, 'MAIL_RESPONSE_TOO_LARGE', 502); chunks.push(chunk);
      }
      if (response.status === 201) {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        requireThat(typeof value.messageId === 'string' && /^[A-Za-z0-9<>@_.:+\/-]{1,254}$/.test(value.messageId), 'INVALID_MAIL_RECEIPT', 502);
        return { state: 'accepted', messageId: value.messageId };
      }
      return { state: response.status >= 400 && response.status < 500 && response.status !== 408 ? 'failed' : 'uncertain', messageId: null };
    } catch { return { state: 'uncertain', messageId: null }; }
  };
}
export async function runWorker({ store, sender, authorization, secret, method }) {
  requireThat(method === 'GET' || method === 'POST', 'METHOD_NOT_ALLOWED', 405);
  requireThat(typeof secret === 'string' && secret.length >= 32 && secret.length <= 256 &&
    typeof sender === 'function' && equal(authorization, 'Bearer ' + secret), 'WORKER_ACCESS_REQUIRED', 403);
  const states = []; const started = Date.now();
  for (let i = 0; i < 3 && Date.now() - started < 30000; i++) {
    const result = await store.runMail(sender); if (result.state === 'empty') break;
    states.push(result.state);
  }
  return { processed: states.length, states };
}
