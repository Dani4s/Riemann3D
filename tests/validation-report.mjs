import { writeFile } from 'node:fs/promises';
import { integrate } from '../js/integrator.js';
import { PRESETS } from '../js/presets.js';
const lines = ['# Validación numérica reproducible', '', `Ejecución: ${new Date().toISOString()}. Node ${process.version}. n=64; tiempos del cálculo sin renderizado, una ejecución por caso, no un benchmark estadístico.`, '', '| Caso | Aproximación | Exacto | Error absoluto | Tiempo ms |', '| --- | ---: | ---: | ---: | ---: |'];
for (const preset of PRESETS) {
  const start = performance.now(), result = integrate({ ...preset, resolution: 64 }), ms = performance.now() - start;
  lines.push(`| ${preset.name} | ${result.approximation.toPrecision(12)} | ${preset.exact.toPrecision(12)} | ${Math.abs(result.approximation - preset.exact).toExponential(4)} | ${ms.toFixed(3)} |`);
  if (preset.reference) for (const [key, exact] of Object.entries(preset.reference)) {
    const value = result.application.centroid?.[key] ?? result.application[key];
    lines.push(`| ↳ ${key} | ${value.toPrecision(12)} | ${exact.toPrecision(12)} | ${Math.abs(value - exact).toExponential(4)} | — |`);
  }
}
lines.push('', 'Reproducir desde la raíz: `node tests/validation-report.mjs`. Los tiempos cambian con el equipo, el calentamiento del motor y la carga. Las unidades se especifican en la interfaz y en fundamentos.md.');
await writeFile('docs/validacion-numerica.md', lines.join('\n') + '\n');
console.log('Informe generado: docs/validacion-numerica.md');
