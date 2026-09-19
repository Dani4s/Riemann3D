import test from 'node:test';
import assert from 'node:assert/strict';
import { createRectanglePartition } from '../js/geometry.js';

const region = { type: 'rectangle', a: -2, b: 3, c: -1, d: 2 };
test('partición completa con muestras interiores y área total correcta', () => {
  for (const n of [1, 2, 7, 32, 128]) {
    const { cells } = createRectanglePartition(region, n);
    assert.equal(cells.length, n * n);
    assert.ok(Math.abs(cells.reduce((sum, cell) => sum + cell.area, 0) - 15) < 1e-10);
    for (const cell of cells) {
      assert.ok(cell.x0 >= region.a && cell.x1 <= region.b);
      assert.ok(cell.y0 >= region.c && cell.y1 <= region.d);
      assert.ok(cell.x0 < cell.sampleX && cell.sampleX < cell.x1);
      assert.ok(cell.y0 < cell.sampleY && cell.sampleY < cell.y1);
    }
    assert.equal(cells.at(-1).x1, region.b);
    assert.equal(cells.at(-1).y1, region.d);
  }
});
test('rechaza límites invertidos, degenerados, no finitos y fuera de rango', () => {
  for (const change of [{ a: 3 }, { a: 4 }, { d: -1 }, { d: -2 }, { b: Infinity }, { a: NaN }, { a: '0' }, { c: -10001 }, { type: 'polar' }]) {
    assert.throws(() => createRectanglePartition({ ...region, ...change }, 32));
  }
});
test('rechaza resoluciones fuera del contrato y pérdida de precisión', () => {
  for (const n of [0, -1, 1.5, 129, '32', NaN, Infinity]) assert.throws(() => createRectanglePartition(region, n));
  assert.throws(() => createRectanglePartition({ type: 'rectangle', a: 0, b: 1e-200, c: 0, d: 1e-200 }, 32));
  assert.throws(() => createRectanglePartition({ type: 'rectangle', a: 1, b: 1 + Number.EPSILON, c: 0, d: 1 }, 32));
});
