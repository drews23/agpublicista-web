# Rendimiento de las portadas ES y EN

Ambas portadas incrustan sus hojas completas en el bloque `home-css`. Se mantienen las reglas, el orden de cascada original de cada idioma, las fuentes, los temas y las animaciones. Las demás páginas siguen usando sus hojas externas. No editar el bloque generado directamente.

Las fuentes de cada idioma y las seis hojas compartidas están enumeradas en `scripts/build-home-css.py`. Después de modificar una de ellas:

```powershell
python scripts/build-home-css.py
python scripts/build-home-css.py --check
```

Requiere BeautifulSoup4 y tinycss2, igual que `build-page-css.py`. Conserva todas las clases, también las dinámicas. Rechaza rutas relativas y conserva los avisos de licencia. Si se modifica una hoja compartida con AE o QR, regenerar también esas hojas mediante `build-page-css.py`.

## Menú e inicio de los efectos

`scripts/build-home-performance.py` copia el controlador de navegación existente de `js/site.js` dentro de cada portada, inmediatamente después del header y antes de main. El menú queda operativo antes de la primera pantalla. El paquete global detecta que ya está inicializado y evita duplicar eventos y el velo. Las demás páginas conservan su inicialización diferida. La alternativa CSS sin JavaScript permanece intacta; si el paquete global falla, el menú de portada continúa operativo.

El generador exige que el controlador sea igual en `js/site.js` y `en/assets/site.js`, actualiza las versiones de los tres scripts afectados en ambas portadas y precarga las fuentes usadas en la primera pantalla inglesa. Después de modificar esos scripts o reconstruir las portadas:

```powershell
python scripts/build-home-performance.py
python scripts/build-home-performance.py --check
```

`hero-eclipse.js` recibe las dimensiones mediante ResizeObserver, sin medir sincrónicamente durante la carga. Conserva densidad, velocidad, DPR máximo de 2, colores y forma de las partículas. Pausa al salir de pantalla o esconder la pestaña. El carrusel agrupa las actualizaciones de controles por fotograma y recibe las dimensiones después del layout. No se cambian los keyframes de triángulos ni focos.

Las imágenes WebP de ambas portadas mantienen su `src` original y añaden `srcset` y `sizes`. Las miniaturas se generan en `assets/responsive/home/`; mantienen proporción y transparencia, con calidad WebP 95. Los originales no se sobrescriben. Las dimensiones HTML, el recorte CSS y las animaciones permanecen iguales. Se admiten las tres formas de cierre de img: >, /> y espacio antes de />.

Después de añadir o cambiar imágenes WebP en la portada:

```powershell
python scripts/build-home-images.py
python scripts/build-home-images.py --check
```

Este script requiere Pillow. Revisar `sizes` si cambia el tamaño de las tarjetas o las escenas. Ejecutar los tres generadores después de los constructores de contenido. Verificar móvil/escritorio, temas, menú y movimiento reducido antes de publicar.

El CSS se comprime con el HTML y evita seis solicitudes de estilo en español y nueve en inglés; deja de reutilizar la caché independiente de esas hojas. AdSense y el consentimiento no se retrasan, duplican ni retiran en esta optimización. La auditoría encontró un único cargador async en ES y ninguno en la portada EN; se conserva esa configuración. Una medición local con terceros bloqueados no predice la puntuación pública.
