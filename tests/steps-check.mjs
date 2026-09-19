import { createRequire } from 'node:module';
import { PRESETS } from '../js/presets.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8000/');
  const done = () => page.getByText('Cálculo completado.', { exact: true }).waitFor();
  const calculate = () => page.getByRole('button', { name: /Calcular aproximación/ }).click();
  await done();
  for (const preset of PRESETS) {
    await page.selectOption('#preset', preset.id); await calculate(); await done();
    const text = await page.locator('#solution').innerText();
    if (!text.includes(preset.derivation) || /undefined|NaN/.test(text)) throw new Error(`Pasos incorrectos: ${preset.id}`);
    if (!(await page.locator('#solution-steps li').count() >= 6)) throw new Error('Pasos incompletos');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Desbordamiento móvil');
  }
  await page.fill('#expression', '0');
  if (await page.locator('#solution').isVisible()) throw new Error('Pasos obsoletos al editar');
  await calculate(); await done();
  if (!(await page.locator('#solution').innerText()).includes('No se puede dividir entre cero')) throw new Error('Falta explicación del total nulo');
  await page.selectOption('#model', 'integral'); await page.fill('#expression', '-2');
  await page.locator('#resolution').fill('1'); await done();
  if (!(await page.locator('#solution').innerText()).includes('1 × 1 = 1')) throw new Error('n=1 incorrecto');
  await page.fill('#expression', 'x=2'); await calculate();
  await page.getByText('Cálculo no realizado.', { exact: true }).waitFor();
  if (await page.locator('#solution').isVisible()) throw new Error('Pasos visibles tras error');
  await page.selectOption('#preset', 'inclined'); await calculate(); await done();
  await page.locator('#solution summary').focus(); await page.keyboard.press('Enter');
  if (await page.locator('#solution').getAttribute('open') !== null) throw new Error('No se puede plegar con teclado');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: pasos de los 12 presets, móvil, cero, n=1, negativos, invalidación, recuperación y teclado.');
} finally { await browser.close(); }
