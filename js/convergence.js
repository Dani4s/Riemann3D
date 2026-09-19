import { integrate } from './integrator.js';

export const CONVERGENCE_RESOLUTIONS = Object.freeze([4, 8, 16, 32, 64]);

/** p no se informa cuando los errores son nulos o cercanos al redondeo. */
export function observedOrder(previousError, error, scale = 1) {
  const floor = 64 * Number.EPSILON * Math.max(1, Math.abs(scale));
  if (!Number.isFinite(previousError) || !Number.isFinite(error) || previousError <= floor || error <= floor) return null;
  return Math.log2(previousError / error);
}

export function calculateConvergence(request, exact = null, onProgress = () => {}) {
  if (exact !== null && !Number.isFinite(exact)) throw new Error('El valor exacto debe ser finito o desconocido.');
  const rows = [];
  for (const resolution of CONVERGENCE_RESOLUTIONS) {
    const start = performance.now();
    const result = integrate({ ...request, resolution });
    const previous = rows.at(-1);
    const error = exact === null ? null : Math.abs(exact - result.approximation);
    const difference = previous ? Math.abs(result.approximation - previous.approximation) : null;
    const order = exact === null ? null : observedOrder(previous?.error, error, exact);
    rows.push({ resolution, cells: resolution ** 2, approximation: result.approximation, error, difference, order, milliseconds: performance.now() - start });
    onProgress(rows.length, CONVERGENCE_RESOLUTIONS.length);
  }
  return { exact, rows };
}
