import { email, requireThat } from './security.mjs';
export function renderAccessEmail(message) {
  requireThat(message && Object.keys(message).sort().join(',') === 'code,locale,to' &&
    ['es', 'en'].includes(message.locale) && /^[0-9]{8}$/.test(message.code), 'INVALID_ACCESS_EMAIL', 400);
  const to = email(message.to), en = message.locale === 'en';
  const title = en ? 'Your access code' : 'Tu código de acceso';
  const intro = en ? 'Use this code in the browser where you requested it.' : 'Usa este código en el navegador donde lo solicitaste.';
  const expiry = en ? 'Valid for 10 minutes. Do not share it.' : 'Válido durante 10 minutos. No lo compartas.';
  const ignore = en ? 'If you did not request this code, ignore this email.' : 'Si no solicitaste este código, ignora este correo.';
  const footer = en ? 'Private Ads Studio pilot access. This is not a newsletter subscription.' : 'Acceso al piloto privado de Ads Studio. Esto no es una suscripción al boletín.';
  return { to, subject: en ? 'Your Lienzo pilot access code' : 'Tu código de acceso al piloto de Lienzo',
    text: `${title}: ${message.code}\n${intro}\n${expiry}\n${ignore}\n${footer}`,
    html: `<!doctype html><html lang="${en ? 'en' : 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0a0a0f;color:#f4f4f6;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="520" cellspacing="0" cellpadding="0" style="width:100%;max-width:520px;border:1px solid #393944;border-radius:18px"><tr><td style="padding:28px"><img src="https://lienzo.tools/assets/email/lienzo-logo.png" width="160" alt="Lienzo" style="display:block;max-width:160px;height:auto;margin-bottom:28px"><h1 style="font-size:24px">${title}</h1><p style="font-size:16px;line-height:1.6">${intro}</p><p style="font-size:32px;letter-spacing:5px;font-weight:bold;color:#35d6c8">${message.code}</p><p style="font-size:14px;line-height:1.6">${expiry}</p><p style="font-size:14px;line-height:1.6;color:#c5c5cf">${ignore}</p><p style="border-top:1px solid #393944;padding-top:20px;font-size:12px;line-height:1.6;color:#c5c5cf">${footer}</p></td></tr></table></td></tr></table></body></html>` };
}
