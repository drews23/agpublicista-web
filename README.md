# AG Publicista — agpublicista.com

Sitio estático en español con herramientas creativas, recursos descargables y blog de diseño gráfico, diseño web y marketing digital. Complementa al canal de YouTube [Andy Publicista](https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg).

## Estructura

```
/                       Página de inicio
/herramientas/          Índice de herramientas
  favicons/             Galería de favicons SVG (copiar y pegar)
  texto-ondulado/       Generador de texto ondulado animado (SVG)
/blog/                  Blog + artículos
/recursos/              Packs descargables y portafolio en video
/sobre-mi/              Sobre Andy
/privacidad/            Política de privacidad (requisito AdSense)
/css/site.css           Sistema de diseño (tokens, componentes, temas claro/oscuro)
/js/site.js             Tema, navegación, animaciones, utilidades
/js/text-path.js        Componente TextPathMarquee (texto sobre onda SVG)
```

Sin build ni dependencias: HTML + CSS + JS vanilla. La raíz del repositorio es la raíz web.

## Identidad visual

- **Colores** (tema oscuro por defecto + tema claro): tinta `#0a0a0f`, violeta `#8b7bff`, turquesa `#35d6c8`, ámbar `#ffb454`, coral `#ff7a68`. Definidos como tokens CSS en `css/site.css`.
- **Tipografías**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display, itálicas de acento) + [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (cuerpo), vía Google Fonts.
- **Logo**: monograma "AG" en squircle con degradado violeta→turquesa y punto ámbar (`favicon.svg`).

## Desarrollo local

Cualquier servidor estático sirve. Por ejemplo:

```bash
npx serve .
```

## Despliegue (GitHub → Hostinger)

1. **Crear el repositorio en GitHub** (`creativo-marketing-web`) y hacer push de esta carpeta.
2. En **hPanel de Hostinger** → Sitios web → agpublicista.com → **Avanzado → GIT**.
3. Crear repositorio: pegar la URL `https://github.com/drews23/creativo-marketing-web.git`, rama `main`, directorio de despliegue vacío (raíz = `public_html`).
4. Hostinger clona el repo en `public_html`. Para autodesplegar en cada push, copiar el **webhook** que muestra hPanel y añadirlo en GitHub → Settings → Webhooks del repositorio.
5. Verificar que el dominio sirva `https://agpublicista.com` (el `.htaccess` fuerza HTTPS y sin `www`).

## Después del despliegue (SEO + monetización)

- Dar de alta el sitio en [Google Search Console](https://search.google.com/search-console) y enviar `https://agpublicista.com/sitemap.xml`.
- Solicitar [Google AdSense](https://adsense.google.com) cuando haya contenido indexado; sustituir los bloques `.ad-slot` por el código de anuncio (los puntos están marcados con comentarios `<!-- AdSense -->`).
- Cada video nuevo del canal = un artículo nuevo en `/blog/` enlazándolo (el sitio y el canal se retroalimentan).
