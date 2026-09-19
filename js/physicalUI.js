import katex from '../vendor/katex/katex.mjs';

export function renderPhysicalResult(result, reference) {
  const panel = document.querySelector('#physical-output');
  const body = document.querySelector('#physical-values');
  const app = result.application;
  panel.hidden = !app; body.replaceChildren();
  if (!app) return;
  const solid = app.model === 'solid';
  const format = (v) => v === null ? 'No definido' : new Intl.NumberFormat('es-MX', { maximumSignificantDigits: 10, notation: v !== 0 && Math.abs(v) < 1e-6 ? 'scientific' : 'standard' }).format(v);
  const rows = [[solid ? 'Volumen V' : 'Masa M', result.approximation, solid ? 'u³' : 'uₘ', null],
    ...['x', 'y', 'z'].map((axis) => [`Centroide ${axis}̄`, app.centroid?.[axis] ?? null, 'u', reference?.[axis] ?? null])];
  if (!solid) for (const name of ['Ix', 'Iy', 'IO']) rows.push([name, app[name], 'uₘ·u²', reference?.[name] ?? null]);
  for (const [name, value, units, exact] of rows) {
    const tr = document.createElement('tr');
    for (const text of [name, format(value), units, exact === null ? '—' : format(exact), exact === null || value === null ? '—' : format(Math.abs(value - exact))]) {
      const td = document.createElement('td'); td.textContent = text; tr.append(td);
    }
    body.append(tr);
  }
  document.querySelector('#physical-note').textContent = `${solid ? 'Sólido 0 ≤ z ≤ f(x,y), con densidad volumétrica uniforme. f mide altura en u.' : 'Lámina situada en z=0. La expresión representa densidad superficial ρ en uₘ/u²; el color indica densidad, sin espesor físico.'} u representa tu unidad de longitud y uₘ tu unidad de masa; usa unidades coherentes. ${app.centroid ? 'La positividad se verifica sólo en las muestras.' : 'El total muestreado es cero: el centroide no está definido.'}`;
  const formula = solid
    ? String.raw`V=\iint_D f\,dA,\quad(\bar x,\bar y,\bar z)=\frac{1}{V}\iint_D(xf,yf,f^2/2)\,dA`
    : String.raw`M=\iint_D\rho\,dA,\quad(\bar x,\bar y)=\frac{1}{M}\iint_D(x\rho,y\rho)\,dA,\quad I_x=\iint_D y^2\rho\,dA,\quad I_y=\iint_D x^2\rho\,dA,\quad I_O=I_x+I_y`;
  katex.render(formula, document.querySelector('#physical-formula'), { displayMode: true, throwOnError: true, trust: false });
}
