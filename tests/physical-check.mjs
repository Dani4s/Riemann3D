import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8000/');
  const done = () => page.getByText('Cálculo completado.', { exact: true }).waitFor();
  const calculate = () => page.getByRole('button', { name: /Calcular aproximación/ }).click();
  await done();
  await mkdir('docs/screenshots', { recursive: true });
  for (const id of ['solid-box', 'lamina-semicircle', 'lamina-disk']) {
    await page.selectOption('#preset', id); await calculate(); await done();
    await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
    if (!(await page.locator('#physical-output').isVisible())) throw new Error('Falta resultado físico');
    if (await page.locator('.katex-error').count()) throw new Error('Fórmulas físicas inválidas');
    const rows = await page.locator('#physical-values tr').allTextContents();
    if (rows.length !== (id === 'solid-box' ? 4 : 7)) throw new Error('Magnitudes incompletas');
    if (id !== 'solid-box' && !(await page.locator('#surface-toggle').isDisabled())) throw new Error('Lámina permite superficie de altura');
    await page.locator('#viewport').screenshot({ path: `docs/screenshots/${id}.png` });
    console.log(`PASS ${id}: ${rows.join(' | ')}`);
  }
  for (const model of ['solid', 'lamina']) {
    await page.selectOption('#model', model); await page.fill('#expression', '-1'); await calculate();
    await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
    if (await page.locator('#calculation-output').isVisible()) throw new Error('Datos físicos obsoletos tras error');
    await page.fill('#expression', '0'); await calculate(); await done();
    if (!(await page.locator('#physical-note').innerText()).includes('no está definido')) throw new Error('Centroide de total nulo');
  }
  await page.selectOption('#preset', 'lamina-semicircle'); await calculate(); await done();
  await page.waitForFunction(() => document.querySelector('#convergence-body').children.length === 5);
  await page.screenshot({ path: 'docs/screenshots/week6-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/screenshots/week6-mobile.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Desbordamiento móvil');
  const canvas = page.locator('#viewport canvas'); await canvas.focus();
  const before = await canvas.screenshot(); await page.keyboard.press('ArrowLeft');
  if (before.equals(await canvas.screenshot())) throw new Error('Teclado sin efecto');
  await page.keyboard.press('r');
  await page.selectOption('#preset', 'inclined'); await calculate(); await done();
  if (await page.locator('#physical-output').isVisible() || await page.locator('#surface-toggle').isDisabled()) throw new Error('Cambio de modelo conserva estado físico');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS física, errores, cero, recuperación, teclado y móvil; sin errores HTTP/consola.');
} finally { await browser.close(); }
