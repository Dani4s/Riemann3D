import { format } from './calculator.js';

/** Todas las celdas disponibles sin miles de filas en el DOM. */
export function mountCellTable() {
  let result = null;
  let page = 0;
  const pageSize = 32;
  const body = document.querySelector('#box-data');
  const previous = document.querySelector('#cells-previous');
  const next = document.querySelector('#cells-next');
  function render() {
    body.replaceChildren();
    const polar = result?.region.type === 'polar';
    const head = document.querySelector('#cells-head');
    head.replaceChildren();
    for (const label of (polar ? ['Celda', 'rᵢ', 'θⱼ (rad)', 'X', 'Y', 'J = rᵢ', 'ΔA = rᵢ Δr Δθ', 'Valor f', 'f · ΔA'] : ['Celda', 'Muestra X', 'Muestra Y', 'Área ΔA', 'Valor f', 'f · ΔA'])) {
      const th = document.createElement('th'); th.scope = 'col'; th.textContent = result?.model === 'lamina' ? label.replaceAll('f', 'ρ') : label; head.append(th);
    }
    const count = result?.cells.length ?? 0;
    previous.disabled = page === 0;
    next.disabled = (page + 1) * pageSize >= count;
    document.querySelector('#cells-page').textContent = count ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, count)} de ${count} celdas` : 'Sin resultado vigente.';
    for (const [offset, cell] of (result?.cells.slice(page * pageSize, (page + 1) * pageSize) ?? []).entries()) {
      const row = body.insertRow();
      const values = polar ? [cell.sampleR, cell.sampleTheta, cell.sampleX, cell.sampleY, cell.jacobian, cell.area, cell.value, cell.value * cell.area] : [cell.sampleX, cell.sampleY, cell.area, cell.value, cell.value * cell.area];
      for (const value of [page * pageSize + offset + 1, ...values]) row.insertCell().textContent = format(value);
    }
  }
  previous.addEventListener('click', () => { page--; render(); });
  next.addEventListener('click', () => { page++; render(); });
  render();
  return { setResult(value) { result = value; page = 0; render(); } };
}
