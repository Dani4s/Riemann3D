import test from 'node:test';
import assert from 'node:assert/strict';
import { RECTANGULAR_PRESETS } from '../js/presets.js';
import { integrateRectangle } from '../js/integrator.js';

for (const preset of RECTANGULAR_PRESETS) {
  test(`preset rectangular: ${preset.name}`, () => {
    const result = integrateRectangle({ ...preset, resolution: 32 });
    const relativeError = Math.abs(result.approximation - preset.exact) / Math.abs(preset.exact);
    assert.ok(relativeError < 0.01, `Error relativo: ${relativeError}`);
    assert.equal(result.cells.length, 1024);
    assert.equal(result.diagnostics.length, 0);
    if (preset.id !== 'quadratic') assert.ok(Math.abs(result.approximation - preset.exact) < 1e-12);
    else assert.ok(Math.abs(result.approximation - (2 / 3 - 1 / (6 * 32 ** 2))) < 1e-12);
  });
}
