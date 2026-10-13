# Lienzo: contexto de diseño

Sitio estático bilingüe en HTML, CSS y JavaScript. Tokens de color, tipografía y radios en css/site.css. Fraunces para títulos e Instrument Sans para texto. Conservar el espaciado normal de Fraunces y comprobar claro y oscuro de forma independiente.

## Plantillas: dirección local del 13 de octubre de 2026

Biblioteca editorial con cuatro categorías numeradas: carruseles, tarjetas, botones sociales e iconos animados. Cada categoría conserva visibles sus recursos. Un comparador nativo desplegable resume uso, personalización y código; no filtra ni oculta el inventario. Cabecera de composición asimétrica con vistas SVG existentes y dos ventanas de código ilustrativas. Usar los botones, tarjetas y diálogo ya presentes.

Mantener ES y en-US con rutas independientes, todos los IDs y destinos anteriores, licencias y recursos ajenos intactos. Una solicitud explícita de rediseño permite modificar la demo y el ZIP correspondientes, conservando su URL. Navegación por anclas, foco visible, comparación con teclado, movimiento reducido y reflujo móvil. No migrar a React, Radix ni Tailwind para esta entrega. HyperFrames fue consultado como herramienta de vídeo; no pertenece al runtime de esta interfaz web.

Referencias de 21st consultadas por metadatos: Editorial service list (37530) y Comparison Table (26827). Se tomaron patrones de jerarquía y comparación; no se descargó ni incorporó código de terceros. Implementación sobre los componentes y tokens del proyecto. El CLI de búsqueda requiere iniciar sesión; la búsqueda MCP funcionó. La revisión CLI es local.

Estado: preparado en local para revisión. Publicación requiere autorización explícita. Las decisiones estructuradas se mantienen en design.json.

## Reparación del carrusel de productos

Solicitud explícita del usuario: recuperar la composición y funcionalidad del carrusel aportado, que la primera adaptación degradó. Tarjeta pastel central, productos transparentes grandes que salen del marco, laterales visibles y movimiento coordinado por el progreso de Swiper. Cuatro conceptos sin marcas generados para esta demo; nueva implementación Lienzo con Swiper 12.2.0 local y MIT. Temas claro/oscuro, Fraunces con espaciado normal, gestos, teclado, foco, movimiento reducido y avance opcional apagado inicialmente. La previsualización móvil usa una composición compacta según altura. Miniatura real capturada de la demo.

Referencias 21st consultadas por metadatos: Carousel (34485), Shirt Parallax Card (8262), Card Fan (14896) y Tilted (35229). No se incorporó su código. La captura y el ZIP aportados definen el contrato visual. Otras siete demos/descargas, header/footer y portadas intactos. Fuentes editables y pruebas en scripts/CAROUSEL-SHOWCASE.md. Esta reparación permanece en local sin commit, push ni publicación.

## Laboratorio 3D y paleta para próximos recursos

Seis geometrías CSS con cristal por capas, relieves concéntricos, bento, tarjeta cinema amplia y galería inferior de seis diseños. Editor por tarjeta para texto, acento, profundidad e inclinación; prueba táctil y exportación de un documento funcional. Conserva las reparaciones locales del carrusel y las URL ES/en-US. Miniaturas reales en cada idioma. Fuentes y contrato en scripts/CARD-LAB-SHOWCASE.md.

Regla explícita del usuario para nuevos recursos: solo colores de assets/logo-lienzo.svg (#8b7bff, #6e5df2, #35d6c8, #ffb454, blanco), mezclas/transparencias y negro neutro del sitio. No adoptar paletas genéricas de otras habilidades. Los iconos 3D existentes se reservan para próximas plantillas, no para este laboratorio. Referencias 21st consultadas por metadatos: Glass Card 2696, 3D cards Slider 7829, Glass Cards 8106, 3d Sliding Cards 5205 y 3D Flip Card 1436. No se incorporó su código. Ambas reparaciones siguen locales sin commit/push.
