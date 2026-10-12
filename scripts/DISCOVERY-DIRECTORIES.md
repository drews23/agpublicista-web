# Generación de los directorios de Lienzo

Los directorios de herramientas y recursos reutilizan las tarjetas y rutas de las páginas existentes. `build-discovery-directories.py` organiza ambos idiomas y la selección de herramientas de las dos portadas. No genera descargas, traduce proyectos ni modifica las herramientas individuales.

Después de ejecutar generadores antiguos de inglés que reconstruyen esas páginas, ejecutar los pasos de descubrimiento al final:

```powershell
python scripts/build-home-discovery.py
python scripts/build-discovery-directories.py
python scripts/build-primary-navigation.py
```

El primer script conserva los seis accesos y el carrusel manual. El segundo conserva las categorías de los directorios y la selección de herramientas. Los dos admiten ejecución repetida sin cambios adicionales. No es necesario ejecutar los generadores amplios de inglés para actualizar estos bloques.

La taxonomía y el orden se mantienen en el segundo script. Para incorporar un recurso nuevo hay que añadir su tarjeta a la página correspondiente y su ruta al grupo que le corresponda. Las categorías utilizan enlaces ancla nativos; todo el inventario permanece visible sin JavaScript.

El último paso conserva la cabecera común ES/EN después de cualquier reconstrucción. Véase `scripts/PRIMARY-NAVIGATION.md` para sus rutas, utilidades y comprobaciones de preservación.

Antes de publicar, comprobar ambos idiomas, las rutas de las tarjetas, los enlaces de categoría, los metadatos, los listados estructurados, el tema claro/oscuro y el reflujo móvil. No atribuir mejoras de tráfico o conversión a esta reorganización sin medición.
