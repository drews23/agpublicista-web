# Lienzo — agpublicista.com

Sitio estático en español con herramientas creativas, recursos descargables y blog de diseño gráfico, diseño web y marketing digital. **Lienzo** es la submarca del sitio; **agpublicista.com** es solo el dominio. Complementa al canal de YouTube [Andy Publicista](https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg).

## Estructura

```
/                       Página de inicio
/herramientas/          Índice de herramientas
  favicons/             Galería de favicons SVG (copiar y pegar)
  texto-ondulado/       Generador de texto ondulado animado (SVG)
  paletas/              Generador de paletas: armonías + escalas 50-950
  colores-en-vivo/      5 colores por rol sobre una maqueta de web real
/blog/                  Blog + artículos
/recursos/              Packs descargables y portafolio en video
/sobre-mi/              Sobre Andy
/privacidad/            Política de privacidad (requisito AdSense)
/css/site.css           Sistema de diseño (tokens, componentes, temas claro/oscuro)
/js/site.js             Tema, navegación, animaciones, utilidades
/js/text-path.js        Componente TextPathMarquee (texto sobre onda SVG)
/js/color-engine.js     Motor de color (conversión, escalas, armonías, contraste WCAG)
```

Sin build ni dependencias: HTML + CSS + JS vanilla. La raíz del repositorio es la raíz web.

## Identidad visual

- **Colores** (tema oscuro por defecto + tema claro): tinta `#0a0a0f`, violeta `#8b7bff`, turquesa `#35d6c8`, ámbar `#ffb454`, coral `#ff7a68`. Definidos como tokens CSS en `css/site.css`.
- **Tipografías**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display, itálicas de acento) + [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (cuerpo), vía Google Fonts.
- **Wordmark**: "Lienzo" en Fraunces itálica con degradado violeta→turquesa (`.brand__name` en `css/site.css`), acompañado del eslogan "Herramientas creativas sin fricción" en el header y el footer.
- **Logo**: monograma "L" en squircle con degradado violeta→turquesa y punto ámbar (`favicon.svg`).

## Desarrollo local

Cualquier servidor estático sirve. Por ejemplo:

```bash
npx serve .
```

## Despliegue (GitHub → Hostinger)

Ya configurado y en producción:

- Repositorio: [github.com/drews23/agpublicista-web](https://github.com/drews23/agpublicista-web) (público, rama `main`).
- Hostinger clona el repo directo en `public_html` vía su integración con GitHub (sin webhook manual: Hostinger instala su propia GitHub App con permiso para desplegar en cada push).
- `.htaccess` fuerza HTTPS sin `www`, cachea estáticos y comprime la respuesta.

Para futuros cambios: hacer commit y `git push origin main` — Hostinger despliega solo en segundos.

## SEO + monetización

- Sitio verificado en [Google Search Console](https://search.google.com/search-console) (propiedad `https://agpublicista.com/`) con `sitemap.xml` enviado y leído correctamente.
- **No borrar** `/googleb7bf25195d1606c4.html` — es el archivo de verificación de propiedad; eliminarlo revoca la verificación.
- Solicitar [Google AdSense](https://adsense.google.com) cuando haya contenido indexado; sustituir los bloques `.ad-slot` por el código de anuncio (los puntos están marcados con comentarios `<!-- AdSense -->`).
- Cada video nuevo del canal = un artículo nuevo en `/blog/` enlazándolo (el sitio y el canal se retroalimentan).
