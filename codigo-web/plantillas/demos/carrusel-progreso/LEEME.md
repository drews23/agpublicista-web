# Carrusel con progreso y profundidad — Lienzo Form

Cuatro conceptos de calzado con recortes transparentes, tarjeta central, vistas laterales y movimiento coordinado de imagen, sombra, tarjeta, texto y fondo. Sustituye el anterior pase de escenas genéricas y recupera la estructura de exhibición de productos de la referencia.

## Abrir
Descomprime la carpeta completa y abre index.html. Todo es local: imágenes, fuentes, Swiper 12.2.0, CSS y JS. Sin instalación, CDN, servidor, clave API, cuenta ni compilación. La demo independiente comienza en claro; la previsualización de Lienzo sincroniza el tema con su ventana principal.

## Controles
Arrastra con ratón o desliza horizontalmente. Usa anterior/siguiente, los cuatro indicadores, o enfoca el escenario y pulsa flechas izquierda/derecha, Inicio o Fin. Toca un producto lateral para centrarlo. Ver detalles abre un diálogo nativo; Escape lo cierra y devuelve el foco. El avance opcional comienza apagado y espera 6,5 segundos por producto. Su indicador muestra el tiempo transcurrido. Se pausa con cursor, interacción de teclado, arrastre, diálogos, transiciones y pestaña oculta. El movimiento reducido del sistema desactiva el avance y las transiciones. El control de profundidad también detiene el avance automático.

## Personalizar
Sustituye assets/sneaker-*.webp por tus imágenes transparentes. Edita nombres, categorías, precios y textos alternativos en los cuatro artículos de index.html. Mantén coherente el bloque data-products del mismo documento, que alimenta el diálogo. Los precios USD son ejemplos; la interfaz no realiza pedidos ni pagos. Personalizar permite ajustar la transición (350–1400 ms) y el acento de interfaz. Cambia --product-color para cada tarjeta y la paleta al principio de styles.css. Las fuentes locales son Fraunces e Instrument Sans.

La imagen, sombra, escala, máscaras de texto y fondo se calculan a partir del progreso de cada slide de Swiper. script.js contiene inicialización, teclado limitado al escenario, ajuste según velocidad del gesto, foco del diálogo, avance opcional, preferencias de movimiento y mensajes de tema. Conserva juntos escenario, navegación, diálogos, datos y scripts. Copiar HTML completo incluye esos controles y dependencias; no entrega un fragmento autónomo. Conserva assets/ junto al documento. El ZIP completo es la referencia de integración funcional.

## Archivos y créditos
Implementación nueva de Lienzo para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . El ZIP de carrusel Swiper aportado se revisó como referencia visual y de movimiento; no se redistribuyen su código ni sus imágenes remotas de Nike. Se generaron cuatro conceptos de producto sin marcas para esta demo. Son ilustraciones de diseño, no mercancía real. Consulta SOURCE-NOTES.md y assets/LICENSE-SWIPER.txt. Código Lienzo: MIT; Swiper incluido: MIT; fuentes: OFL. Conserva esos avisos al redistribuir. Los logos conservan los derechos de marca de sus titulares.

## Límites
Ejemplo de interfaz reutilizable, no tienda completa, integración de pagos, tema instalable de WordPress ni componente React listo. React requiere adaptar marcado y ciclo de vida. Sin analítica, persistencia, cuentas, backend ni solicitudes externas. Los ajustes se reinician al recargar. Revisa tus imágenes finales y prueba tu contenido antes de integrarlo.


## Mesa de edición
El botón Ajustes pliega el inspector sin restablecer el trabajo. La vista previa permanece estable durante la edición. Conserva editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css y template-brand.js junto al CSS, JavaScript, HTML y assets originales. Estos archivos locales no necesitan red ni instalación.

## Tu marca
Lienzo es la identidad de ejemplo predeterminada. Tu marca admite colores principal, secundario y acento libres, fondo/texto opcionales, fuentes del sistema y archivos WOFF2/WOFF/TTF/OTF locales de hasta 5 MB por función. Los cambios se aplican en directo a la pieza y son independientes de Aplicar/Cancelar contenido. Las exportaciones HTML completas incluyen el perfil y las fuentes adjuntas; conserva las dependencias del ZIP junto al HTML. Los SVG de iconos incluyen sus colores y no necesitan JavaScript; esos dibujos no tienen texto visible y no usan la fuente del editor. Adjunta únicamente fuentes que puedas utilizar y redistribuir. Ningún archivo sale del navegador.
