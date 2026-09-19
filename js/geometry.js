import { compileBoundaryExpression } from './expressionValidator.js';
import { createPolarPartition } from './polar.js';

export const MAX_RESOLUTION = 128;
export const MAX_COORDINATE = 10000;

export function validateRectangle(region) {
  if (!region || region.type !== 'rectangle') throw new Error('Esta etapa sólo admite regiones rectangulares.');
  const { a, b, c, d } = region;
  for (const value of [a, b, c, d]) {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE) throw new Error('Los límites deben ser números finitos entre −10000 y 10000.');
  }
  if (a >= b || c >= d) throw new Error('Los límites deben cumplir a < b y c < d.');
  return { type: 'rectangle', a, b, c, d };
}

/** Tipos I/II: punto medio exterior y subdivisión del intervalo interior local. */
export function createPartition(region, resolution) {
  if (region?.type === 'polar') return createPolarPartition(region, resolution);
  if (region?.type === 'rectangle') {
    const partition = createRectanglePartition(region, resolution);
    const { a, b, c, d } = partition.region;
    return { ...partition, bounds: { a, b, c, d }, boundary: [{ x: a, y: c }, { x: b, y: c }, { x: b, y: d }, { x: a, y: d }, { x: a, y: c }] };
  }
  if (!region || !['typeI', 'typeII'].includes(region.type)) throw new Error('Elige región rectangular, Tipo I o Tipo II.');
  if (!Number.isInteger(resolution) || resolution < 1 || resolution > MAX_RESOLUTION) throw new Error('La resolución debe ser un entero entre 1 y 128.');
  const isTypeI = region.type === 'typeI';
  const variable = isTypeI ? 'x' : 'y';
  const start = isTypeI ? region.a : region.c;
  const end = isTypeI ? region.b : region.d;
  if (![start, end].every((value) => Number.isFinite(value) && Math.abs(value) <= MAX_COORDINATE)) throw new Error('Los límites exteriores deben ser finitos entre −10000 y 10000.');
  if (start >= end) throw new Error(`Los límites exteriores deben cumplir ${isTypeI ? 'a < b' : 'c < d'}.`);
  let lower, upper;
  try { lower = compileBoundaryExpression(region.lower, variable); }
  catch (error) { throw new Error(`Límite inferior: ${error.message}`); }
  try { upper = compileBoundaryExpression(region.upper, variable); }
  catch (error) { throw new Error(`Límite superior: ${error.message}`); }
  function interval(t, endpoint = false) {
    let lo, hi;
    try { lo = lower(t); hi = upper(t); }
    catch (error) { throw new Error(`Límites en ${variable}=${t}: ${error.message}`); }
    if (Math.abs(lo) > MAX_COORDINATE || Math.abs(hi) > MAX_COORDINATE) throw new Error(`Límites fuera de rango en ${variable}=${t}. Máximo absoluto: 10000.`);
    if (lo > hi) throw new Error(`Límites invertidos en ${variable}=${t}: el inferior supera al superior.`);
    if (lo === hi && !endpoint) throw new Error(`Franja degenerada en ${variable}=${t}: los límites coinciden en el interior.`);
    return [lo, hi];
  }
  // Comprobación finita del borde; no pretende certificar funciones arbitrarias.
  const lowerPoints = [], upperPoints = [];
  for (let k = 0; k <= 256; k++) {
    const t = k === 256 ? end : start + (end - start) * k / 256;
    const [lo, hi] = interval(t, k === 0 || k === 256);
    lowerPoints.push(isTypeI ? { x: t, y: lo } : { x: lo, y: t });
    upperPoints.push(isTypeI ? { x: t, y: hi } : { x: hi, y: t });
  }
  const boundary = [...lowerPoints, ...upperPoints.reverse(), lowerPoints[0]];
  const outerStep = (end - start) / resolution;
  const cells = [];
  for (let i = 0; i < resolution; i++) {
    const t0 = start + i * outerStep;
    const t1 = i === resolution - 1 ? end : start + (i + 1) * outerStep;
    const t = t0 + (t1 - t0) / 2;
    if (!(t0 < t && t < t1)) throw new Error('La partición exterior pierde precisión.');
    const [lo, hi] = interval(t);
    const innerStep = (hi - lo) / resolution;
    for (let j = 0; j < resolution; j++) {
      const u0 = lo + j * innerStep;
      const u1 = j === resolution - 1 ? hi : lo + (j + 1) * innerStep;
      const u = u0 + (u1 - u0) / 2;
      const area = (t1 - t0) * (u1 - u0);
      if (!(u0 < u && u < u1) || !Number.isFinite(area) || area <= 0) throw new Error(`La franja ${i + 1} pierde precisión; no se omite del cálculo.`);
      cells.push(isTypeI
        ? { x0: t0, x1: t1, y0: u0, y1: u1, sampleX: t, sampleY: u, area }
        : { x0: u0, x1: u1, y0: t0, y1: t1, sampleX: u, sampleY: t, area });
    }
  }
  const xs = boundary.map((point) => point.x), ys = boundary.map((point) => point.y);
  // Incluye los rectángulos dibujados además del contorno muestreado.
  const bounds = { a: Math.min(...xs), b: Math.max(...xs), c: Math.min(...ys), d: Math.max(...ys) };
  for (const cell of cells) {
    bounds.a = Math.min(bounds.a, cell.x0); bounds.b = Math.max(bounds.b, cell.x1);
    bounds.c = Math.min(bounds.c, cell.y0); bounds.d = Math.max(bounds.d, cell.y1);
  }
  const normalized = { type: region.type, lower: region.lower.trim(), upper: region.upper.trim(), ...(isTypeI ? { a: start, b: end } : { c: start, d: end }) };
  return { region: normalized, resolution, cells, boundary, bounds,
    dx: isTypeI ? outerStep : null, dy: isTypeI ? null : outerStep };
}

/** Partición rectangular; extremos compartidos, sin huecos ni celdas omitidas. */
export function createRectanglePartition(region, resolution) {
  const rectangle = validateRectangle(region);
  if (!Number.isInteger(resolution) || resolution < 1 || resolution > MAX_RESOLUTION) {
    throw new Error('La resolución debe ser un entero entre 1 y 128.');
  }
  const { a, b, c, d } = rectangle;
  const dx = (b - a) / resolution;
  const dy = (d - c) / resolution;
  const area = dx * dy;
  if (!Number.isFinite(area) || area <= 0) throw new Error('La región es demasiado pequeña para la precisión numérica.');
  const cells = [];
  for (let i = 0; i < resolution; i++) {
    const x0 = a + i * dx;
    const x1 = i === resolution - 1 ? b : a + (i + 1) * dx;
    const sampleX = x0 + (x1 - x0) / 2;
    for (let j = 0; j < resolution; j++) {
      const y0 = c + j * dy;
      const y1 = j === resolution - 1 ? d : c + (j + 1) * dy;
      const sampleY = y0 + (y1 - y0) / 2;
      if (!(x0 < sampleX && sampleX < x1 && y0 < sampleY && sampleY < y1)) {
        throw new Error('La partición pierde precisión; amplía la región o reduce la resolución.');
      }
      cells.push({ x0, x1, y0, y1, sampleX, sampleY, area });
    }
  }
  return { region: rectangle, resolution, dx, dy, cells };
}
