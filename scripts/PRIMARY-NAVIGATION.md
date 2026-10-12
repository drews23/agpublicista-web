# Navegación principal de Lienzo

Las páginas españolas e inglesas comparten cinco destinos, en el mismo orden:

| Español | Inglés | Ruta ES | Ruta EN |
|---|---|---|---|
| Herramientas | Tools | `/herramientas/` | `/en/tools/` |
| Plantillas web | Web Templates | `/codigo-web/plantillas/` | `/en/templates/` |
| Código CSS | CSS Code | `/codigo-web/` | `/en/code/` |
| Recursos | Resources | `/recursos/` | `/en/resources/` |
| Guías | Guides | `/blog/` | `/en/blog/` |

Las etiquetas no cambian las URL. Código CSS conserva sus generadores y la galería de componentes. Guías conserva el blog y sus artículos. El logo lleva a la portada de su idioma. Mi Lienzo permanece junto al idioma y al tema; cada versión conserva su almacenamiento independiente. YouTube mantiene sus enlaces contextuales y en los pies, sin ocupar una posición en el menú principal.

`build-primary-navigation.py` aplica esta taxonomía a los HTML versionados que tienen `nav.site-nav`. Reemplaza exclusivamente la navegación y el acceso de Mi Lienzo dentro de la cabecera. Conserva el logo, el selector de idioma, el control de tema, el contenido principal, el pie y los metadatos. Añade una hoja CSS compartida y versiones por hash del CSS y de los dos bundles existentes de `site.js`.

Después de regeneradores antiguos, ejecutar al final:

```powershell
python scripts/build-home-discovery.py
python scripts/build-discovery-directories.py
python scripts/build-primary-navigation.py
python scripts/build-primary-navigation.py --check
```

No hace falta ejecutar generadores amplios para cambiar el menú. La última comprobación detecta páginas que requieren actualización. El proceso es idempotente. Las nuevas páginas deben tener la cabecera habitual y añadirse a Git antes de aplicar el constructor, porque este trabaja sobre los HTML versionados.

Para comprobar preservación frente a una revisión anterior:

```powershell
python scripts/verify-primary-navigation.py --base 8d7c769
node --check js/site.js
node --check en/assets/site.js
git diff --check
```

La comprobación compara todo el HTML fuera de la cabecera, excepto la incorporación de la hoja de navegación y las versiones de `site.js`. También valida destinos, orden, selección activa, logo, idioma, tema, JSON estructurado y versiones de assets. No sustituye pruebas funcionales de las herramientas ni una auditoría completa de accesibilidad.

El menú se pliega hasta 1100 px; el estilo está limitado a `[data-unified-header]`. El controlador compartido de `site.js` gestiona cierre, Escape, retorno de foco, navegación por teclado y cambio de ancho. Las páginas interiores señalan su sección con `aria-current="location"`; los índices usan `aria-current="page"`. Sin JavaScript, los enlaces móviles se muestran en la cabecera. En anchos de hasta 380 px, la marca y las utilidades usan dos filas para conservar su tamaño de interacción.

Antes de publicar, comprobar portadas, directorios, artículos, herramientas y Mi Lienzo en ambos idiomas. Revisar escritorio, móvil, teclado, tema y funcionamiento sin JavaScript. El usuario debe autorizar commit y push; comprobar después el contenido y la presentación reales en producción.
