# Identidad del canal de YouTube — Andy Publicista / Lienzo

Piezas de marca del canal, hechas con el mismo sistema de diseño del sitio
(`assets/logo-lienzo.svg`, paleta de Lienzo, Fraunces + Instrument Sans).

## Archivos

| Archivo | Uso | Tamaño |
|---|---|---|
| `banner.png` | Imagen de portada del canal | 2560 × 1440 |
| `avatar.png` | Foto de perfil del canal | 800 × 800 |

Los `.html` que están junto a ellos son la fuente: se re-renderizan con Edge
headless si hay que retocar algo (ver más abajo).

## Cómo subirlas (lo haces tú, desde tu cuenta)

1. Entra a **YouTube Studio** → menú izquierdo → **Personalización** → pestaña **Imagen de marca**.
2. **Foto de perfil** → *Cambiar* → sube `avatar.png`. YouTube la recorta en círculo automáticamente; ya está diseñada para eso.
3. **Imagen de banner** → *Cambiar* → sube `banner.png`. Te mostrará una vista previa con los recortes de TV / escritorio / móvil: los tres están contemplados en el diseño, así que **no muevas el encuadre**.
4. Pulsa **Publicar** arriba a la derecha.

Puede tardar unos minutos en verse en todos lados, y el navegador suele
guardar la imagen vieja en caché: si sigues viendo la anterior, prueba con
Ctrl+F5 o una ventana de incógnito.

## Por qué está diseñado así (geometría de YouTube)

El banner es un único archivo de 2560 × 1440 que YouTube **recorta distinto en cada dispositivo**:

- **Móvil (y mínimo garantizado):** solo se ve un rectángulo de **1546 × 423 centrado**. Todo lo esencial —logo, propuesta, dominio— vive ahí dentro.
- **Escritorio:** se ve una franja de **2560 × 423** (la misma altura, a lo ancho). Los laterales llevan refuerzo visual que puede recortarse sin perder el mensaje.
- **TV:** se ve el lienzo completo. Las bandas de arriba y abajo son atmósfera (blooms), nunca información.

La foto de perfil se muestra **siempre circular** y baja hasta **48 px** en los
comentarios, así que usa la marca compacta (los chevrones, sin la palabra
LIENZO, que a ese tamaño sería ilegible) — la misma lógica del favicon del sitio.

## Verificar un cambio

`verificar.mjs` genera los recortes reales que ve cada dispositivo, para
juzgarlos con los ojos en vez de adivinar:

```bash
node verificar.mjs banner banner.png
```

Produce `banner-zona-segura.png` (lo que ve el móvil), `banner-escritorio.png`
(la franja) y `banner-guias.png` (el lienzo entero con la zona segura marcada
en coral y la franja de escritorio en turquesa).

```bash
node verificar.mjs avatar avatar.png
```

Produce el recorte circular real, las versiones a 136 / 68 / 48 px y una tira
comparativa sobre el gris de YouTube.

## Re-renderizar tras editar el HTML

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu --window-size=2560,1440 --hide-scrollbars --virtual-time-budget=3000 --screenshot="$(cygpath -w "$PWD/banner.png")" "$(cygpath -w "$PWD/banner.html")"
```

(Para el avatar, cambia `--window-size` a `800,800` y los nombres de archivo.)

## Fuentes

`fuentes/fraunces-var.woff2` e `fuentes/instrument-var.woff2` son los archivos
variables del subconjunto latino descargados de Google Fonts, para que el
render local tenga los pesos **reales** (700 recto incluido) en vez de negrita
sintética. El sitio sigue cargando las fuentes desde Google Fonts como siempre;
estos archivos son solo para renderizar estas piezas.
