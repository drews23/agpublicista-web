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

## Tarjetas de producto de cristal

Tres conceptos vectoriales propios: audio, reloj y portátil, con tres acabados por producto. Conservar borde de luz, flotación, etiquetas y jerarquía comercial de la referencia, adaptados a la paleta del logo. Añadir luz/inclinación de puntero, vista ampliada, editor independiente y selección local por variante con centavos enteros. Exportar una tarjeta o la colección con sus ajustes y dependencias locales. Sin pack de iconos 3D. Compactar la vista de escritorio según altura para mantener visibles los controles; en móvil, permitir scroll vertical. Fuentes en scripts/PRODUCT-CARDS-SHOWCASE.md. Referencias 21st: Product Card 7805, Gradient Card Showcase 2209, Glass Shine Card 7717, Dark Gradient Pricing 944 (solo metadatos). La nueva tanda sigue local. El carrusel y el laboratorio anteriores ya se publicaron en 7d5c9c3 y se verificaron en la conversación.

## Hover Atelier e iconos 3D seleccionados

Seis familias ES/en-US que conservan las capacidades de las nueve tarjetas de referencia: neón, elevación, barrido/revelado, giro con cristal, degradado continuo y flotación. Editor individual de contenido/enlace/acento/duración/intensidad/radio/curva, comparación estática frente a efecto, prueba táctil, foco y exportación funcional. Sin dependencias externas, almacenamiento ni bucle JS permanente. Animar transform y opacity; pausar lo continuo fuera de pantalla, en modales, con pausa manual y movimiento reducido. Evitar alturas fijas que hagan solaparse el contenido personalizado con los controles. Fraunces mantiene tracking normal.

Cambio explícito del usuario en esta tanda: usar iconos más sofisticados de su biblioteca 3D. Selección: Idea 679c6ce6, Capas edbff264, Varita mágica 83a82de2, Diseño 3D 50ad3a46, Degradado 19b28796 y Cohete 74bb0ce3. Mantener geometría, crear copias vectoriales en menta/violeta/ámbar y sus mezclas con blanco/negro. Preservar los originales. Esta autorización corresponde al pack hover; laboratorio y producto conservan sus ilustraciones previas. No extender el MIT del código a la biblioteca de iconos. Manifiesto y aviso de procedencia incluidos en fuentes/ZIP. Referencias 21st consultadas por metadatos: Tilt Card 12245, Spotlight Card 2220, Spotlight 35180 y Spotlight 1500. No se incorporó su código ni generación de pago. Detalles: scripts/HOVER-CARDS-SHOWCASE.md. Producto y hover siguen locales, sin commit/push.

## Motion Icons: microinteracciones semánticas

Evolución local de iconos-animados en ES/en-US. Doce dibujos propios de 64 unidades y doce gestos por partes; evitar un único rebote del SVG entero. Composición de mesa de edición: selector de doce símbolos, escenario ampliado con guías sutiles y muestra estática, ajustes independientes a un lado. En tablet/móvil, redistribuir en flujo vertical sin ocultar exportaciones. Acabados línea/duotono, paleta logo y tracking normal. El gesto acompaña la función: campana y badajo, flecha y bandeja, carpeta y documento, dos piezas de enlace. Transform/opacity, interacción por defecto, bucle suave optativo y prueba del conjunto escalonada; teclado, toque y movimiento reducido.

Cada SVG exportado debe ser XML válido y autónomo, con CSS acotado al icono, sin IDs ni dependencias externas; las copias conservan color, trazo y duración independientes. Incluir exportación estática y ZIP local de los doce ajustes, con MIT y guía. Distinguir SVG insertado en HTML (hover/foco) de img (usar una vez/bucle). Pausar la previsualización no cambia el formato de exportación elegido. Estado en memoria. Referencias 21st consultadas solo como metadatos: Animated Icon 37504, Animated Icon Buttons 28541 y Line Draw SVG 18352; no se recuperó código de pago. UI/UX Pro Max y UI Styling se aplican al stack estático, sin adoptar su paleta sugerida ni migrar a React/Tailwind. Detalles en scripts/ANIMATED-ICONS-SHOWCASE.md. Producto, hover e iconos siguen locales.
