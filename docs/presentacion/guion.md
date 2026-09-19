# Guion · 10 minutos

## 1. Riemann3D

0:00–0:45. Abrir el explorador. Objetivo: relacionar función, región, suma y representación. La herramienta permite experimentar y contrastar referencias analíticas. Fuente: plan Riemann3D corregido y proyecto local.

## 2. Una muestra por celda

0:45–1:45. Mostrar el caso inclinado: x+y en [0,2]×[0,1], integral exacta 3. Variar n y abrir la tabla textual. Explicar que un dibujo no sustituye la suma. Fuente: docs/fundamentos.md y js/integrator.js.

## 3. Una región, dos órdenes

1:45–2:45. Seleccionar los dos presets entre curvas. Derivar ∫(x−x²)dx=1/6 y ∫(√y−y)dy=1/6. Señalar el contorno y las bases que pueden sobresalir. Fuente: docs/fundamentos.md.

## 4. En polares, el área depende del radio

2:45–4:00. Demostrar en la aplicación el mapeo de una celda cercana y otra lejana al origen. El jacobiano se aplica automáticamente. Los sectores dibujados tienen arcos facetados, pero el área usada es rᵢΔrΔθ. Fuente: docs/fundamentos.md y js/polar.js.

## 5. Sólido bajo una superficie

4:00–5:05. Mostrar la caja de base 2×3 y altura 2. Integrar z entre 0 y f para justificar f²/2; no usar f/2 en el numerador. El volumen se mide en u³ y las coordenadas en u. Fuente: docs/fundamentos.md; captura del proyecto.

## 6. Lámina plana con densidad

5:05–6:10. Separar densidad de altura: no hay un volumen físico. Explicar M=π/2 y momento en y=2/3; su cociente da 4/(3π). La tabla permite revisar la densidad sin depender del color. Fuente: docs/fundamentos.md; captura del proyecto.

## 7. Inercia respecto de los ejes

6:10–7:10. Usar el preset de masa unitaria: ρ=1/π. Explicar la distancia cuadrada al eje. Distinguir estos ejes coordenados de ejes trasladados al centroide. Fuente: docs/fundamentos.md; captura del proyecto.

## 8. El error se comprueba al refinar

7:10–8:10. Mostrar el paraboloide y su convergencia. Duplicar n suele dividir por cuatro el error suave. No afirmar orden dos para toda expresión. Abrir docs/validacion-numerica.md, generado de las mismas funciones numéricas. Fuente: tests/validation-report.mjs y docs/fundamentos.md.

## 9. Cálculo y visualización separados

8:10–9:10. Mostrar estructura del repositorio: expressionValidator, geometry/polar, integrator/applications y scene. El usuario no ejecuta código arbitrario. Las bibliotecas se incluyen localmente. Fuente: README.md, tests y js/. Las pruebas de navegador cubren además recuperación de errores, teclado y móvil.

## 10. Interpretar los resultados con sus límites

9:10–10:00. Cerrar mostrando una entrada inválida y la recuperación. Concluir con el propósito educativo: relacionar geometría, aproximación y significado físico. Las extensiones opcionales del plan no forman parte de esta entrega. Fuente: docs/fundamentos.md y README.md.
