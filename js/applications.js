/** Magnitudes por punto medio sobre las mismas celdas; la densidad no es altura. */
export function analyzeApplication(result, model = 'integral') {
  if (!['integral', 'solid', 'lamina'].includes(model)) throw new Error('Modelo físico desconocido.');
  if (model === 'integral') return null;
  if (result.cells.some(({ value }) => value < 0)) throw new Error(model === 'solid'
    ? 'El sólido requiere alturas no negativas. Para valores negativos usa Integral firmada.'
    : 'La lámina requiere densidad no negativa.');
  const sums = Array(5).fill(0), corrections = Array(5).fill(0);
  for (const { sampleX: x, sampleY: y, value: f, area } of result.cells) {
    const weight = f * area;
    const terms = [x * weight, y * weight, f * weight / 2, y * y * weight, x * x * weight];
    terms.forEach((term, i) => {
      const adjusted = term - corrections[i], next = sums[i] + adjusted;
      corrections[i] = (next - sums[i]) - adjusted; sums[i] = next;
    });
  }
  if (!sums.every(Number.isFinite)) throw new Error('Una magnitud física excede la precisión numérica.');
  const total = result.approximation;
  const centroid = total > 0 ? { x: sums[0] / total, y: sums[1] / total, z: model === 'solid' ? sums[2] / total : 0 } : null;
  return model === 'solid' ? { model, volume: total, centroid }
    : { model, mass: total, centroid, Ix: sums[3], Iy: sums[4], IO: sums[3] + sums[4] };
}
