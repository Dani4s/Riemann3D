# math.js 14.8.1

Distribución oficial de navegador UMD y licencia Apache 2.0:

- https://cdn.jsdelivr.net/npm/mathjs@14.8.1/lib/browser/math.js
- https://cdn.jsdelivr.net/npm/mathjs@14.8.1/LICENSE

Adaptación local en `math.js`: se anteponen `const module = { exports: {} };` y
`const exports = module.exports;` y se añade `export default module.exports;` al final.
El contenido UMD original se conserva entre esas líneas. Esto activa su rama CommonJS
dentro de un módulo ES privado, tanto en Node como en un trabajador del navegador,
sin crear variables globales. No existe un proceso de compilación.
`expressionValidator.js` encapsula su uso. No requiere CDN en ejecución.
Documentación de referencia: https://mathjs.org/docs/expressions/expression_trees.html
y https://mathjs.org/docs/expressions/security.html.
