import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3, Box3 } from '../vendor/three/three.module.js';
import { integrateRectangle } from '../js/integrator.js';
import { buildPrisms, buildSampleSurface, disposeMesh } from '../js/meshBuilder.js';
import { calculateConvergence, observedOrder } from '../js/convergence.js';
import { formulaTex } from '../js/latex.js';
import katex from '../vendor/katex/katex.mjs';

const region = { type: 'rectangle', a: 0, b: 1, c: 0, d: 1 };
test('cada instancia respeta base, altura, signo y volumen de su celda', () => {
  for (const expression of ['x+y', '-2', 'x-0.5', '0']) {
    const result = integrateRectangle({ expression, region, resolution: 4 });
    const mesh = buildPrisms(result);
    assert.ok(mesh.isInstancedMesh);
    assert.equal(mesh.count, 16);
    result.cells.forEach((cell, index) => {
      const matrix = new Matrix4(); mesh.getMatrixAt(index, matrix);
      assert.ok(matrix.determinant() >= 0);
      const bounds = new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)).applyMatrix4(matrix);
      assert.ok(Math.abs(bounds.min.z - Math.min(0, cell.value)) < 1e-6);
      assert.ok(Math.abs(bounds.max.z - Math.max(0, cell.value)) < 1e-6);
      assert.ok(Math.abs(bounds.min.x - cell.x0) < 1e-6);
      assert.ok(Math.abs(bounds.max.y - cell.y1) < 1e-6);
    });
    let released = false;
    mesh.addEventListener('dispose', () => { released = true; });
    disposeMesh(mesh);
    assert.ok(released);
  }
});
test('16384 instancias comparten una geometría y la superficie usa sólo muestras', () => {
  const result = integrateRectangle({ expression: 'x+y', region, resolution: 128 });
  const mesh = buildPrisms(result);
  assert.equal(mesh.count, 16384);
  assert.equal(mesh.geometry.attributes.position.count, 24);
  const surface = buildSampleSurface(result);
  assert.equal(surface.geometry.attributes.position.count, result.cells.length);
  assert.equal(surface.geometry.index.count, 127 * 127 * 6);
  disposeMesh(mesh); disposeMesh(surface);
  assert.equal(buildSampleSurface({ ...result, resolution: 1 }), null);
});
test('tabla cuadrática: error exacto y orden dos para n=4..64', () => {
  const progress = [];
  const table = calculateConvergence({ expression: 'x^2+y^2', region }, 2 / 3, (n) => progress.push(n));
  assert.deepEqual(progress, [1, 2, 3, 4, 5]);
  assert.deepEqual(table.rows.map((row) => row.resolution), [4, 8, 16, 32, 64]);
  for (const row of table.rows) {
    assert.ok(Math.abs(row.error - 1 / (6 * row.resolution ** 2)) < 1e-12);
    if (row.resolution > 4) assert.ok(Math.abs(row.order - 2) < 1e-9);
  }
});
test('sin exacto sólo hay diferencias; errores cero no producen orden infinito', () => {
  const unknown = calculateConvergence({ expression: 'x^2+y^2', region });
  assert.ok(unknown.rows.every((row) => row.error === null && row.order === null));
  assert.equal(unknown.rows[0].difference, null);
  assert.ok(unknown.rows[1].difference > 0);
  const constant = calculateConvergence({ expression: '2', region }, 2);
  assert.ok(constant.rows.every((row) => row.error === 0 && row.order === null));
  assert.equal(observedOrder(0, 0), null);
  assert.equal(observedOrder(1e-17, 1e-18), null);
  assert.throws(() => calculateConvergence({ expression: '2', region }, Infinity));
});
test('fórmulas KaTeX se generan desde AST validado, con MathML accesible', () => {
  const formula = formulaTex({ expression: 'sqrt(x)+sin(y)', region });
  assert.match(formula.integral, /sqrt/);
  for (const tex of Object.values(formula)) assert.match(katex.renderToString(tex, { throwOnError: true, trust: false }), /<math/);
  assert.throws(() => formulaTex({ expression: 'x=2', region }));
});
