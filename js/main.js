import { mountCalculator } from './calculator.js';
import { mountCellTable } from './ui.js';
import { mountPolarMapping } from './polarMapping.js';
import { mountExpressionEditor } from './expressionEditor.js';

const table = mountCellTable();
const mapping = mountPolarMapping();
const status = document.querySelector('#status');
const viewport = document.querySelector('#viewport');
let app;
try {
  const { mountScene } = await import('./scene.js');
  app = mountScene(viewport, { demo: false });
  const button = document.querySelector('#reset');
  button.disabled = false;
  button.addEventListener('click', app.reset);
  document.querySelector('#surface-toggle').addEventListener('change', (event) => app.setSurfaceVisible(event.target.checked));
  document.querySelector('#centroid-toggle').addEventListener('change', (event) => app.setCentroidVisible(event.target.checked));
  status.textContent = 'Escena lista';
  window.addEventListener('pagehide', (event) => { if (!event.persisted) app.dispose(); });
} catch (error) {
  status.textContent = 'Escena no disponible';
  const message = document.createElement('p');
  message.className = 'error'; message.setAttribute('role', 'alert');
  message.textContent = 'No se pudo iniciar WebGL 2. Los cálculos, las fórmulas y las tablas siguen disponibles.';
  viewport.replaceChildren(message);
  console.error('Error al iniciar Riemann3D:', error);
}
mountCalculator({
  onInvalidate() {
    document.querySelector('#centroid-toggle').disabled = true;
    document.querySelector('#centroid-description').textContent = 'Sin centroide vigente. Calcula para actualizar.';
    document.querySelector('#centroid-visibility-note').hidden = true;
    app?.clearResult(); table.setResult(null); mapping.setResult(null);
    document.querySelector('#scene-summary').textContent = 'Sin resultado vigente';
  },
  onResult(result) {
    const centroid = result.application?.centroid;
    document.querySelector('#centroid-toggle').disabled = !centroid || !app;
    const coordinate = value => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 5 }).format(Math.abs(value) < 0.000005 ? 0 : value);
    document.querySelector('#centroid-description').textContent = centroid
      ? `C ≈ (${coordinate(centroid.x)}, ${coordinate(centroid.y)}, ${coordinate(centroid.z)}) u · coordenadas (x̄, ȳ, z̄).`
      : result.application ? 'Total muestreado cero: el centroide no está definido.' : 'Selecciona un sólido o una lámina para calcular su centroide.';
    document.querySelector('#centroid-visibility-note').hidden = !centroid || !app;
    document.querySelector('#surface-toggle').disabled = result.model === 'lamina';
    document.querySelector('#visual-model-note').textContent = result.model === 'lamina'
      ? 'Densidad: oscuro = 0; verde claro = máximo muestreado. La escala de color se ajusta a cada cálculo. Consulta las densidades exactas de las muestras en la tabla. Toda la lámina está en z=0.'
      : 'Positivos sobre XY; negativos debajo. Los tonos alternos distinguen celdas sin reducir su base. Escala real, sin exageración vertical.';
    app?.setResult(result); table.setResult(result); mapping.setResult(result);
    const negative = result.cells.filter((cell) => cell.value < 0).length;
    const zero = result.cells.filter((cell) => cell.value === 0).length;
    document.querySelector('#scene-summary').textContent = `${result.cells.length} celdas · ${negative} negativas · ${zero} de altura cero`;
    viewport.setAttribute('aria-label', `${result.cells.length} prismas de la función ${result.expression}; ${negative} bajo XY y ${zero} de altura cero. Escala real, sin exageración vertical.`);
    if (result.model === 'lamina') {
      document.querySelector('#scene-summary').textContent = `${result.cells.length} celdas · lámina en z=0 · claro = mayor densidad`;
      viewport.setAttribute('aria-label', `Lámina plana de densidad ${result.expression}. Los valores numéricos están en la tabla de celdas.`);
    }
  },
});
mountExpressionEditor();
