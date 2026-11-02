# Cierre para compartir las entradas

Alcance: las entradas individuales `/blog/<slug>/` y `/en/blog/<slug>/`. No añade bloques a índices, herramientas, demos o páginas legales.

```powershell
python -X utf8 scripts/article_share.py
```

Ejecutar después de editar títulos o regenerar artículos. Las versiones de CSS/JS se calculan desde sus hashes. El helper conserva el contenido, el SEO y los enlaces de descarga; sustituye solo los cierres antiguos de compartir y añade sus referencias de assets. Es idempotente.

Los generadores `build-english-pages.py`, `build-english-guides.py`, `build-english-resources.py` y el generador acotado `after_effects_text_scenes.py` llaman a `enhance_document`. Si se añade otro generador de artículos, debe usar ese mismo hook antes de escribir el HTML o ejecutar el comando al final. No copiar manualmente las URLs de compartir de otra entrada.

## Experiencia

- Texto en español e inglés y mensaje contextual para audio, iconos, After Effects, escenas 3D y guías.
- WhatsApp, Telegram, Facebook y correo como enlaces estáticos accesibles sin JavaScript.
- Copiar enlace se habilita al cargar el módulo. Solo copia la canónica de Lienzo, sin parámetros ni fragmentos.
- Si Clipboard API no existe o rechaza la operación, abre y enfoca el campo de copia manual. No informa «copiado» si la escritura falla.
- Más opciones aparece únicamente con contexto seguro, Navigator.share y política de permisos compatible. Su contenido depende del navegador y del sistema. No permite prometer que todas las aplicaciones instaladas aceptarán el mismo contenido.
- Cancelar el menú nativo no se trata como un error. Resolver la promesa tampoco se anuncia como entrega confirmada. No se añaden conversiones ni eventos de seguimiento.
- Facebook recibe la URL y usa los metadatos de la página. No se promete un mensaje preescrito que la plataforma pueda ignorar.
- El enlace manual permanece disponible sin JavaScript. Los botones no operativos se mantienen ocultos.

## Diseño y coste

`css/pages/article-share.css` usa los tokens de Lienzo y tiene estilos propios de foco, movimiento reducido, colores forzados, temas y distribución adaptable. Tipografía display con espaciado normal. Objetivos táctiles de al menos44px; botones de48px. No se cargan SDK, iframes, fuentes, iconos remotos, rastreadores ni dependencias para compartir.

`js/article-share.js` no lee archivos, formularios ni parámetros de navegación. La URL se valida contra `https://lienzo.tools` y las rutas individuales del blog.

## Corrección de cabecera encontrada en QA

La biblioteca de sonidos y la ficha de terror en español tenían dos accesos a Mi Lienzo, uno antiguo y otro con `data-espacio-btn`. Se retiró el duplicado al aplicar el actualizador de navegación únicamente a esas dos fichas. `build-primary-navigation.py` reconoce ahora ambos formatos antes de insertar el acceso único. No se cambió el CSS global ni el diseño del header.

## Referencias

- Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- Enlaces de Telegram: https://core.telegram.org/widgets/share

Pruebas y manifiesto del lote: `output/article-share-2026-11-02/`. Las pruebas del menú nativo simulan respuesta, cancelación, error y bloqueo: no seleccionan un destinatario real ni certifican entrega en aplicaciones externas.
