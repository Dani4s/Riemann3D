# Verificación local — semanas 1 a 6

## Semana 6 · 18 de septiembre de 2026

- `node --test tests/*.test.js`: 49 pruebas aprobadas, 0 fallos.
- `node tests/local-check.mjs`: recorrido de rectángulos, Tipo I/II y polares,
  resolución hasta 128, fórmulas, errores, recuperación, cámara y viewport móvil.
  Las 33 comprobaciones de `/tests/` pasaron sin errores HTTP/JavaScript/consola.
- `node tests/physical-check.mjs`: caja, semicírculo, disco, rechazo de negativos,
  total cero, alternancia de modelos, teclado y móvil aprobados.
- Caja: V=12 y centroide=(1,1.5,1).
- Semicírculo a n=32: ȳ=0.4244800137, referencia 0.4244131816.
- Disco de masa 1 a n=32: IO=0.4997558594, referencia 0.5.
- La geometría de láminas se verifica plana (todos los vértices z=0), tanto en
  rectángulos como en polares. La superficie de alturas no se ofrece en láminas.
- Los datos incluyen unidades, fórmulas, referencias y errores. La tabla de
  celdas y el teclado ofrecen alternativas a color y ratón.
- Capturas `screenshots/week6-desktop.png`, `week6-mobile.png`, `solid-box.png`,
  `lamina-semicircle.png` y `lamina-disk.png`. Viewports de Chromium, no dispositivos físicos.
- `validacion-numerica.md` contiene resultados de los doce presets a n=64,
  centroides e inercias y tiempos del cálculo (sin renderizado).
- Presentación final: 10 diapositivas con guion de 10 minutos; estructura del
  PPTX validada, reimportada y las diez diapositivas renderizadas y revisadas.
  No se ha abierto en Microsoft PowerPoint.

No se afirma una auditoría completa WCAG ni una certificación matemática de
funciones arbitrarias. Las pruebas comprueban comportamientos y casos analíticos concretos.

## Historial de verificación

Los apartados siguientes describen el alcance que tenía cada entrega anterior.

## Semana 5

- Suite Node: 44 pruebas aprobadas, 0 fallos.
- Página `/tests/`: 33 comprobaciones aprobadas, 0 fallos.
- Paraboloide a n=32: 25.120469382415 frente a 8π=25.132741228718;
  error relativo 0.048828125 %. La tabla n=4..64 reproduce orden p≈2.
- Hemisferio: 2.097607979526 frente a 2π/3; error 0.153403583 %.
- Sector anular: 2.356194490192 frente a 3π/4; exacto a precisión de máquina.
- Áreas de discos/anillos/sectores verificadas para n=1,7,32,128; el jacobiano
  es rᵢ y el área coincide con (r1²−r0²)(theta1−theta0)/2.
- Funciones equivalentes en x/y y r/θ coinciden; se rechazan mezclas de variables,
  radios negativos, límites invertidos, doble vuelta y ángulos no constantes.
- Recorrido Chromium: nueve presets, mapeo con selección de celda y cambio de área,
  variables nativas, límites inválidos, cancelación/recuperación, KaTeX y n=128.
- 16384 sectores dibujados con menos de 20 draw calls; reemplazos no acumulan
  geometrías WebGL. No se afirma una tasa de FPS universal ni una prueba exhaustiva de memoria.
- Capturas revisadas en escritorio/móvil simulado: `screenshots/week5-desktop.png`
  y `screenshots/week5-mobile.png`. Sin errores de consola, JavaScript ni HTTP.
- Quedan para semana 6 los modelos físicos de sólidos/láminas y el cierre final.

## Semana 4

- Suite Node completa: 35 pruebas aprobadas, 0 fallos.
- Página `/tests/`: 24 comprobaciones aprobadas, incluidos contorno y cámara para Tipo I/II.
- Chromium: seis presets disponibles, cambio de tipo y campos visibles, variables
  incorrectas en límites, límites invertidos/iguales/no reales, limpieza de resultados,
  recuperación, resolución variable n=128 y paginación de celdas.
- Exactitud a n=32: área Tipo I = 0.166748046875 (exacto 1/6; error 0.048828125 %),
  área Tipo II = 0.166982686478 (error 0.189611887 %), triángulo ponderado
  = 0.500122070313 (exacto 1/2; error 0.0244140625 %).
- El área Tipo I tiene orden observado p≈2. Se verifica también f=x*y en ambos órdenes.
- Todos los puntos de integración de los casos entre curvas están dentro del dominio real;
  área de celda y determinante de instancia coinciden dentro de tolerancia numérica.
- Los extremos de área nula del dominio se aceptan; degeneraciones interiores y cruces
  detectados abortan el cálculo completo. Los mensajes identifican la coordenada.
- Fórmulas renderizadas sin errores KaTeX para cada caso y orden diferencial correcto.
- Capturas revisadas: `screenshots/week4-desktop.png` y `screenshots/week4-mobile.png`.
  Sin desbordamiento de página ni errores de consola/HTTP. Móvil simulado en Chromium.
- Continúan fuera del alcance las coordenadas polares (semana 5) y aplicaciones (semana 6).

## Semana 3

- Suite Node: 24 pruebas aprobadas, 0 fallos.
- Página `/tests/`: 17 comprobaciones aprobadas, incluidos 16384 prismas a n=128,
  menos de 20 draw calls y estabilidad del número de geometrías WebGL después de reemplazos.
- Recorrido Chromium: n=128 y regreso a n=32, conservación del preset, KaTeX presente,
  cinco filas de convergencia y p≈2 en el paraboloide rectangular.
- Sin exacto: encabezado de diferencia como indicador. Errores nulos no producen p infinito.
- Matrices comprobadas para alturas positivas, negativas, mixtas y nulas; bases completas.
- Escena, formulario y tablas revisados en escritorio y viewport móvil, sin desbordamiento de página.
  Las fórmulas y tablas anchas tienen desplazamiento horizontal interno.
- Evidencia: `screenshots/week3-desktop.png` y `screenshots/week3-mobile.png`.
- Sin errores JavaScript, consola o carga HTTP en el recorrido local.
- No se ha desplegado a un servicio externo ni se han probado dispositivos móviles físicos.

## Semana 2

- Suite completa Node.js 22.16.0: 19 pruebas aprobadas, 0 fallos.
- Página `/tests/`: 12 comprobaciones aprobadas, incluidos los tres presets y WebGL.
- Chromium, formulario real con Worker: tres presets, entrada personalizada,
  advertencia de integral firmada, asignación prohibida, raíz compleja, división por cero,
  exponencial no finita, límites invertidos/vacíos y recuperación tras errores.
- Cambiar la entrada oculta resultados anteriores y retira la comparación exacta del preset.
- Arrastre de cámara comprobado; sin errores de consola, JavaScript o HTTP.
- Escritorio 1366×1000 y móvil 390×844 revisados; sin desbordamiento horizontal.
- Evidencia: `screenshots/week2-desktop.png` y `screenshots/week2-mobile.png`.
- Exactitud a n=32: 3 → 3, 12 → 12, 2/3 → 0.66650390625.
  Los tres casos cumplen error relativo menor a 1 % (máximo: 0.0244140625 %).
- El caso cuadrático también verifica que duplicar n reduce el error por un factor de cuatro.

Las capturas móviles corresponden a un viewport, no a un dispositivo físico.
La visualización de la partición numérica permanece pendiente de semana 3.

## Registro de semana 1

Validación realizada en Windows con Node.js 22.16.0 y Chromium de Playwright.
Servidor: `python -m http.server 8000 --bind 127.0.0.1`.

## Resultado

- `node --test tests/scene.test.js`: 3 pruebas aprobadas, 0 fallos.
- `http://127.0.0.1:8000/tests/`: 8 comprobaciones aprobadas, 0 fallos.
- Página principal: estado «Escena lista», renderizado WebGL real y cuatro cajas visibles.
- Arrastre: comparación de capturas antes/después confirmó un cambio de vista.
- Cámara: giro por teclado y recuperación de la posición inicial comprobados.
- Resize: proyección y lienzo actualizados al cambiar el contenedor.
- Liberación y segundo montaje de escena correctos.
- Escritorio 1366×1000 y móvil 390×844: capturas revisadas visualmente, sin desbordamiento horizontal de página.
- Sin errores JavaScript, de consola ni respuestas HTTP 400 o superiores durante el recorrido.

Evidencia: `screenshots/desktop.png` y `screenshots/mobile.png`.
La verificación móvil corresponde a un viewport de Chromium; no a un dispositivo físico.
No se han probado resultados de integración: están fuera de esta entrega.

## Particularidad del entorno

`npm test` no pudo arrancar por un `npm-cli.js` ausente en la instalación global del equipo.
No se modificó esa instalación. El comando directo de Node ejecutó correctamente la misma suite.
La aplicación no necesita npm, Playwright ni compilación para funcionar.
