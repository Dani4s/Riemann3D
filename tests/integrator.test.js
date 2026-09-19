import test from 'node:test';
import assert from 'node:assert/strict';
import { integrateRectangle } from '../js/integrator.js';
const region = { type: 'rectangle', a: 0, b: 1, c: 0, d: 1 };

test('muestras de punto medio y valores coherentes con las celdas', () => {
  const result = integrateRectangle({ expression: 'x*y', region, resolution: 2 });
  assert.equal(result.approximation, 0.25);
  assert.equal(result.cells[0].sampleX, 0.25);
  assert.equal(result.cells[0].sampleY, 0.25);
  assert.equal(result.cells[0].value, 0.0625);
  assert.equal(result.cells[0].area, 0.25);
});
test('integrales firmadas y cancelación se preservan', () => {
  const negative = integrateRectangle({ expression: '-2', region });
  assert.equal(negative.approximation, -2);
  assert.match(negative.diagnostics[0], /integral firmada/);
  const zero = integrateRectangle({ expression: 'x', region: { ...region, a: -1 }, resolution: 32 });
  assert.equal(zero.approximation, 0);
  assert.ok(zero.diagnostics.length > 0);
});
test('errores de dominio invalidan todo el cálculo e identifican la muestra', () => {
  for (const expression of ['sqrt(x-0.5)', '1/(x-0.5)', 'exp(1000)']) {
    assert.throws(() => integrateRectangle({ expression, region, resolution: 3 }), /Celda .*punto/);
  }
});
test('resultado reproducible, sin mutar entrada, y rechazo de reglas desconocidas', () => {
  const request = { expression: 'sin(x)+y', region: Object.freeze({ ...region }), resolution: 8 };
  Object.freeze(request);
  assert.deepEqual(integrateRectangle(request), integrateRectangle(request));
  assert.throws(() => integrateRectangle({ ...request, rule: 'trapezoid' }));
});
test('el error del punto medio decrece por un factor de cuatro en una cuadrática', () => {
  const errors = [4, 8, 16].map((resolution) => Math.abs(2 / 3 - integrateRectangle({ expression: 'x^2+y^2', region, resolution }).approximation));
  assert.ok(Math.abs(errors[0] / errors[1] - 4) < 1e-9);
  assert.ok(Math.abs(errors[1] / errors[2] - 4) < 1e-9);
});
