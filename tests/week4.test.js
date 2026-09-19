import test from 'node:test';
import assert from 'node:assert/strict';
import { integrate, integrateRectangle } from '../js/integrator.js';
import { createPartition } from '../js/geometry.js';
import { compileBoundaryExpression } from '../js/expressionValidator.js';
import { VARIABLE_PRESETS } from '../js/presets.js';
import { calculateConvergence } from '../js/convergence.js';
import { formulaTex } from '../js/latex.js';
import { buildPrisms, buildRegionBoundary, disposeMesh } from '../js/meshBuilder.js';
import { Matrix4 } from '../vendor/three/three.module.js';
import katex from '../vendor/katex/katex.mjs';

const typeI = VARIABLE_PRESETS[0].region;
const typeII = VARIABLE_PRESETS[1].region;

for (const preset of VARIABLE_PRESETS) {
  test(`preset variable: ${preset.name}`, () => {
    const result = integrate({ ...preset, resolution: 32 });
    assert.ok(Math.abs(result.approximation - preset.exact) / Math.abs(preset.exact) < 0.01);
    assert.equal(result.cells.length, 1024);
    assert.ok(result.boundary.length > 256);
    for (const tex of Object.values(formulaTex(result))) assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true }));
  });
}
test('entre curvas Tipo I usa el área local y converge a 1/6 con orden dos', () => {
  const result = integrate({ expression: '1', region: typeI, resolution: 32 });
  assert.equal(result.approximation, 1 / 6 + 1 / (12 * 32 ** 2));
  assert.equal(result.dy, null);
  const table = calculateConvergence({ expression: '1', region: typeI }, 1 / 6);
  assert.ok(table.rows.slice(1).every((row) => Math.abs(row.order - 2) < 1e-9));
});
test('puntos de muestreo dentro de la región verdadera en ambos órdenes', () => {
  for (const region of [typeI, typeII]) {
    const { cells } = createPartition(region, 17);
    for (const cell of cells) {
      const { sampleX: x, sampleY: y } = cell;
      assert.ok(x > 0 && x < 1 && y > x * x && y < x);
      assert.ok(cell.area > 0);
      assert.ok(Math.abs(cell.area - (cell.x1 - cell.x0) * (cell.y1 - cell.y0)) < 1e-15);
    }
  }
});
test('integrando no constante y firmado funciona con las dos orientaciones', () => {
  for (const region of [typeI, typeII]) {
    const result = integrate({ expression: 'x*y', region, resolution: 64 });
    assert.ok(Math.abs(result.approximation - 1 / 24) < 2e-5);
    const negative = integrate({ expression: '-1', region, resolution: 64 });
    assert.ok(negative.approximation < 0 && negative.diagnostics.length > 0);
  }
});
test('los límites se restringen a la variable exterior y mantienen la lista blanca', () => {
  assert.equal(compileBoundaryExpression('sqrt(y)', 'y')(0.25), 0.5);
  for (const expression of ['y', 'x+y', 'x=2', 'random()', 'x.constructor']) assert.throws(() => compileBoundaryExpression(expression, 'x'));
  assert.throws(() => compileBoundaryExpression('x', 'y'));
});
test('rechaza inversión, cruces y degeneración interior sin eliminar franjas', () => {
  for (const [lower, upper] of [['x', 'x^2'], ['0', '0'], ['0', '(x-0.5)^2'], ['0', '(x-0.5)^2-0.01']]) {
    assert.throws(() => createPartition({ ...typeI, lower, upper }, 1), /invertidos|degenerada/);
  }
  assert.throws(() => createPartition({ ...typeII, lower: '1-y', upper: 'y' }, 1), /invertidos/);
  assert.throws(() => createPartition({ ...typeI, a: 1, b: 0 }, 32), /a < b/);
  assert.throws(() => createPartition({ ...typeII, c: 1, d: 0 }, 32), /c < d/);
  // Cierre puntual del borde permitido, franjas muestreadas estrictamente positivas.
  assert.doesNotThrow(() => createPartition(typeI, 1));
});
test('límites no reales, no finitos, fuera de rango y pérdida de precisión son errores', () => {
  for (const upper of ['sqrt(-1)', '1/0', '10001', 'exp(1000)']) assert.throws(() => createPartition({ ...typeI, lower: '0', upper }, 8));
  assert.throws(() => createPartition({ ...typeI, a: 0, b: 1e-200, lower: '0', upper: '1e-200' }, 128), /precisión/);
  assert.throws(() => createPartition(typeI, 129));
  assert.throws(() => integrateRectangle({ expression: '1', region: typeI }));
});
test('prismas variables preservan áreas y contorno; cámara recibe límites finitos', () => {
  for (const region of [typeI, typeII]) {
    const result = integrate({ expression: '1', region, resolution: 16 });
    const mesh = buildPrisms(result);
    const matrix = new Matrix4();
    result.cells.forEach((cell, index) => {
      mesh.getMatrixAt(index, matrix);
      assert.ok(Math.abs(matrix.determinant() - cell.area) < 1e-8);
    });
    const border = buildRegionBoundary(result);
    assert.equal(border.geometry.attributes.position.count, result.boundary.length);
    assert.ok(Object.values(result.bounds).every(Number.isFinite));
    disposeMesh(mesh); disposeMesh(border);
  }
});
test('las fórmulas cambian el orden diferencial y los pasos interiores', () => {
  const first = formulaTex({ expression: '1', region: typeI });
  const second = formulaTex({ expression: '1', region: typeII });
  assert.ok(first.integral.endsWith('dy\\,dx'));
  assert.ok(second.integral.endsWith('dx\\,dy'));
  assert.ok(first.sum.includes('\\Delta y_i'));
  assert.ok(second.sum.includes('\\Delta x_i'));
});
