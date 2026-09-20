// Verificación opcional de desarrollo. Requiere Playwright, no la aplicación.
// PLAYWRIGHT_MODULE puede apuntar a una instalación existente.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const origin = process.env.TEST_URL || 'http://127.0.0.1:8000';
try {
  await page.goto(origin);
  await page.getByText('Escena lista', { exact: true }).waitFor();
  const calculate = page.getByRole('button', { name: /Calcular aproximación/ });
  const completion = page.getByText('Cálculo completado.', { exact: true });
  await completion.waitFor();
  for (const [id, expected] of [['inclined', 3], ['constant', 12], ['quadratic', 2 / 3 - 1 / (6 * 32 ** 2)]]) {
    await page.selectOption('#preset', id);
    await calculate.click();
    await completion.waitFor();
    const actual = Number((await page.locator('#approximation').innerText()).replaceAll(',', ''));
    if (Math.abs(actual - expected) > 1e-10) throw new Error(`Preset ${id}: ${actual} != ${expected}`);
    await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  }
  const orders = await page.locator('#convergence-body tr').evaluateAll((rows) => rows.slice(1).map((row) => Number(row.children[4].textContent)));
  if (orders.some((p) => Math.abs(p - 2) > 1e-8)) throw new Error('Orden de convergencia incorrecto');
  if (await page.locator('.katex').count() < 2) throw new Error('KaTeX no renderizó las fórmulas');
  await page.locator('#resolution').fill('128');
  await completion.waitFor();
  if (!(await page.locator('#scene-summary').innerText()).includes('16384')) throw new Error('n=128 no actualizó la malla');
  if (await page.locator('#preset').inputValue() !== 'quadratic') throw new Error('Cambiar n perdió el valor exacto');
  await page.locator('#resolution').fill('32');
  await completion.waitFor();
  await page.fill('#expression', '-2');
  if (await page.locator('#calculation-output').isVisible()) throw new Error('Resultado anterior visible después de editar');
  await calculate.click();
  await completion.waitFor();
  if (!(await page.locator('#interpretation').innerText()).includes('integral firmada')) throw new Error('Falta advertencia de valores negativos');
  await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  if (!(await page.locator('#error-heading').innerText()).includes('indicador')) throw new Error('Diferencias mal etiquetadas');
  if (!(await page.locator('#exact-description').innerText()).includes('desconocido')) throw new Error('Exacto obsoleto en entrada personalizada');
  for (const expression of ['x=2', 'sqrt(-1)', '1/0', 'exp(1000)']) {
    await page.fill('#expression', expression);
    await calculate.click();
    await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
    if (!(await page.locator('#calculation-error').innerText())) throw new Error(`Falta error para ${expression}`);
    if (await page.locator('#calculation-output').isVisible()) throw new Error('Resultado visible tras error');
  }
  await page.fill('#expression', 'x+y');
  await page.fill('#a', '2');
  await calculate.click();
  await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
  if (!(await page.locator('#calculation-error').innerText()).includes('a < b')) throw new Error('Límites invertidos aceptados');
  await page.fill('#a', '');
  await calculate.click();
  await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
  await page.selectOption('#preset', 'inclined');
  await calculate.click();
  await completion.waitFor();
  console.log('PASS: tres presets por Worker, entradas inválidas, límites, integral firmada, limpieza y recuperación.');
  for (const [id, type, expected] of [['between-curves', 'typeI', 1 / 6], ['between-curves-ii', 'typeII', 1 / 6], ['triangle-ii', 'typeII', 0.5]]) {
    await page.selectOption('#preset', id);
    if (await page.locator('#region-type').inputValue() !== type) throw new Error('El preset no actualizó el tipo de región');
    if (await page.locator(type === 'typeI' ? '#c-field' : '#a-field').isVisible()) throw new Error('Límites exteriores incorrectos visibles');
    await calculate.click(); await completion.waitFor();
    const actual = Number(await page.locator('#approximation').innerText());
    if (Math.abs(actual - expected) / expected >= 0.01) throw new Error(`Preset variable ${id} incorrecto`);
    await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
    if (await page.locator('.katex-error').count()) throw new Error('Error en fórmulas de límites variables');
  }
  await page.fill('#lower', 'x');
  await calculate.click(); await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
  if (!(await page.locator('#calculation-error').innerText()).includes('Símbolo no permitido')) throw new Error('Tipo II admitió x en su límite');
  for (const [lower, upper] of [['1', '0'], ['0', '0'], ['0', 'sqrt(-1)']]) {
    await page.fill('#lower', lower); await page.fill('#upper', upper);
    await calculate.click(); await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
    if (await page.locator('#calculation-output').isVisible()) throw new Error('Resultado obsoleto tras límite inválido');
    if (!(await page.locator('#scene-summary').innerText()).includes('Sin resultado')) throw new Error('Escena obsoleta tras límite inválido');
  }
  await page.selectOption('#region-type', 'rectangle');
  if (await page.locator('#variable-bounds').isVisible()) throw new Error('Límites variables visibles en rectangular');
  await page.selectOption('#preset', 'between-curves');
  await calculate.click(); await completion.waitFor();
  await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  const variableOrders = await page.locator('#convergence-body tr').evaluateAll((rows) => rows.slice(1).map((row) => Number(row.children[4].textContent)));
  if (variableOrders.some((p) => Math.abs(p - 2) > 1e-8)) throw new Error('Convergencia Tipo I incorrecta');
  await page.locator('#resolution').fill('128'); await completion.waitFor();
  if (!(await page.locator('#scene-summary').innerText()).includes('16384')) throw new Error('Región variable no admite n=128');
  await page.locator('#resolution').fill('32'); await completion.waitFor();
  await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  await page.getByText('Datos de la escena · alternativa textual', { exact: true }).click();
  await page.locator('#cells-next').click();
  if (!(await page.locator('#cells-page').innerText()).startsWith('33')) throw new Error('Paginación de celdas incorrecta');
  await page.getByText('Datos de la escena · alternativa textual', { exact: true }).click();
  console.log('PASS: Tipo I/II, seis presets, límites variables inválidos, recuperación, n=128 y paginación.');
  for (const [id, expected] of [['polar-paraboloid', 8 * Math.PI], ['polar-hemisphere', 2 * Math.PI / 3], ['polar-sector', 3 * Math.PI / 4]]) {
    await page.selectOption('#preset', id);
    if (await page.locator('#a-field').isVisible() || !(await page.locator('#polar-bounds').isVisible())) throw new Error('Campos polares incorrectos');
    await calculate.click(); await completion.waitFor();
    const actual = Number(await page.locator('#approximation').innerText());
    if (Math.abs(actual - expected) / expected >= 0.01) throw new Error(`Preset polar incorrecto: ${id}`);
    await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
    if (!(await page.locator('#polar-mapping').isVisible())) throw new Error('Falta panel de mapeo');
    if (await page.locator('.katex-error').count()) throw new Error('Fórmula polar inválida');
  }
  await page.selectOption('#preset', 'polar-paraboloid');
  await calculate.click(); await completion.waitFor();
  await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  const polarOrders = await page.locator('#convergence-body tr').evaluateAll((rows) => rows.slice(1).map((row) => Number(row.children[4].textContent)));
  if (polarOrders.some((p) => Math.abs(p - 2) > 1e-8)) throw new Error('Orden del paraboloide polar incorrecto');
  await page.locator('#mapping-cell').fill('1');
  const smallArea = Number(await page.locator('#mapping-area').innerText());
  await page.locator('#mapping-cell').fill('1024');
  if (Number(await page.locator('#mapping-area').innerText()) <= smallArea) throw new Error('El área no crece con el jacobiano');
  if (await page.locator('#mapping-r').innerText() !== await page.locator('#mapping-jacobian').innerText()) throw new Error('J distinto de r');
  const cartValue = Number(await page.locator('#approximation').innerText());
  await page.selectOption('#coordinates', 'polar'); await page.fill('#expression', 'r^2');
  await calculate.click(); await completion.waitFor();
  if (Math.abs(Number(await page.locator('#approximation').innerText()) - cartValue) > 1e-9) throw new Error('f(r,theta) difiere de f(x,y) equivalente');
  for (const [field, invalid, restored] of [['rMin', '-1', '0'], ['thetaMax', '4*pi', '2*pi'], ['thetaMax', 'x', '2*pi']]) {
    await page.fill(`#${field}`, invalid); await calculate.click();
    await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
    if (await page.locator('#polar-mapping').isVisible()) throw new Error('Mapeo obsoleto tras error');
    await page.fill(`#${field}`, restored);
  }
  await page.selectOption('#preset', 'polar-paraboloid');
  await page.locator('#resolution').fill('128'); await completion.waitFor();
  if (!(await page.locator('#scene-summary').innerText()).includes('16384')) throw new Error('Faltan sectores a n=128');
  await page.locator('#resolution').fill('32'); await completion.waitFor();
  await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  console.log('PASS: polares, 8π, jacobiano, mapeo interactivo, variables r/θ, errores y n=128.');
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.screenshot();
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + 250, bounds.y + 180);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 350, bounds.y + 230, { steps: 10 });
  await page.mouse.up();
  const after = await canvas.screenshot();
  if (before.equals(after)) throw new Error('Arrastrar no cambió el renderizado');
  await page.getByRole('button', { name: /Restablecer/ }).click();
  const screenshotDir = process.env.SCREENSHOT_DIR || 'docs/screenshots'; await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotDir + '/week5-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: screenshotDir + '/week5-mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error('Desbordamiento horizontal en móvil');
  await page.goto(`${origin}/tests/`);
  await page.waitForFunction(() => document.querySelector('#result')?.dataset.failures !== undefined);
  const failures = await page.locator('#result').getAttribute('data-failures');
  console.log(await page.locator('#results').innerText());
  if (failures !== '0') throw new Error(`${failures} pruebas del navegador fallaron`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: página principal, arrastre, escritorio, móvil, pruebas WebGL; sin errores de consola/HTTP.');
} finally {
  await browser.close();
}

