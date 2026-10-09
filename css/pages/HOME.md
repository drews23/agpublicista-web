# CSS e imágenes de portada

La portada incrusta el CSS completo de sus cuatro hojas fuente en `index.html` para evitar solicitudes que bloqueen el primer renderizado. Las reglas, la cascada, las fuentes, los temas y las animaciones se conservan. Las demás páginas siguen usando sus hojas externas. No editar el bloque `home-css` directamente.

Después de modificar `css/fonts.css`, `css/site.css`, `css/hero-eclipse.css` o `css/novedades-neon.css`:

```powershell
python scripts/build-home-css.py
python scripts/build-home-css.py --check
```

Requiere BeautifulSoup4 y tinycss2, igual que `build-page-css.py`. El generador conserva todas las clases, también las dinámicas. Rechaza nuevas rutas relativas que requieran adaptación y conserva avisos de licencia. Si se modifica una hoja compartida, regenerar también AE y QR mediante `build-page-css.py`.

Las imágenes WebP de portada mantienen su `src` original y añaden `srcset` y `sizes`. Las miniaturas se generan en `assets/responsive/home/`; mantienen proporción y transparencia, con calidad WebP 95. Los originales no se sobrescriben. Las dimensiones HTML, el recorte CSS y las animaciones permanecen iguales.

Después de añadir o cambiar imágenes WebP en la portada:

```powershell
python scripts/build-home-images.py
python scripts/build-home-images.py --check
```

Este segundo script requiere Pillow. Revisar `sizes` si cambia el tamaño de las tarjetas o las escenas. Verificar móvil/escritorio, temas, menú, movimiento reducido y comparar rendimiento antes de publicar. La portada deja de reutilizar la caché de sus cuatro hojas externas, a cambio de evitar esas cuatro solicitudes; el CSS se entrega y comprime junto al HTML.
