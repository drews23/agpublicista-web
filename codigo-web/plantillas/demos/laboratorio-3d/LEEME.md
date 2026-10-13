# Laboratorio de tarjetas 3D — Lienzo

Seis estudios de material: órbita de cristal, corte preciso, relieve neón, plano cinema, prisma de luz y capas flotantes. Superficies separadas, relieves concéntricos, tarjeta panorámica, luz direccional y una mesa navegable de seis diseños recuperan la estructura visual e interactiva de la referencia. La implementación es HTML, CSS y JavaScript nuevo de Lienzo.

## Abrir y usar
Descomprime el ZIP completo y abre index.html. Fuentes, logo, CSS y JavaScript son locales. Sin CDN, instalación, API, backend ni compilación. La demo independiente comienza en oscuro; la ventana del sitio sigue el tema de su padre.

Mueve el ratón sobre una tarjeta para inclinarla. Probar efecto ofrece una demostración breve del relieve, también con toque o teclado. Cambiar acento alterna solo entre violeta, menta y ámbar del logo. Copiar HTML exporta esa tarjeta. Personalizar abre un editor nativo con título/descripción en vivo, tres acentos de marca, profundidad de capas (0–48 px) e inclinación máxima (0–14 grados). Restablecer recupera solo la tarjeta elegida. Los ajustes son por tarjeta y se reinician al recargar.

La mesa de pruebas muestra los seis diseños. Usa anterior/siguiente, indicadores numerados, flechas/Inicio/Fin al enfocar el escenario o un gesto horizontal. Los gestos verticales conservan el desplazamiento de la página. La navegación manual se detiene en los extremos. No hay avance automático. Escape cierra el editor y devuelve el foco. Movimiento reducido del sistema o Pausar efectos desactivan inclinación y prueba animada; el relieve estático permanece.

## Integrar y exportar
Copiar HTML y Descargar HTML entregan un documento completo de una tarjeta con su texto, acento, profundidad e inclinación actuales. Conserva styles.css, script.js y assets/ junto a él. El editor y sus controles siguen funcionando. Copiar CSS incluye la hoja completa con sus estilos delimitados. No es un fragmento sin dependencias ni un componente React preparado. El ZIP completo es la referencia funcional; conserva contenedor ln-lab, atributos data-, scripts y diálogos que necesites.

Los únicos tokens cromáticos son los de assets/logo-lienzo.svg: #8b7bff, #6e5df2, #35d6c8, #ffb454, más blanco y el negro neutro del sitio. Las demás superficies derivan de esas mezclas y transparencias. No se incorpora el pack de iconos 3D: el responsable lo reserva para otras plantillas. Los relieves son geometría CSS. Fuentes locales Fraunces e Instrument Sans, con espaciado normal en los títulos.

## Créditos y límites
Implementación nueva de Lienzo para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . El archivo neon-glass-3d-cards-ui-lab.zip y la grabación aportados se revisaron como referencias; no se redistribuye ni se cambia la licencia de su código. Consulta SOURCE-NOTES.md. Código Lienzo: MIT; fuentes: OFL; logos con sus derechos de marca. Conserva los avisos al compartir.

Ejemplo de interfaz reutilizable, no tienda completa, tema instalable de WordPress ni servicio de analítica. Sin cuentas, persistencia, subidas, pedidos ni pagos. Solo se descargan los archivos creados localmente al interactuar y el ZIP de Lienzo. Prueba tu texto e integración finales en los navegadores que vayas a admitir.
