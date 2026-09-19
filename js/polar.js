import { compileExpression } from './expressionValidator.js';

export const TAU = 2 * Math.PI;
export function polarToCartesian(r, theta) {
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

function angle(value, label) {
  let number = value;
  if (typeof value === 'string') {
    try { number = compileExpression(value, [])(0, 0); }
    catch (error) { throw new Error(`${label}: ${error.message}`); }
  }
  if (!Number.isFinite(number) || Math.abs(number) > 10000) throw new Error(`${label} debe ser finito y tener magnitud ≤ 10000 radianes.`);
  return number;
}

export function createPolarPartition(region, resolution) {
  const { rMin, rMax } = region;
  if (![rMin, rMax].every((value) => Number.isFinite(value) && value >= 0 && value <= 10000) || rMin >= rMax) {
    throw new Error('Los radios deben cumplir 0 ≤ r mínimo < r máximo ≤ 10000.');
  }
  const thetaMin = angle(region.thetaMin, 'Ángulo inicial');
  const thetaMax = angle(region.thetaMax, 'Ángulo final');
  const span = thetaMax - thetaMin;
  if (span <= 0 || span > TAU + 1e-12) throw new Error('Los ángulos deben crecer y abarcar como máximo 2π radianes (una vuelta).');
  if (!Number.isInteger(resolution) || resolution < 1 || resolution > 128) throw new Error('La resolución debe ser un entero entre 1 y 128.');
  const dr = (rMax - rMin) / resolution;
  const dTheta = span / resolution;
  const cells = [];
  for (let i = 0; i < resolution; i++) {
    const r0 = rMin + i * dr, r1 = i === resolution - 1 ? rMax : rMin + (i + 1) * dr;
    const sampleR = r0 + (r1 - r0) / 2;
    for (let j = 0; j < resolution; j++) {
      const theta0 = thetaMin + j * dTheta, theta1 = j === resolution - 1 ? thetaMax : thetaMin + (j + 1) * dTheta;
      const sampleTheta = theta0 + (theta1 - theta0) / 2;
      const area = sampleR * (r1 - r0) * (theta1 - theta0);
      if (!(r0 < sampleR && sampleR < r1 && theta0 < sampleTheta && sampleTheta < theta1) || !Number.isFinite(area) || area <= 0) throw new Error('La partición polar pierde precisión; amplía la región o reduce n.');
      const { x, y } = polarToCartesian(sampleR, sampleTheta);
      cells.push({ r0, r1, theta0, theta1, sampleR, sampleTheta, sampleX: x, sampleY: y, jacobian: sampleR, area });
    }
  }
  const arc = (r) => Array.from({ length: 257 }, (_, k) => polarToCartesian(r, thetaMin + span * k / 256));
  const outer = arc(rMax), inner = arc(rMin);
  const fullCircle = Math.abs(span - TAU) < 1e-12;
  const boundaryLoops = fullCircle ? (rMin > 0 ? [outer, inner] : [outer]) : [[...outer, ...inner.reverse(), outer[0]]];
  const boundary = boundaryLoops.flat();
  // Extremos exactos en direcciones cardinales además de extremos del arco.
  const extrema = [polarToCartesian(rMin, thetaMin), polarToCartesian(rMin, thetaMax), polarToCartesian(rMax, thetaMin), polarToCartesian(rMax, thetaMax)];
  for (let k = Math.ceil(thetaMin / (Math.PI / 2)); k <= Math.floor(thetaMax / (Math.PI / 2)); k++) {
    extrema.push(polarToCartesian(rMin, k * Math.PI / 2), polarToCartesian(rMax, k * Math.PI / 2));
  }
  const bounds = { a: Math.min(...extrema.map((p) => p.x)), b: Math.max(...extrema.map((p) => p.x)), c: Math.min(...extrema.map((p) => p.y)), d: Math.max(...extrema.map((p) => p.y)) };
  return { region: { type: 'polar', rMin, rMax, thetaMin, thetaMax }, resolution, cells, bounds, boundary, boundaryLoops, dr, dTheta, dx: null, dy: null };
}
