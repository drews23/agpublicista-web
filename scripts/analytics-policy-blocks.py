"""Maintain the same reviewed analytics disclosure in ES/EN policies and EN sources."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
ES='''<!-- lienzo-analytics-policy:start -->
<section id="analytics" aria-labelledby="analytics-title"><h2 id="analytics-title">Analítica opcional de Lienzo</h2>
<p>Actualización de esta sección: 28 de octubre de 2026. Solo si aceptas la analítica, utilizamos Google Analytics 4 para conocer las páginas visitadas y acciones como abrir una vista previa, preparar una exportación o pulsar una descarga. Un clic no confirma que el archivo se haya guardado. La aceptación de una solicitud al boletín tampoco equivale a la suscripción confirmada, que se gestiona en Brevo.</p>
<p>La etiqueta analítica permanece bloqueada hasta tu permiso. Puedes rechazarla y seguir utilizando las herramientas. Desde <strong>Preferencias de analítica</strong>, en el pie, puedes cambiar tu elección. Esta preferencia es independiente del consentimiento publicitario de Google y de la autorización para recibir el boletín.</p>
<p>Los eventos incluyen la ruta pública de la página, idioma, identificadores del recurso o herramienta y formato de salida cuando corresponda. No enviamos tus archivos, su nombre, el texto que escribes, contenido del QR, contraseñas Wi-Fi, contactos, correo del formulario ni perfil de Mi Lienzo a Analytics. Se omiten los parámetros y fragmentos de la URL; solo se incorporan valores de campaña revisados y determinados orígenes de referencia sin su ruta.</p>
<p>Google recibe información técnica de la conexión al cargar y utilizar la etiqueta autorizada, como dirección IP y navegador, y aplica sus condiciones de tratamiento. Consulta <a href="https://policies.google.com/privacy" rel="noopener" target="_blank">la política de privacidad de Google</a>. Esta integración no habilita Google Signals, User-ID ni personalización publicitaria.</p>
<p>Guardamos tu decisión en <code>lienzo-analytics-consent</code>, en localStorage, durante un máximo de 180 días. Si permites la medición, las cookies analíticas se configuran con el prefijo <code>lienzo</code> y una duración máxima de 180 días, sin renovación automática por cada visita. Al retirar el permiso, se bloquean nuevos eventos y se eliminan las cookies analíticas propias accesibles para este dominio. Retirar el permiso no elimina automáticamente datos ya recibidos por Google; para solicitudes sobre esos datos, escribe a <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a>.</p>
</section>
<!-- lienzo-analytics-policy:end -->'''
EN='''<!-- lienzo-analytics-policy:start -->
<section id="analytics" aria-labelledby="analytics-title"><h2 id="analytics-title">Optional Lienzo analytics</h2>
<p>This section was updated on October 28, 2026. Only if you allow analytics, we use Google Analytics 4 to understand page visits and actions such as opening a preview, preparing an export, or clicking a download. A click does not confirm that a file was saved. An accepted newsletter request is not a confirmed subscription; Brevo manages confirmation.</p>
<p>The analytics tag stays blocked until you give permission. You can decline and continue using the tools. Use <strong>Analytics preferences</strong> in the footer to change your choice. This preference is separate from Google's advertising consent and your permission to receive the newsletter.</p>
<p>Events include the public page path, language, resource or tool identifiers, and output format where applicable. We do not send your files, filenames, typed text, QR contents, Wi-Fi passwords, contact details, form email address, or My Lienzo profile to Analytics. URL queries and fragments are omitted; only reviewed campaign values and selected referral origins without their paths are included.</p>
<p>Google receives technical connection information when the authorized tag loads and operates, such as IP address and browser information, under its processing terms. Read <a href="https://policies.google.com/privacy" rel="noopener" target="_blank">Google's privacy policy</a>. This integration does not enable Google Signals, User-ID, or advertising personalization.</p>
<p>We store your choice in the <code>lienzo-analytics-consent</code> localStorage key for up to 180 days. If you allow measurement, analytics cookies use the <code>lienzo</code> prefix and a maximum duration of 180 days, without extending their expiry on each visit. Withdrawing permission blocks new events and removes this integration's accessible analytics cookies for this domain. Withdrawal does not automatically delete data Google has already received; contact <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a> about those requests.</p>
</section>
<!-- lienzo-analytics-policy:end -->'''

targets=[('privacidad/index.html',ES,'Publicidad'),('cookies/index.html',ES,'Consentimiento en'),
 ('en/privacy/index.html',EN,'Advertising'),('en/cookies/index.html',EN,'Consent in'),
 ('scripts/english-content/privacy.html',EN,'Advertising'),('scripts/english-content/cookies.html',EN,'Consent in')]
for relative,block,heading in targets:
    path=ROOT/relative
    source=path.read_text(encoding='utf-8')
    marker=r'<!-- lienzo-analytics-policy:start -->.*?<!-- lienzo-analytics-policy:end -->\s*'
    source=re.sub(marker,'',source,flags=re.S)
    match=re.search(r'<h2\b[^>]*>'+re.escape(heading),source)
    if not match:raise ValueError(f'Insertion point missing: {relative}')
    updated=source[:match.start()]+block+'\n'+source[match.start():]
    # Preserve the original effective date; only the revision date is refreshed.
    if relative.startswith(('en/','scripts/english-content/')):
        updated=re.sub(r'<p class="page-date">.*?</p>',
                       '<p class="page-date">Updated: <time datetime="2026-10-28">October 28, 2026</time>.</p>',updated,count=1,flags=re.S)
    if updated!=path.read_text(encoding='utf-8'):path.write_text(updated,encoding='utf-8',newline='\n')
