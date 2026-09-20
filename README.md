# Riemann3D — Entrega de las semanas 1–6

Base de una calculadora visual de integrales múltiples para Cálculo Vectorial, FES Aragón, UNAM.
Semanas 1–6 del plan corregido v2.0: regiones rectangulares, Tipo I/II y polares,
visualización de celdas, jacobiano, mapeo, KaTeX, convergencia, sólidos y láminas.
El propósito es conectar cada integral con su geometría, sus unidades y una
referencia analítica que permita evaluar la aproximación.

[Repositorio](https://github.com/Dani4s/Riemann3D) ·
[Aplicación](https://dani4s.github.io/Riemann3D/) ·
[Fundamentos y derivaciones](docs/fundamentos.md) ·
[Validación numérica](docs/validacion-numerica.md) ·
[Presentación de 10 diapositivas](docs/presentacion/Riemann3D.pptx) ·
[Guion de 10 minutos](docs/presentacion/guion.md)

## Modelos físicos

El selector **Modelo** distingue integral firmada, sólido bajo z=f con densidad
volumétrica uniforme y lámina plana con densidad superficial ρ. La selección de
un preset también carga su modelo. Los sólidos muestran volumen y centroide 3D;
las láminas muestran masa, centroide e Ix, Iy, IO respecto de los ejes coordenados.
En láminas, el color muestra densidad y toda la malla permanece en z=0.
La escala de color se ajusta al máximo de cada cálculo; la tabla conserva los valores.

u es tu unidad de longitud y uₘ tu unidad de masa; no se convierten unidades.
Alturas o densidades negativas detectadas invalidan el modelo físico. Con total
cero se informa que el centroide no está definido. La comprobación por muestras
no demuestra positividad en toda la región.

Tres nuevos presets verifican caja uniforme, semicírculo y disco de masa unitaria.
La escena marca el centroide aproximado con un punto dorado C y muestra sus
coordenadas junto al control «Mostrar centroide C». El punto se dibuja a través
de la superficie para localizar centroides interiores. Su tamaño es ilustrativo.
Puede ocultarse; no aparece en integrales firmadas ni cuando el total es cero.
Se completan así los seis casos exigidos por el plan, con doce presets en total.
La convergencia sigue la integral principal (volumen o masa en física); la tabla
física muestra las referencias y errores de centroides e inercias cuando se conocen.

## Ejecutar localmente

Desde esta carpeta, con Python 3:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Abre http://127.0.0.1:8000 en un navegador moderno con WebGL 2 y soporte de import maps.
No abrir `index.html` mediante doble clic: los módulos ES necesitan un servidor HTTP.
Detén el servidor con Ctrl+C. No requiere npm install, framework ni compilación.
Three.js 0.180.0, math.js 14.8.1 y KaTeX 0.16.22 con sus fuentes están incluidos en `vendor/`;
funciona sin conexión a Internet. Todos los enlaces son relativos para alojamiento estático.

## Calcular una integral

Pulsa el campo de función o densidad (o Enter con el campo enfocado) para abrir
la calculadora matemática. Incluye vista previa KaTeX, teclado de números,
variables, π, e, raíces, potencias y funciones. Selecciona texto para reemplazarlo
o envolverlo con una función. Aplicar actualiza la entrada; Cancelar o Escape
conservan el valor anterior. El cálculo de dominio y positividad se ejecuta al
pulsar Calcular. El editor usa el mismo validador de expresiones de la aplicación.

Al terminar, «Cómo se resolvió · paso a paso» explica el método numérico con los
datos vigentes: dominio, partición, primer punto medio, área, evaluación y suma.
En física añade momentos, centroides e inercias; en los presets incluye la
referencia analítica. Se puede plegar con clic o teclado. No es un integrador
simbólico automático. `js/solutionSteps.js` genera este desglose y
`tests/steps-check.mjs` comprueba los doce presets, móvil y recuperación de errores.
`js/stepFormulas.js` presenta los cálculos con KaTeX: fracciones, sumatorias,
subíndices y sustituciones numéricas. Las fórmulas incluyen MathML y desplazamiento
horizontal por teclado en pantallas pequeñas; la entrada se transforma desde el AST validado.

Selecciona un caso o escribe `f(x,y)` y elige el tipo de región:

- Rectangular: D = [a,b] × [c,d].
- Tipo I: a ≤ x ≤ b, g₁(x) ≤ y ≤ g₂(x); los límites interiores sólo admiten x.
- Tipo II: c ≤ y ≤ d, h₁(y) ≤ x ≤ h₂(y); los límites interiores sólo admiten y.
- Polar: radios constantes 0 ≤ rMin < rMax y ángulos crecientes que cubran como
  máximo 2π radianes. Admite discos, anillos y sectores anulares. En los ángulos
  puedes escribir `pi/2`, `2*pi` o una expresión constante permitida.

Pulsa **Calcular aproximación**. El primer caso se calcula al abrir la aplicación.
El control de resolución admite n entero entre 1 y 128 (hasta 16384 celdas) y actualiza
automáticamente tras 350 ms sin cambios. El valor inicial es n=32.
Los resultados de referencia incluyen valor exacto, derivación y error absoluto.
Al editar se cancelan los trabajadores y se retiran resultado, prismas y tablas anteriores.
Cambiar sólo n conserva el caso de referencia y su valor exacto.

La tabla evalúa n=4,8,16,32,64 en un Worker separado y muestra progreso.
Con valor exacto: error absoluto y p=log₂(Eₙ/₂/Eₙ). Sin valor exacto: diferencia
entre iteraciones, etiquetada como indicador, sin afirmar un error exacto ni un orden.
Si el error es cero o cercano al redondeo, p se muestra como «—».

Sintaxis: números, variables x/y, constantes pi/e, operadores + − * / ^,
y funciones de un argumento sin, cos, tan, sqrt, abs, exp y log (natural).
Ángulos en radianes; usa punto decimal y `*` para multiplicación explícita.
Se admiten valores negativos como integral firmada, con una advertencia.

En región polar puedes mantener **f(x,y)**: se evalúa en x=r cosθ, y=r sinθ;
o elegir **f(r,θ)** y escribir `r`, `theta` o `θ`. No se mezclan ambos grupos de
variables. El jacobiano r se aplica automáticamente: no lo añadas a la función.

Se rechazan asignaciones, accesos, funciones de usuario, símbolos desconocidos,
resultados complejos/no finitos y celdas inválidas. No se omiten celdas silenciosamente.
Límites: 256 caracteres, 24 niveles de AST, 128 nodos, |coordenadas| ≤ 10000,
|f| ≤ 10⁶. El cálculo comprueba un presupuesto de 1,5 s; la interfaz termina el
Worker tras 5 s incluyendo carga. Un error no presenta una suma parcial.

### Casos rectangulares a n=32

| Caso | Función y región | Exacto | Aproximación | Error relativo |
| --- | --- | --- | --- | --- |
| Prisma inclinado | x+y; [0,2]×[0,1] | 3 | 3 | 0 % |
| Altura constante | 2; [0,2]×[0,3] | 12 | 12 | 0 % |
| Paraboloide rectangular | x²+y²; [0,1]² | 2/3 | 0.66650390625 | 0.0244140625 % |

Derivaciones: para el primero, integrar en y da x+1/2 y luego 3;
para el segundo, altura 2 por área 6 da 12; para el tercero, cada término
cuadrático aporta 1/3. El tercer caso es rectangular, distinto del preset polar
con resultado 8π del plan, incorporado en semana 5.

### Casos entre curvas a n=32

| Caso | Región y función | Exacto | Aproximación | Error relativo |
| --- | --- | --- | --- | --- |
| Entre curvas · Tipo I | 0≤x≤1, x²≤y≤x; f=1 | 1/6 | 0.166748046875 | 0.048828125 % |
| Entre curvas · Tipo II | 0≤y≤1, y≤x≤√y; f=1 | 1/6 | 0.166982686478 | 0.189611887 % |
| Triángulo ponderado · Tipo II | 0≤y≤1, 0≤x≤1−y; f=x+2y | 1/2 | 0.500122070313 | 0.0244140625 % |

El primer caso es el preset corregido del plan: ∫₀¹(x−x²)dx = 1/6.
La misma región en Tipo II da ∫₀¹(√y−y)dy = 1/6. La raíz no tiene derivada
finita en y=0; el orden observado puede diferir de 2 y ambos órdenes no tienen
por qué dar la misma aproximación para una n finita. En el triángulo, integrar
primero en x da 1/2+y−3y²/2; integrar entre 0 y 1 da 1/2.

En cada franja se toman los límites interiores en su punto medio exterior y se
subdivide ese intervalo en n celdas. El área local Δx·Δy depende de la franja.
Se evalúa f sólo en los puntos interiores de la región, sin omitir celdas inválidas.
Los límites se revisan en 257 puntos del intervalo exterior y en los n puntos medios.
Se permiten coincidencias en los extremos (cierre de la región), pero se rechazan
franjas degeneradas, cruces, valores no finitos, límites fuera de rango o pérdida
de precisión detectados. Una comprobación finita no certifica el orden de funciones
arbitrarias entre muestras. Los errores indican la coordenada problemática.

## Controles

### Casos polares a n=32

| Caso | Función y región | Exacto | Aproximación | Error relativo |
| --- | --- | --- | --- | --- |
| Paraboloide | x²+y²; disco r≤2 | 8π | 25.120469382415 | 0.048828125 % |
| Hemisferio | √(1−x²−y²); disco r≤1 | 2π/3 | 2.097607979526 | 0.153403583 % |
| Sector anular | 1; 1≤r≤2, 0≤θ≤π/2 | 3π/4 | 2.356194490192 | 0 % |

Paraboloide: ∫₀²π∫₀² r³ dr dθ = 8π; el error del punto medio es 4π/n²,
por lo que p≈2. Hemisferio: ∫₀²π∫₀¹ √(1−r²)r dr dθ = 2π/3; la singularidad
de la derivada en r=1 puede alterar el orden observado. El área del sector es
(rMax²−rMin²)(θMax−θMin)/2 = 3π/4.

Cada celda usa el punto medio en r/θ, el jacobiano J=rᵢ y el área rᵢ Δr Δθ.
Para límites radiales constantes, esta área coincide exactamente con el área
del sector anular; la aproximación numérica está en la función muestreada.
Los arcos de la escena se aproximan con segmentos (como máximo π/24 por segmento)
y su área poligonal no sustituye al área usada por el integrador.

El panel **Mapeo (r, θ) → (x, y)** muestra una celda elegida con un deslizador,
su rectángulo de parámetros, el sector en XY, coordenadas, jacobiano, área y
contribución. La tabla de celdas añade r, θ y J al usar polares.

### Cámara y datos

Arrastra para girar, rueda o pellizco para zoom, clic derecho y arrastre para desplazar.
Enfoca el lienzo con Tab: flechas para girar, +/− para zoom y R para restablecer.
También hay un botón de restablecimiento. La tabla desplegable presenta los datos sin depender del 3D.
El plano base es XY y Z es la altura. Los prismas representan las celdas calculadas,
con bases completas y alturas firmadas: negativos debajo de XY, positivos encima.
La opción de superficie interpola entre los centros muestreados; no es una superficie
exacta ni cubre el borde de la región. La tabla de celdas permite revisar todos los
datos en páginas de 32 filas. La cámara se ajusta a la región y mantiene la escala real.
El contorno dorado está muestreado sobre XY. En Tipo I/II las bases rectangulares
pueden sobresalir de la curva entre los puntos de muestreo: son una aproximación
por franjas, no un recorte geométrico exacto. Esto se explica también en la interfaz.

## Archivos

| Ruta | Responsabilidad |
| --- | --- |
| `index.html` | Estructura accesible e import map local |
| `css/style.css` | Interfaz adaptable a escritorio y móvil |
| `js/main.js` | Arranque, estado, errores y tabla textual |
| `js/expressionValidator.js` | Lista blanca del AST de math.js antes de compilar y evaluación finita |
| `js/geometry.js` | Particiones rectangulares y Tipo I/II, validación y contorno |
| `js/integrator.js` | Punto medio, suma compensada y diagnóstico de muestras |
| `js/integrationWorker.js` | Cálculo fuera del hilo de interfaz |
| `js/calculator.js` | Formulario, estado y resultados; cancela trabajo al editar |
| `js/presets.js` | Doce casos: nueve de integración y tres de aplicaciones físicas |
| `js/applications.js` | Volumen, masa, centroides e inercias; rechazo de negativos y total nulo |
| `js/physicalUI.js` | Fórmulas, unidades, referencias y errores de magnitudes físicas |
| `js/polar.js` | Validación y partición polar, jacobiano, contornos y mapeo numérico |
| `js/polarMapping.js` | Panel interactivo de transformación y área de la celda |
| `js/meshBuilder.js` | InstancedMesh, colores de celdas, superficie muestreada y liberación |
| `js/convergence.js` | Serie n=4..64, errores/diferencias y orden observado |
| `js/latex.js` | Fórmulas KaTeX desde el AST validado, con MathML accesible |
| `js/ui.js` | Tabla paginada de todas las celdas |
| `js/demoData.js` | Datos de las cuatro cajas estáticas |
| `js/sceneContent.js` | Geometría, ejes, cuadrícula XY, cámara Z-up y luces |
| `js/scene.js` | WebGL, OrbitControls, teclado, resize y limpieza |
| `tests/scene.test.js` | Pruebas sin navegador usando node:test |
| `tests/week3.test.js`, `tests/week4.test.js`, `tests/week5.test.js` | Mallas, fórmulas, convergencia, regiones variables y polares |
| `tests/expressionValidator.test.js`, `geometry.test.js`, `integrator.test.js`, `presets.test.js` | Validación, particiones, exactitud y rechazo de entradas |
| `tests/index.html`, `tests/browser.js` | Pruebas reales de WebGL e interacción |
| `docs/arquitectura.md` | Convenciones y contratos de datos implementados |
| `docs/verificacion.md` | Evidencia de la validación local |
| `vendor/three/` | Three.js y OrbitControls fijados, licencia y procedencia |
| `vendor/mathjs/` | math.js 14.8.1, licencia y adaptación ES documentada |
| `vendor/katex/` | KaTeX 0.16.22, estilos, fuentes y licencia MIT |
| `package.json` | Módulos ES y comando de pruebas; sin dependencias npm |
| `.gitignore` | Excluye temporales y dependencias de desarrollo |

## Pruebas

Con Node.js 20 o posterior:

```sh
node --test tests/*.test.js
```

Sin instalar nada: verifica expresiones válidas/prohibidas, límites y precisión de la región,
muestreo, integrales firmadas, exactitud de presets y reducción del error cuadrático.
También conserva las pruebas de geometría y recursos de la escena de semana 1.
`npm test` ejecuta la misma suite si tienes npm operativo. En este equipo se usó Node
directamente porque la instalación global de npm apunta a un `npm-cli.js` ausente.
Con el servidor activo, abre http://127.0.0.1:8000/tests/ para comprobar los nueve casos disponibles, el rechazo de asignaciones y WebGL,
renderizado, giro con teclado, restablecimiento, redimensionado y nuevo montaje.
Para revisión manual, arrastra la escena, aplica zoom, restablece y reduce el ancho de la ventana.

`tests/local-check.mjs` es una comprobación opcional con Playwright: abre Chromium,
prueba el arrastre, detecta errores HTTP/consola y captura escritorio/móvil en
`docs/screenshots/`. Requiere Playwright y su Chromium instalados sólo para desarrollo;
puedes indicar una instalación existente con `PLAYWRIGHT_MODULE`. Se ejecuta con
`node tests/local-check.mjs` mientras el servidor está activo.

## Límites de esta entrega

Las seis semanas están implementadas. No incluye radios dependientes del ángulo,
integrales triples ni teoremas de Green/Stokes (extensiones opcionales).
Las comprobaciones sólo cubren puntos muestreados:
singularidades entre muestras pueden pasar inadvertidas; una suma finita no prueba integrabilidad.
Se requiere soporte WebGL 2 para el 3D; si falla, se informa y el cálculo y las tablas siguen disponibles.
Para publicar este MVP basta servir esta carpeta como sitio estático; no se requiere build.
Las capturas y resultados de verificación están en `docs/verificacion.md`.

Para las pruebas adicionales de física usa `node tests/physical-check.mjs` con
Playwright de desarrollo. `node tests/validation-report.mjs` regenera la tabla
de errores y tiempos. Las pruebas Node incluyen 49 casos y no necesitan Playwright.

## Publicación

GitHub Pages sirve la raíz de la rama publicada; `.nojekyll` evita procesar el sitio
con Jekyll. El proyecto sigue siendo estático, sin compilación. Para actualizar,
ejecuta las pruebas y sube los cambios a la rama configurada en Settings → Pages.
Consulta [la API oficial de Pages](https://docs.github.com/en/rest/pages/pages)
para reproducir su configuración. No hay claves ni servicios externos requeridos.

Referencia técnica: [documentación oficial de Three.js](https://threejs.org/docs/).
El validador inspecciona el árbol antes de compilar, usando las APIs documentadas en
[árboles de expresiones de math.js](https://mathjs.org/docs/expressions/expression_trees.html).
