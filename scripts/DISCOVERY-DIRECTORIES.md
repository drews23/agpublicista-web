# Generación de los directorios de Lienzo

Los directorios de herramientas y recursos reutilizan las tarjetas y rutas de las páginas existentes. `build-discovery-directories.py` organiza ambos idiomas y la selección de herramientas de las dos portadas. No genera descargas, traduce proyectos ni modifica las herramientas individuales.

Después de ejecutar generadores antiguos de inglés que reconstruyen esas páginas, ejecutar los pasos de descubrimiento al final:

```powershell
python scripts/build-home-discovery.py
python scripts/build-discovery-directories.py
python scripts/build-home-layout.py
python scripts/build-primary-navigation.py
```

El primer script conserva los seis accesos y el carrusel manual. El segundo conserva las categorías de los directorios y la selección de herramientas. El tercero compacta ambas portadas: conserva el hero español, el carrusel manual y las herramientas; organiza el catálogo en cinco familias y destaca tres guías. Los pasos admiten ejecución repetida sin cambios adicionales. No es necesario ejecutar los generadores amplios de inglés para actualizar estos bloques.

La taxonomía y el orden se mantienen en el segundo script. Para incorporar un recurso nuevo hay que añadir su tarjeta a la página correspondiente y su ruta al grupo que le corresponda. Las categorías utilizan enlaces ancla nativos; todo el inventario permanece visible sin JavaScript.

El último paso conserva la cabecera común ES/EN después de cualquier reconstrucción. Véase `scripts/PRIMARY-NAVIGATION.md` para sus rutas, utilidades y comprobaciones de preservación.

Antes de publicar, comprobar ambos idiomas, las rutas de las tarjetas, los enlaces de categoría, los metadatos, los listados estructurados, el tema claro/oscuro y el reflujo móvil. No atribuir mejoras de tráfico o conversión a esta reorganización sin medición.

## Mensajes y acciones de las tarjetas

`python scripts/catalog_copy.py` aplica una pasada limitada a las dos portadas y los cuatro directorios de herramientas y recursos. Mantiene los destinos, títulos, ilustraciones, cantidades y metadatos. Las tarjetas explican su siguiente acción según el recurso; las etiquetas de formato existentes se conservan. Las tarjetas de guías de portada mantienen sus llamadas originales.

La pasada también identifica las tres plantillas web en la introducción española, sustituye promesas semanales por invitaciones sin periodicidad y describe el ahorro SVG como dependiente del archivo. El directorio español explica los distintos formatos y el acceso externo de la búsqueda de favicons, en lugar de afirmar que todas las herramientas generan SVG.

`build-discovery-directories.py`, `build-home-layout.py` y el finalizador inglés aplican esta misma función. Para una corrección editorial pequeña, ejecutar únicamente `catalog_copy.py`; no hace falta reconstruir el sitio. El CSS de las acciones es independiente: `css/pages/catalog-copy.css`.

Pruebas de esta tanda: `output/catalog-copy-2026-10-13/qa.py` comprueba conservación de enlaces, metadatos, imágenes, SVG, scripts, controles e identificadores, una acción por tarjeta e idempotencia. También ejecuta los generadores de directorios y portadas en una copia aislada, sin reconstruir el checkout activo. Las observaciones de navegador se guardan en la misma carpeta.
