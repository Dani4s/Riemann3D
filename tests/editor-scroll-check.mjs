import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8000/');
    await page.getByText('Cálculo completado.', { exact: true }).waitFor();
    for (const action of ['escape', 'cancel', 'apply']) {
      await page.evaluate(() => { document.querySelector('#expression').focus({ preventScroll: true }); window.scrollTo(0, 350); });
      const before = await page.evaluate(() => ({ y: scrollY, top: document.querySelector('header').getBoundingClientRect().top }));
      await page.evaluate(() => document.querySelector('#expression').click());
      await page.mouse.move(2, 2); await page.mouse.wheel(0, 800);
      await page.waitForTimeout(200);
      const locked = await page.evaluate(() => ({ position: getComputedStyle(document.body).position, top: document.querySelector('header').getBoundingClientRect().top }));
      if (locked.position !== 'fixed' || Math.abs(locked.top-before.top)>1) throw new Error(`Fondo desplazado: ${width}/${action}`);
      if (width === 390) {
        await page.locator('#expression-editor').evaluate(el => el.scrollTop = el.scrollHeight);
        if (!(await page.locator('#expression-editor').evaluate(el => el.scrollTop > 0))) throw new Error('Calculadora no desplaza internamente');
      }
      if (action === 'escape') await page.keyboard.press('Escape');
      else await page.locator(action === 'cancel' ? '#editor-cancel' : '#editor-apply').click();
      await page.waitForFunction(() => document.body.style.position !== 'fixed');
      if (Math.abs(await page.evaluate(() => scrollY)-before.y)>1) throw new Error(`Posición no restaurada: ${width}/${action}`);
      await page.mouse.move(2, 2); await page.mouse.wheel(0, 200);
      await page.waitForTimeout(200);
      if (await page.evaluate(() => scrollY) <= before.y) throw new Error('La página sigue bloqueada al cerrar');
    }
    await page.close();
  }
  console.log('PASS: fondo fijo, scroll interno y restauración con Escape, Cancelar y Aplicar; escritorio y móvil.');
} finally { await browser.close(); }
