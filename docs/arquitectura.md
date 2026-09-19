# Diseño de datos y alcance — semanas 1 a 6

## Semana 6: modelos físicos

La petición admite `model: 'integral' | 'solid' | 'lamina'`, con valor por defecto
`integral` para conservar la API anterior. `integrator.js` forma la partición y
la suma; `applications.js` calcula magnitudes sobre las mismas celdas y devuelve
`application: null` para integral, `{model, volume, centroid}` para sólido o
`{model, mass, centroid, Ix, Iy, IO}` para lámina. Un centroide indefinido es `null`.
El sólido usa ∫∫f²/2 para su momento vertical. Las inercias se refieren al origen.

La validación física ocurre dentro del Worker y también en cada ejecución de
convergencia. Los negativos no se convierten en valores absolutos. Los errores
invalidan todo el resultado. `physicalUI.js` presenta fórmulas y unidades.

`buildLamina` agrupa triángulos planos en una malla con colores por densidad.
La cámara ignora ρ como dimensión vertical y no se construye una superficie de
alturas. La tabla textual conserva todas las densidades. La escala de color se
normaliza por el máximo de cada resultado y se explica en la interfaz.

La aplicación y sus dependencias se sirven como archivos estáticos. Los scripts
de prueba, la generación del informe numérico y el PPTX son herramientas o
entregables de desarrollo; no intervienen en el arranque de la aplicación.

Fuente: Riemann3D_plan_corregido.pdf, versión 2.0, apartados 3, 4 y 10.
La semana 1 aporta cajas estáticas, cámara y pruebas base. La semana 2 añade
validador, partición rectangular e integración comprobada con tres casos.

## Implementado

- `demoData.js`: datos nuevos en cada llamada; caja `{ id, x, y, width, depth, height }`. `x,y` son el centro de la base; ancho y fondo siguen X/Y. La base está en z=0, el centro visual en height/2.
- `sceneContent.js`: contenido Three.js sin DOM, apto para pruebas Node.
- `scene.js`: montaje WebGL, cámara orbital Z-up, etiquetas, interacción, tamaño y liberación. Render bajo demanda; no hay cálculo en el renderizado.
- `main.js`: arranque, estado y tabla accesible; no contiene lógica matemática.

## Contratos numéricos implementados en semana 2

Los cálculos reciben datos simples, sin objetos Three.js ni referencias al DOM:

```js
// Entrada rectangular, después de validar expresión y límites:
const request = {
  expression: 'x+y',
  region: { type: 'rectangle', a: 0, b: 2, c: 0, d: 1 },
  resolution: 8,
  rule: 'midpoint',
};
// Contrato de salida (esquema):
// { expression, region, resolution, rule, dx, dy, approximation: number,
//   cells: [{ x0, x1, y0, y1, sampleX, sampleY, value, area }],
//   diagnostics: [] }
```

Flujo actual: calculator → Worker → expressionValidator → geometry → integrator → resultado textual.
`integrator.js` compila sólo después de validar el AST; recibe la función local y
construye todas las celdas. La suma compensada conserva contribuciones negativas.
Cada evaluación usa un Map nuevo con x/y; no recibe objetos de aplicación.
Los límites de expresión, dominio, resolución y tiempo están documentados en README.
Los errores de dominio abortan el resultado completo y localizan la celda problemática.
`presets.js` contiene tres casos rectangulares y tres Tipo I/II, sin cálculos dentro del estado de interfaz.
`calculator.js` cancela el Worker al editar o abandonar la página y oculta resultados obsoletos.

Flujo de visualización: resultado → meshBuilder y ui.
`convergence` y `latex` se incorporaron en semana 3; `applications` se incorporó en semana 6.
La cámara y su selección visual son estado de interfaz; no alterarán los datos numéricos.
Las cajas de demostración no se reutilizarán como resultados numéricos.

## Decisiones

Three.js 0.180.0 y OrbitControls se conservan localmente con su licencia MIT.
El import map resuelve dependencias sin framework ni compilación. Node sólo ejecuta pruebas.
Los ejes mantienen las coordenadas matemáticas X/Y/Z; no se intercambian altura Y y Z.
math.js 14.8.1 se conserva localmente con un adaptador ES de tres líneas y licencia Apache 2.0.
Se documenta la adaptación en vendor/mathjs/README.md; no se requiere bundler.
En semana 3, `meshBuilder.js` convierte las celdas en una InstancedMesh con una geometría
y un material compartidos; reutiliza Matrix4 y Color durante su construcción.
Las alturas negativas usan escalas positivas y centros z=value/2. La geometría no
introduce huecos que alteren las bases. Al reemplazar, se liberan malla, geometría y material.
`scene.js` ajusta la cámara a la región y permite una superficie interpolada entre muestras.
`convergence.js` evalúa cinco resoluciones fuera del render y devuelve registros simples.
Otro Worker genera la tabla con progreso; editar termina ambos trabajadores e invalida sus resultados.
`latex.js` usa el AST validado para producir TeX; KaTeX tiene trust=false y genera MathML.
`ui.js` pagina las celdas para no crear 16384 filas DOM. El control de n aplica debounce de 350 ms.
No se crean archivos vacíos que aparenten esas funcionalidades.

## Semana 4: regiones variables

`integrate(request)` es ahora el punto de entrada general; `integrateRectangle(request)`
conserva el contrato anterior y rechaza tipos distintos de rectangle.
La función `createPartition` delega la región rectangular al módulo existente y
crea franjas para los tipos nuevos, sin dependencias de DOM ni de Three.js.

```js
const typeI = { type: 'typeI', a: 0, b: 1, lower: 'x^2', upper: 'x' };
const typeII = { type: 'typeII', c: 0, d: 1, lower: 'y', upper: 'sqrt(y)' };
```

La normalización elimina campos ajenos al tipo. El evaluador de cada límite restringe
el AST a su coordenada exterior, constantes pi/e y las funciones ya permitidas.
Se compila cada límite una vez. Los errores de una sola franja invalidan todo el cálculo.
Las coincidencias en los extremos exteriores son válidas; las coincidencias interiores
detectadas se rechazan. El borde se verifica en 257 puntos más los puntos medios reales.

Las celdas mantienen `{x0,x1,y0,y1,sampleX,sampleY,area,value}`. `dx` es constante
y `dy=null` en Tipo I; lo contrario ocurre en Tipo II. La UI dice «varía por franja»
en vez de presentar un paso global inexistente. `bounds={a,b,c,d}` contiene los extremos
del contorno muestreado y las bases para ajustar la cámara. `boundary=[{x,y},…]`
contiene un recorrido cerrado en XY. Su geometría se libera al reemplazar el resultado.

Los prismas usan la misma InstancedMesh; sólo cambian las dimensiones locales.
Las fórmulas respetan dy dx en Tipo I y dx dy en Tipo II, con pasos interiores variables.
El Worker de convergencia usa el integrador general sin duplicar reglas numéricas.
La representación rectangular por franjas no certifica que toda la base dibujada esté
dentro del dominio curvo. Sólo las muestras de f se toman en su intervalo interior.

## Semana 5: polares

```js
const region = { type: 'polar', rMin: 0, rMax: 2, thetaMin: 0, thetaMax: '2*pi' };
// coordinates: 'cartesian' (predeterminado) o 'polar'.
// f='x^2+y^2' en cartesian equivale a f='r^2' en polar.
```

`polar.js` valida radios y ángulos, rechaza vueltas superpuestas, normaliza los
ángulos constantes y construye n² celdas. No permite radios negativos, intervalos
degenerados o pasos que pierdan precisión. Los límites angulares no admiten variables.
Las celdas polares contienen r0/r1, theta0/theta1, sampleR/sampleTheta,
sampleX/sampleY, jacobian y area. El integrador añade value y aplica el área una sola vez.
`compilePolarExpression` sólo expone r, theta/θ y constantes, con el mismo AST restringido.

Los resultados polares añaden dr/dTheta y boundaryLoops; una vuelta completa no
dibuja una costura radial ficticia. El anillo conserva ambos contornos y su hueco.
La cámara usa bounds cartesianos calculados con los extremos angulares y cardinales.

La geometría cartesiana conserva InstancedMesh. Los sectores polares se agrupan
en una BufferGeometry con un único Mesh y material: se eligió esta representación
porque el radio interior y el exterior varían entre anillos y una escala afín de
una caja no produce sectores anulares. Se mantienen draw calls acotados (menos de
20 en las pruebas con 16384 celdas), a cambio de más vértices. Los buffers se liberan
al reemplazar el resultado. Los colores y la altura distinguen el signo.
La superficie opcional une muestras y cierra la costura angular sólo para vueltas
completas con n≥3; no representa exactamente la función ni completa el borde radial.

`polarMapping.js` dibuja dos diagramas SVG del mismo índice de celda y muestra
coordenadas, J y ΔA en texto. El panel no modifica la suma ni cambia la resolución.
Cambiar cualquier entrada oculta el panel y la tabla para evitar datos obsoletos.
