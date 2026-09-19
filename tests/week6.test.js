import test from 'node:test';
import assert from 'node:assert/strict';
import { integrate } from '../js/integrator.js';
import { PHYSICAL_PRESETS } from '../js/presets.js';
import { buildPrisms, buildSampleSurface, disposeMesh } from '../js/meshBuilder.js';
const near = (a, b, tolerance = 1e-3) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);
test('Caja: volumen y centroide con factor f²/2', () => {
  const result = integrate(PHYSICAL_PRESETS[0]);
  near(result.application.volume, 12, 1e-12);
  assert.deepEqual(result.application.centroid, { x: 1, y: 1.5, z: 1 });
});
test('Semicírculo y disco: masa, centroides e inercias', () => {
  for (const preset of PHYSICAL_PRESETS.slice(1)) {
    const result = integrate({ ...preset, resolution: 64 });
    near(result.application.mass, preset.exact, 1e-12);
    for (const [key, expected] of Object.entries(preset.reference)) near(result.application.centroid[key] ?? result.application[key], expected);
    assert.equal(result.application.IO, result.application.Ix + result.application.Iy);
  }
});
test('Densidad variable: masa y centroide distintos del promedio geométrico', () => {
  const result = integrate({ expression: 'x', model: 'lamina', region: { type: 'rectangle', a: 0, b: 1, c: 0, d: 1 }, resolution: 64 });
  near(result.application.mass, 0.5); near(result.application.centroid.x, 2 / 3); near(result.application.Iy, 0.25);
});
test('Negativos rechazados en física; integral firmada admitida; cero sin centroide', () => {
  for (const model of ['solid', 'lamina']) {
    const request = { ...PHYSICAL_PRESETS[0], model };
    assert.throws(() => integrate({ ...request, expression: '-1' }), /no negativa/);
    assert.equal(integrate({ ...request, expression: '0' }).application.centroid, null);
  }
  assert.equal(integrate({ ...PHYSICAL_PRESETS[0], model: 'integral', expression: '-1' }).approximation, -6);
  assert.throws(() => integrate({ ...PHYSICAL_PRESETS[0], model: 'unknown' }), /Modelo/);
});
test('Lámina plana rectangular y polar: densidad no genera altura', () => {
  for (const preset of [PHYSICAL_PRESETS[0], PHYSICAL_PRESETS[1]]) {
    const result = integrate({ ...preset, model: 'lamina' });
    const mesh = buildPrisms(result), positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) assert.equal(positions.getZ(i), 0);
    assert.equal(buildSampleSurface(result), null); disposeMesh(mesh);
  }
});
