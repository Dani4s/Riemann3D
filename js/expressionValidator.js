import math from '../vendor/mathjs/math.js';

// La distribución UMD tiene un adaptador ES mínimo, sin globales.
// La expresión recibe exclusivamente un Map de escalares.
export const EXPRESSION_LIMITS = Object.freeze({ length: 256, depth: 24, nodes: 128, value: 1e6 });
const functions = new Set(['sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'log']);
const operators = new Map([
  ['add', ['+', 2]], ['subtract', ['-', 2]], ['multiply', ['*', 2]],
  ['divide', ['/', 2]], ['pow', ['^', 2]],
  ['unaryMinus', ['-', 1]], ['unaryPlus', ['+', 1]],
]);

/** Valida TODO el AST antes de compilar. No usa eval ni Function. */
function validatedTree(expression, variables = ['x', 'y']) {
  const symbols = new Set([...variables, 'pi', 'e']);
  if (typeof expression !== 'string' || !expression.trim()) throw new Error('Escribe una función de x e y.');
  if (expression.length > EXPRESSION_LIMITS.length) throw new Error('La expresión supera los 256 caracteres.');
  if (!/^[\da-zA-Zθ+\-*/^(). \t]+$/.test(expression)) {
    throw new Error('Usa números, x, y, paréntesis y operadores aritméticos; no se permiten asignaciones ni accesos.');
  }
  let tree;
  try { tree = math.parse(expression); }
  catch { throw new Error('Sintaxis inválida. Revisa operadores y paréntesis.'); }
  let count = 0;
  function visit(node, depth) {
    if (++count > EXPRESSION_LIMITS.nodes || depth > EXPRESSION_LIMITS.depth) {
      throw new Error('La expresión es demasiado compleja (máximo 128 nodos y 24 niveles).');
    }
    switch (node.type) {
      case 'ConstantNode':
        if (typeof node.value !== 'number' || !Number.isFinite(node.value)) throw new Error('Sólo se permiten constantes reales finitas.');
        break;
      case 'SymbolNode':
        if (!symbols.has(node.name)) throw new Error(`Símbolo no permitido: ${node.name}. Usa ${variables.join(', ')}, pi o e.`);
        break;
      case 'ParenthesisNode': visit(node.content, depth + 1); break;
      case 'OperatorNode': {
        const rule = operators.get(node.fn);
        if (!rule || rule[0] !== node.op || rule[1] !== node.args.length) throw new Error('Operador no permitido. Usa +, -, *, / o ^.');
        node.args.forEach((child) => visit(child, depth + 1));
        break;
      }
      case 'FunctionNode':
        if (node.fn.type !== 'SymbolNode' || !functions.has(node.fn.name) || node.args.length !== 1) {
          throw new Error('Funciones permitidas (un argumento): sin, cos, tan, sqrt, abs, exp y log.');
        }
        node.args.forEach((child) => visit(child, depth + 1));
        break;
      default: throw new Error(`Construcción no permitida: ${node.type}.`);
    }
  }
  visit(tree, 1);
  return tree;
}

export function expressionToTex(expression, variables) {
  return validatedTree(expression, variables).toTex({ parenthesis: 'keep', implicit: 'show' });
}

export function compileExpression(expression, variables) {
  const tree = validatedTree(expression, variables);
  const compiled = tree.compile();
  return (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Las coordenadas deben ser reales finitas.');
    let value;
    try { value = compiled.evaluate(new Map([['x', x], ['y', y]])); }
    catch { throw new Error('No se pudo evaluar la función en el punto de muestreo.'); }
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('La función produce un valor no real o no finito.');
    if (Math.abs(value) > EXPRESSION_LIMITS.value) throw new Error('La función excede el rango admitido: |f(x,y)| ≤ 1 000 000.');
    return value;
  };
}

/** Los límites sólo dependen de la coordenada exterior. */
export function compileBoundaryExpression(expression, variable) {
  if (!['x', 'y'].includes(variable)) throw new Error('Variable de límite desconocida.');
  const evaluate = compileExpression(expression, [variable]);
  return (value) => variable === 'x' ? evaluate(value, 0) : evaluate(0, value);
}

/** Expresión polar nativa: theta y θ son alias, sin mezclar x/y con r/θ. */
export function compilePolarExpression(expression) {
  const compiled = validatedTree(expression, ['r', 'theta', 'θ']).compile();
  return (r, theta) => {
    if (!Number.isFinite(r) || !Number.isFinite(theta)) throw new Error('Las coordenadas polares deben ser finitas.');
    let value;
    try { value = compiled.evaluate(new Map([['r', r], ['theta', theta], ['θ', theta]])); }
    catch { throw new Error('No se pudo evaluar la función polar.'); }
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('La función produce un valor no real o no finito.');
    if (Math.abs(value) > EXPRESSION_LIMITS.value) throw new Error('La función excede el rango admitido: |f| ≤ 1 000 000.');
    return value;
  };
}
