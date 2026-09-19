# Validación numérica reproducible

Ejecución: 2026-09-19T01:57:09.494Z. Node v22.16.0. n=64; tiempos del cálculo sin renderizado, una ejecución por caso, no un benchmark estadístico.

| Caso | Aproximación | Exacto | Error absoluto | Tiempo ms |
| --- | ---: | ---: | ---: | ---: |
| Prisma inclinado | 3.00000000000 | 3.00000000000 | 0.0000e+0 | 40.019 |
| Altura constante | 12.0000000000 | 12.0000000000 | 0.0000e+0 | 5.397 |
| Paraboloide rectangular | 0.666625976563 | 0.666666666667 | 4.0690e-5 | 7.686 |
| Entre curvas · Tipo I | 0.166687011719 | 0.166666666667 | 2.0345e-5 | 4.297 |
| Entre curvas · Tipo II | 0.166780503215 | 0.166666666667 | 1.1384e-4 | 3.321 |
| Triángulo ponderado · Tipo II | 0.500030517578 | 0.500000000000 | 3.0518e-5 | 4.048 |
| Paraboloide · disco r ≤ 2 | 25.1296732671 | 25.1327412287 | 3.0680e-3 | 4.051 |
| Hemisferio · disco unitario | 2.09551014875 | 2.09439510239 | 1.1150e-3 | 7.686 |
| Sector anular · área | 2.35619449019 | 2.35619449019 | 0.0000e+0 | 5.006 |
| Sólido · caja uniforme | 12.0000000000 | 12.0000000000 | 0.0000e+0 | 2.527 |
| ↳ x | 1.00000000000 | 1.00000000000 | 0.0000e+0 | — |
| ↳ y | 1.50000000000 | 1.50000000000 | 0.0000e+0 | — |
| ↳ z | 1.00000000000 | 1.00000000000 | 0.0000e+0 | — |
| Lámina · semicírculo uniforme | 1.57079632679 | 1.57079632679 | 0.0000e+0 | 4.573 |
| ↳ x | 2.51241732650e-17 | 0.00000000000 | 2.5124e-17 | — |
| ↳ y | 0.424429888425 | 0.424413181578 | 1.6707e-5 | — |
| ↳ z | 0.00000000000 | 0.00000000000 | 0.0000e+0 | — |
| ↳ Ix | 0.392651144799 | 0.392699081699 | 4.7937e-5 | — |
| ↳ Iy | 0.392651144799 | 0.392699081699 | 4.7937e-5 | — |
| ↳ IO | 0.785302289598 | 0.785398163397 | 9.5874e-5 | — |
| Lámina · disco de masa unitaria | 1.00000000000 | 1.00000000000 | 0.0000e+0 | 6.782 |
| ↳ x | -1.84314369323e-17 | 0.00000000000 | 1.8431e-17 | — |
| ↳ y | -9.85946350604e-19 | 0.00000000000 | 9.8595e-19 | — |
| ↳ z | 0.00000000000 | 0.00000000000 | 0.0000e+0 | — |
| ↳ Ix | 0.249969482422 | 0.250000000000 | 3.0518e-5 | — |
| ↳ Iy | 0.249969482422 | 0.250000000000 | 3.0518e-5 | — |
| ↳ IO | 0.499938964844 | 0.500000000000 | 6.1035e-5 | — |

Reproducir desde la raíz: `node tests/validation-report.mjs`. Los tiempos cambian con el equipo, el calentamiento del motor y la carga. Las unidades se especifican en la interfaz y en fundamentos.md.
