# Proyecto de texto: siete escenas

Generación acotada:

```powershell
python -X utf8 scripts/after_effects_text_scenes.py
```

El contenido editorial vive en `scripts/after-effects-text-scenes/article-es.html` y `article-en.html`. El helper conserva las cabeceras y pies de las fichas existentes, pero genera dos URL nuevas; nunca sustituye el pack de texto anterior.

- ES: `/blog/animacion-texto-after-effects-7-escenas/`
- EN: `/en/blog/after-effects-text-animation-7-scenes/`
- Video: `TH9AxNiWvz4`.
- Descarga: MediaFire `n204h7vtl0jnaqk`, ZIP de 92.220 bytes, SHA256 `208463139a41264bdc2e38e35327e1684ebfb35f6d80329a7aab6bf25ba05440`.

La copia descargada de MediaFire coincidió byte por byte con la entrega original. El AEP conserva su estructura y no se renombraron capas. Se detectaron siete carpetas Scene 1–7 y la composición `#Final`; el tutorial usa algunas etiquetas distintas. No se ha probado una exportación nueva dentro de After Effects ni establecido una versión mínima. El proyecto no se anuncia como un conjunto de presets .ffx ni como libre de dependencias.

`guide_categories.enhance_guides` mantiene la tarjeta en Guías; `build-discovery-directories.organize_resources` la mantiene en Recursos. Sus grupos After Effects incluyen la ruta nueva y conservan las anteriores. Ambos aceptan el catálogo agrupado y la salida plana de generadores antiguos. `build-english-resources.py` ejecuta el helper al final para conservar la ficha nueva y el enlace relacionado cuando se regeneran las guías inglesas anteriores.

Las portadas ya enlazan a Recursos / After Effects, por lo que no necesitan cambios visuales ni sustitución de sus tarjetas destacadas. La ficha incluye alternates recíprocos ES/EN/x-default, canónica propia, Article y BreadcrumbList. El video es complementario: no se promete indexación de video ni se inventan capítulos, fechas de subida o un VideoObject.

El ZIP permanece en MediaFire. Solo se versionan textos públicos, créditos, imágenes, fuentes de contenido y generadores. Las descargas locales, el AEP, los borradores y la evidencia QA permanecen fuera del manifiesto de publicación.
