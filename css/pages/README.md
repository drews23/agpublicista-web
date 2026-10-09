# Hojas de estilos por página

`after-effects.css` y `qr.css` se generan desde las hojas originales y el HTML de cada página. No se editan directamente. Las páginas restantes siguen usando las hojas compartidas.

Después de modificar `css/fonts.css`, `css/site.css`, los estilos QR/Estudio, el HTML o sus clases creadas por JavaScript, ejecutar:

```powershell
python -m pip install beautifulsoup4 tinycss2
python scripts/build-page-css.py
python scripts/build-page-css.py --check
```

Publicar las hojas generadas junto con los cambios y actualizar su versión en el enlace HTML cuando cambien. Comprobar móvil, escritorio, temas, menú y controles de la herramienta.

El generador conserva el orden de la cascada, reglas sin clases, fuentes, keyframes, selectores con funciones y clases presentes en cualquier parte del HTML o sus scripts locales. No utiliza cobertura de una sola visita ni elimina estados por estar fuera de pantalla. Las clases construidas por concatenación requieren revisión explícita al introducirlas.

Las fuentes mantienen sus archivos originales y licencias SIL OFL en `/assets/fonts/`. Las rutas `url()` actuales son absolutas; una nueva ruta relativa debe resolverse antes de agruparla en esta carpeta.
