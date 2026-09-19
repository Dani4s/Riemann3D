import { PRESETS } from './presets.js';
import { renderFormulas } from './latex.js';
import { renderPhysicalResult } from './physicalUI.js';
import { renderSolutionSteps } from './solutionSteps.js';

export const format = (value) => new Intl.NumberFormat('es-MX', { maximumSignificantDigits: 12 }).format(value);

export function mountCalculator({ onResult = () => {}, onInvalidate = () => {} } = {}) {
  const form = document.querySelector('#calculator');
  const presetSelect = document.querySelector('#preset');
  const output = document.querySelector('#calculation-output');
  const status = document.querySelector('#calculation-status');
  const error = document.querySelector('#calculation-error');
  const button = form.querySelector('button[type="submit"]');
  const resolution = form.elements.resolution;
  const regionType = form.elements.regionType;
  const convergenceStatus = document.querySelector('#convergence-status');
  const convergenceBody = document.querySelector('#convergence-body');
  let worker, convergenceWorker, timeout, convergenceTimeout, debounce;
  let version = 0;
  function stopCalculation() {
    worker?.terminate(); worker = null;
    clearTimeout(timeout);
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
  function stopAll() {
    version++;
    stopCalculation();
    convergenceWorker?.terminate(); convergenceWorker = null;
    clearTimeout(convergenceTimeout);
    clearTimeout(debounce);
  }
  function invalidate() {
    stopAll();
    output.hidden = true;
    error.textContent = '';
    convergenceBody.replaceChildren();
    convergenceStatus.textContent = 'En espera del cálculo.';
    status.textContent = 'Entrada modificada. Pulsa Calcular para actualizar.';
    onInvalidate();
  }
  function updateRegionFields() {
    const type = regionType.value;
    const rectangle = type === 'rectangle';
    const polar = type === 'polar';
    document.querySelector('#a-field').hidden = type === 'typeII' || polar;
    document.querySelector('#b-field').hidden = type === 'typeII' || polar;
    document.querySelector('#c-field').hidden = type === 'typeI' || polar;
    document.querySelector('#d-field').hidden = type === 'typeI' || polar;
    document.querySelector('#variable-bounds').hidden = rectangle || polar;
    document.querySelector('#polar-bounds').hidden = !polar;
    document.querySelector('#lower-label').textContent = type === 'typeI' ? 'g₁(x) · Y inferior' : 'h₁(y) · X inferior';
    document.querySelector('#upper-label').textContent = type === 'typeI' ? 'g₂(x) · Y superior' : 'h₂(y) · X superior';
    document.querySelector('#region-description').textContent = polar ? 'r mínimo ≤ r ≤ r máximo; θ inicial ≤ θ ≤ θ final' : rectangle ? 'D = [a,b] × [c,d]' : type === 'typeI' ? 'a ≤ x ≤ b; g₁(x) ≤ y ≤ g₂(x)' : 'c ≤ y ≤ d; h₁(y) ≤ x ≤ h₂(y)';
    document.querySelector('#boundary-help').textContent = type === 'typeI' ? 'Los límites g₁ y g₂ sólo pueden usar x (además de pi, e y las funciones permitidas).' : 'Los límites h₁ y h₂ sólo pueden usar y (además de pi, e y las funciones permitidas).';
    updateExpressionLabel();
  }
  function updateExpressionLabel() {
    const native = regionType.value === 'polar' && form.elements.coordinates.value === 'polar';
    const symbol = form.elements.model.value === 'lamina' ? 'Densidad ρ' : 'Función f';
    document.querySelector('#expression-label').textContent = `${symbol}${native ? '(r, θ)' : '(x, y)'}`;
    document.querySelector('#expression-help').textContent = `${native ? 'Usa r y theta (o θ)' : 'Usa x, y'}, pi, e; + − * / ^ y sin, cos, tan, sqrt, abs, exp, log (natural). Ángulos en radianes.`;
  }
  function loadPreset() {
    const preset = PRESETS.find((item) => item.id === presetSelect.value);
    if (!preset) return;
    form.elements.expression.value = preset.expression;
    form.elements.model.value = preset.model ?? 'integral';
    form.elements.coordinates.value = preset.coordinates ?? 'cartesian';
    regionType.value = preset.region.type;
    for (const key of ['a', 'b', 'c', 'd', 'lower', 'upper', 'rMin', 'rMax', 'thetaMin', 'thetaMax']) {
      if (preset.region[key] !== undefined) form.elements[key].value = preset.region[key];
    }
    if (preset.region.type === 'polar') {
      const readable = (value) => value === 2 * Math.PI ? '2*pi' : value === Math.PI / 2 ? 'pi/2' : String(value);
      form.elements.thetaMin.value = readable(preset.region.thetaMin);
      form.elements.thetaMax.value = readable(preset.region.thetaMax);
    }
    updateRegionFields();
  }
  for (const preset of PRESETS) presetSelect.add(new Option(preset.name, preset.id));
  presetSelect.value = PRESETS[0].id;
  loadPreset();
  form.addEventListener('input', (event) => {
    if (event.target === form.elements.coordinates || event.target === form.elements.model) updateExpressionLabel();
    if (event.target !== resolution) presetSelect.value = '';
    if (event.target === regionType) {
      // No trasladar una expresión de x a un límite de y ni viceversa.
      form.elements.lower.value = '0'; form.elements.upper.value = '1';
      form.elements.coordinates.value = 'cartesian';
      updateRegionFields();
    }
    invalidate();
    document.querySelector('#resolution-label').textContent = `${resolution.value} × ${resolution.value}`;
    if (event.target === resolution) debounce = setTimeout(() => form.requestSubmit(), 350);
  });
  presetSelect.addEventListener('change', () => { invalidate(); loadPreset(); });
  function startConvergence(request, exact, currentVersion) {
    convergenceStatus.textContent = 'Calculando convergencia: 0/5…';
    document.querySelector('#error-heading').textContent = exact === null ? '|Iₙ − Iₙ/₂| (indicador)' : '|I − Iₙ| (error absoluto)';
    const failed = (message) => {
      convergenceWorker?.terminate(); convergenceWorker = null;
      clearTimeout(convergenceTimeout);
      convergenceStatus.textContent = `Convergencia no disponible: ${message}`;
    };
    try {
      convergenceWorker = new Worker(new URL('./integrationWorker.js', import.meta.url), { type: 'module' });
      convergenceTimeout = setTimeout(() => failed('se agotaron los 15 s de espera.'), 15000);
      convergenceWorker.onerror = () => failed('no se pudo cargar el trabajador.');
      convergenceWorker.onmessage = ({ data }) => {
        if (currentVersion !== version) return;
        if (data.progress) { convergenceStatus.textContent = `Calculando convergencia: ${data.progress.completed}/${data.progress.total}…`; return; }
        if (data.error) { failed(data.error); return; }
        convergenceWorker.terminate(); convergenceWorker = null;
        clearTimeout(convergenceTimeout);
        for (const row of data.convergence.rows) {
          const tr = document.createElement('tr');
          const metric = exact === null ? row.difference : row.error;
          for (const text of [row.resolution, row.cells, format(row.approximation), metric === null ? '—' : format(metric), row.order === null ? '—' : format(row.order), row.milliseconds.toFixed(3)]) {
            const td = document.createElement('td'); td.textContent = text; tr.append(td);
          }
          convergenceBody.append(tr);
        }
        convergenceStatus.textContent = exact === null
          ? 'Tabla lista. La diferencia entre iteraciones es un indicador, no un error exacto. Sin valor exacto no se informa p.'
          : 'Tabla lista. p = log₂(Eₙ/₂ / Eₙ). «—»: primera fila o error nulo/cercano al redondeo. En casos suaves se espera p ≈ 2.';
      };
      convergenceWorker.postMessage({ action: 'convergence', request, exact });
    } catch { failed('no se pudo crear el trabajador.'); }
  }
  function fail(message) {
    stopAll(); output.hidden = true;
    status.textContent = 'Cálculo no realizado.';
    error.textContent = message;
    convergenceStatus.textContent = 'Corrige la entrada para calcular la convergencia.';
    onInvalidate();
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault(); invalidate();
    const currentVersion = version;
    const polar = regionType.value === 'polar';
    const request = { expression: form.elements.expression.value, region: { type: regionType.value }, resolution: Number(resolution.value), rule: 'midpoint', coordinates: polar ? form.elements.coordinates.value : 'cartesian' };
    request.model = form.elements.model.value;
    const keys = polar ? ['rMin', 'rMax'] : regionType.value === 'typeI' ? ['a', 'b'] : regionType.value === 'typeII' ? ['c', 'd'] : ['a', 'b', 'c', 'd'];
    for (const key of keys) {
      const raw = form.elements[key].value.trim();
      request.region[key] = raw === '' ? NaN : Number(raw);
    }
    if (polar) {
      request.region.thetaMin = form.elements.thetaMin.value;
      request.region.thetaMax = form.elements.thetaMax.value;
    } else if (regionType.value !== 'rectangle') {
      request.region.lower = form.elements.lower.value;
      request.region.upper = form.elements.upper.value;
    }
    const preset = PRESETS.find((item) => item.id === presetSelect.value);
    button.disabled = true; form.setAttribute('aria-busy', 'true');
    status.textContent = 'Calculando…';
    try {
      worker = new Worker(new URL('./integrationWorker.js', import.meta.url), { type: 'module' });
      timeout = setTimeout(() => fail('Se agotó el tiempo de espera (5 s). Simplifica la expresión e inténtalo de nuevo.'), 5000);
      worker.onerror = () => fail('No se pudo iniciar el cálculo. Comprueba que usas un servidor HTTP local.');
      worker.onmessage = ({ data }) => {
        if (currentVersion !== version) return;
        if (data.error) { fail(data.error); return; }
        stopCalculation();
        const result = data.result;
        renderFormulas(result);
        renderPhysicalResult(result, preset?.reference);
        renderSolutionSteps(result, preset);
        document.querySelector('.result-label').textContent = result.model === 'solid' ? 'Volumen aproximado · u³' : result.model === 'lamina' ? 'Masa aproximada · uₘ' : 'Aproximación por punto medio';
        document.querySelector('#convergence-title').textContent = result.model === 'solid' ? 'Convergencia del volumen' : result.model === 'lamina' ? 'Convergencia de la masa' : 'Tabla de convergencia';
        document.querySelector('#approximation').textContent = format(result.approximation);
        const spacing = polar ? `Δr = ${format(result.dr)} · Δθ = ${format(result.dTheta)} rad · ΔA = rᵢ Δr Δθ` : result.region.type === 'typeI' ? `Δx = ${format(result.dx)} · Δy varía por franja` : result.region.type === 'typeII' ? `Δy = ${format(result.dy)} · Δx varía por franja` : `Δx = ${format(result.dx)} · Δy = ${format(result.dy)}`;
        document.querySelector('#partition-description').textContent = `n = ${result.resolution} · ${result.cells.length} celdas · ${spacing}`;
        document.querySelector('#cell-explanation').textContent = polar ? 'Cada sector tiene área rᵢ Δr Δθ y altura f evaluada en el punto medio polar, mapeado al plano XY.' : 'Cada prisma tiene base Δx · Δy y altura f(x,y) evaluada en el punto medio.';
        document.querySelector('#region-visual-note').textContent = polar
          ? 'Los sectores anulares se dibujan con arcos facetados. El área del cálculo es rᵢ Δr Δθ, no el área del polígono dibujado. El contorno dorado muestra los límites radiales y angulares.'
          : result.region.type === 'rectangle'
          ? 'El contorno dorado muestra el rectángulo de integración. Las bases cubren la región.'
          : 'El contorno dorado aproxima el borde mediante muestras. Cada franja usa los límites en su punto medio: las bases rectangulares pueden sobresalir del borde curvo. Sólo los puntos de muestreo se usan en la suma; los prismas no son un recorte exacto de la región.';
        document.querySelector('#interpretation').textContent = result.diagnostics.join(' ') || 'Integral aproximada. No se detectaron muestras negativas; esto no demuestra positividad en toda la región.';
        document.querySelector('#exact-description').textContent = preset
          ? `Exacto: ${format(preset.exact)} · Error absoluto: ${format(Math.abs(result.approximation - preset.exact))}. ${preset.derivation}`
          : 'Valor exacto desconocido para la entrada personalizada; no se calcula un error exacto.';
        if (result.model === 'lamina') document.querySelector('#cell-explanation').textContent = 'Lámina plana en XY. El color representa densidad ρ; cada celda aporta masa ρ · ΔA.';
        output.hidden = false; onResult(result);
        status.textContent = 'Cálculo completado.';
        startConvergence(request, preset?.exact ?? null, currentVersion);
      };
      worker.postMessage(request);
    } catch { fail('No se pudo crear el trabajador de cálculo. Usa un navegador moderno mediante HTTP.'); }
  });
  window.addEventListener('pagehide', stopAll);
  form.requestSubmit();
}
