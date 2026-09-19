import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExpression } from '../js/expressionValidator.js';

test('aritmética, precedencia, constantes y funciones permitidas', () => {
  assert.equal(compileExpression('x+y')(2, 3), 5);
  assert.equal(compileExpression('-x^2 + 2*y')(3, 4), -1);
  assert.equal(compileExpression('2x + (y/2)')(3, 4), 8);
  assert.ok(Math.abs(compileExpression('sin(pi/2)+cos(0)+log(e)+sqrt(4)+abs(-2)+exp(0)+tan(0)')(0, 0) - 8) < 1e-12);
  assert.equal(compileExpression('1e-3')(0, 0), 0.001);
});

test('rechaza asignaciones, accesos, bloques, arrays, importación y funciones de usuario', () => {
  for (const expression of ['x=2', 'f(x)=x', 'x; y', 'x\ny', '[1,2]', 'x[0]', 'x.constructor', 'import(x)', 'evaluate(x)', 'parse(x)', 'random()', 'factorial(100)', '2!', 'x>0', 'x?1:0', 'x#comment', 'sin(x,y)', 'sin', 'z+1', 'r', 'theta', 'true', 'Infinity', 'NaN', 'x mod 2', 'x to cm', 'constructor', '__proto__']) {
    assert.throws(() => compileExpression(expression), undefined, expression);
  }
});

test('rechaza longitud, profundidad, número de nodos y sintaxis inválida', () => {
  for (const expression of ['', ' ', 7, 'x+'.repeat(140), '('.repeat(25) + 'x' + ')'.repeat(25), Array(66).fill('x').join('+'), 'sin(', 'x+']) {
    assert.throws(() => compileExpression(expression), undefined, String(expression));
  }
});

test('no admite resultados complejos, no finitos ni alturas fuera de rango', () => {
  for (const expression of ['sqrt(-1)', 'log(-1)', '1/0', '0/0', 'exp(1000)', '1000001', '-1000001', '(-1)^0.5']) {
    assert.throws(() => compileExpression(expression)(0, 0), undefined, expression);
  }
  assert.throws(() => compileExpression('x')(NaN, 0));
  assert.equal(compileExpression('-1000000')(0, 0), -1000000);
});

test('cada evaluación usa un alcance nuevo y no modifica entradas', () => {
  const evaluate = compileExpression('x-y');
  assert.equal(evaluate(4, 1), 3);
  assert.equal(evaluate(-1, 2), -3);
  assert.equal(evaluate(4, 1), 3);
});
