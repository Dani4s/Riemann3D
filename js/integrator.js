import { compileExpression, compilePolarExpression } from './expressionValidator.js';
import { createPartition } from './geometry.js';
import { analyzeApplication } from './applications.js';

/** Función sin DOM ni Three.js. Nunca devuelve una suma parcial con celdas inválidas. */
export function integrate({ expression, region, resolution = 32, rule = 'midpoint', coordinates = 'cartesian', model = 'integral' } = {}) {
  const start = performance.now();
  if (rule !== 'midpoint') throw new Error('Sólo se admite la regla del punto medio.');
  if (!['cartesian', 'polar'].includes(coordinates) || (coordinates === 'polar' && region?.type !== 'polar')) throw new Error('Las variables r/θ requieren una región polar.');
  const evaluate = coordinates === 'polar' ? compilePolarExpression(expression) : compileExpression(expression);
  const partition = createPartition(region, resolution);
  let sum = 0;
  let compensation = 0;
  let negativeSamples = 0;
  const cells = partition.cells.map((cell, index) => {
    if (index % 32 === 0 && performance.now() - start > 1500) throw new Error('Se excedió el tiempo máximo de cálculo (1,5 s).');
    let value;
    try { value = coordinates === 'polar' ? evaluate(cell.sampleR, cell.sampleTheta) : evaluate(cell.sampleX, cell.sampleY); }
    catch (error) { throw new Error(`Celda ${index + 1}, punto (${cell.sampleX}, ${cell.sampleY}): ${error.message}`); }
    if (value < 0) negativeSamples++;
    const contribution = value * cell.area;
    if (!Number.isFinite(contribution)) throw new Error('Una contribución excede la precisión numérica.');
    // Suma compensada de Kahan para reducir la pérdida por redondeo.
    const adjusted = contribution - compensation;
    const next = sum + adjusted;
    compensation = (next - sum) - adjusted;
    sum = next;
    return { ...cell, value };
  });
  if (!Number.isFinite(sum)) throw new Error('La suma no es un número finito.');
  const result = {
    expression: expression.trim(), region: partition.region, resolution, rule, coordinates,
    approximation: sum, dx: partition.dx, dy: partition.dy, cells,
    bounds: partition.bounds, boundary: partition.boundary,
    ...(partition.region.type === 'polar' ? { dr: partition.dr, dTheta: partition.dTheta, boundaryLoops: partition.boundaryLoops } : {}),
    diagnostics: negativeSamples ? [`Hay ${negativeSamples} muestras negativas; el resultado es una integral firmada, no un volumen geométrico.`] : [],
  };
  result.model = model;
  result.application = analyzeApplication(result, model);
  return result;
}

/** Compatibilidad con la API de semana 2; no acepta tipos nuevos silenciosamente. */
export function integrateRectangle(request) {
  if (request?.region?.type !== 'rectangle') throw new Error('integrateRectangle requiere una región rectangular.');
  return integrate(request);
}
