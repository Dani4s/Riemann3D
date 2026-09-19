import test from 'node:test';
import assert from 'node:assert/strict';
import { integrate } from '../js/integrator.js';
import { createPartition } from '../js/geometry.js';
import { polarToCartesian } from '../js/polar.js';
import { compilePolarExpression } from '../js/expressionValidator.js';
import { POLAR_PRESETS } from '../js/presets.js';
import { calculateConvergence } from '../js/convergence.js';
import { buildPrisms, buildRegionBoundary, buildSampleSurface, disposeMesh } from '../js/meshBuilder.js';
import { formulaTex } from '../js/latex.js';
import katex from '../vendor/katex/katex.mjs';

const disk = POLAR_PRESETS[0].region;
for (const preset of POLAR_PRESETS) {
  test(`preset polar: ${preset.name}`, () => {
    const result = integrate({ ...preset, resolution: 32 });
    assert.ok(Math.abs(result.approximation - preset.exact) / preset.exact < 0.01);
    assert.equal(result.cells.length, 1024);
    assert.ok(result.cells.every((cell) => cell.jacobian === cell.sampleR));
    for (const tex of Object.values(formulaTex(result))) assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true }));
  });
}
test('jacobiano y área: discos, anillos y sectores, incluyendo n=1 y n=128', () => {
  for (const region of [disk, { ...disk, rMin: 1 }, { ...disk, rMin: 1, thetaMin: '-pi/2', thetaMax: 'pi/2' }]) {
    for (const resolution of [1, 7, 32, 128]) {
      const result = integrate({ expression: '1', region, resolution });
      const expected = (result.region.rMax ** 2 - result.region.rMin ** 2) / 2 * (result.region.thetaMax - result.region.thetaMin);
      assert.ok(Math.abs(result.approximation - expected) < 1e-12);
      for (const cell of result.cells) {
        assert.ok(cell.sampleR > cell.r0 && cell.sampleR < cell.r1);
        assert.ok(cell.sampleTheta > cell.theta0 && cell.sampleTheta < cell.theta1);
        assert.ok(Math.abs(cell.area - 0.5 * (cell.r1 ** 2 - cell.r0 ** 2) * (cell.theta1 - cell.theta0)) < 1e-12);
        assert.ok(Math.abs(Math.hypot(cell.sampleX, cell.sampleY) - cell.sampleR) < 1e-12);
      }
    }
  }
});
test('paraboloide converge a 8π con orden dos y error analítico', () => {
  const table = calculateConvergence(POLAR_PRESETS[0], 8 * Math.PI);
  for (const row of table.rows) {
    assert.ok(Math.abs(row.error - 4 * Math.PI / row.resolution ** 2) < 1e-12);
    if (row.resolution > 4) assert.ok(Math.abs(row.order - 2) < 1e-9);
  }
});
test('coordenadas nativas y cartesianas coinciden, θ/theta son alias seguros', () => {
  const cartesian = integrate({ expression: 'x^2+y^2', region: disk });
  const native = integrate({ expression: 'r^2', region: disk, coordinates: 'polar' });
  assert.ok(Math.abs(native.approximation - cartesian.approximation) < 1e-12);
  assert.equal(compilePolarExpression('r+theta-θ')(2, 1), 2);
  assert.throws(() => compilePolarExpression('x+r'));
  assert.throws(() => compilePolarExpression('r=2'));
  assert.throws(() => compilePolarExpression('sqrt(-1)')(1, 1));
  assert.throws(() => integrate({ expression: 'r', coordinates: 'polar', region: { type: 'rectangle', a: 0, b: 1, c: 0, d: 1 } }));
  const angular = integrate({ expression: 'r*cos(theta)', region: { ...disk, thetaMax: Math.PI / 2 }, coordinates: 'polar', resolution: 128 });
  assert.ok(Math.abs(angular.approximation - 8 / 3) < 0.001);
  for (const tex of Object.values(formulaTex(native))) assert.doesNotThrow(() => katex.renderToString(tex));
});
test('rechaza radios/ángulos inválidos, doble vuelta, expresiones inseguras y pérdida de precisión', () => {
  for (const update of [{ rMin: -1 }, { rMin: 2 }, { rMax: 0 }, { rMax: Infinity }, { rMax: 10001 }, { thetaMax: 0 }, { thetaMin: 8 }, { thetaMax: '4*pi' }, { thetaMax: 'x' }, { thetaMax: 'r=1' }, { thetaMax: '1/0' }, { thetaMax: '' }]) {
    assert.throws(() => createPartition({ ...disk, ...update }, 32), undefined, JSON.stringify(update));
  }
  assert.throws(() => createPartition({ ...disk, rMax: 1e-200 }, 32));
});
test('mapeo y contornos: círculo completo sin costura radial ficticia', () => {
  const point = polarToCartesian(2, Math.PI / 2);
  assert.ok(Math.abs(point.x) < 1e-12 && Math.abs(point.y - 2) < 1e-12);
  const full = createPartition(disk, 8);
  assert.equal(full.boundaryLoops.length, 1);
  const ring = createPartition({ ...disk, rMin: 1 }, 8);
  assert.equal(ring.boundaryLoops.length, 2);
  const sector = createPartition({ ...disk, thetaMax: Math.PI / 2 }, 8);
  assert.equal(sector.boundaryLoops.length, 1);
  assert.deepEqual(sector.boundaryLoops[0][0], sector.boundaryLoops[0].at(-1));
});
test('sectores facetados usan una malla, preservan radio/hueco/signo y liberan recursos', () => {
  for (const expression of ['1', '-2', '0']) {
    const result = integrate({ expression, region: { ...disk, rMin: 1 }, resolution: 4 });
    const mesh = buildPrisms(result);
    assert.equal(mesh.userData.cellCount, 16);
    const attribute = mesh.geometry.attributes.position;
    for (let i = 0; i < attribute.count; i++) {
      const radius = Math.hypot(attribute.getX(i), attribute.getY(i));
      assert.ok(radius >= 1 - 1e-6 && radius <= 2 + 1e-6);
      assert.ok(attribute.getZ(i) >= Math.min(0, Number(expression)) && attribute.getZ(i) <= Math.max(0, Number(expression)));
    }
    const surface = buildSampleSurface(result);
    assert.equal(surface.geometry.index.count, 3 * 4 * 6);
    const boundary = buildRegionBoundary(result);
    let disposed = false; mesh.geometry.addEventListener('dispose', () => { disposed = true; });
    disposeMesh(mesh); disposeMesh(surface); disposeMesh(boundary);
    assert.ok(disposed);
  }
});
