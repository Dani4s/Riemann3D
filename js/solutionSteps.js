const number = (value) => new Intl.NumberFormat('es-MX', { maximumSignificantDigits: 10, notation: value !== 0 && Math.abs(value) < 1e-6 ? 'scientific' : 'standard' }).format(value);

/** Explica el resultado vigente; no atribuye una solución simbólica al método numérico. */
export function solutionSteps(result, preset) {
  const r = result.region, cell = result.cells[0], n = result.resolution;
  const f = result.model === 'lamina' ? 'ρ' : 'f';
  const steps = [];
  const add = (title, text) => steps.push({ title, text });
  const domain = r.type === 'polar' ? `${number(r.rMin)} ≤ r ≤ ${number(r.rMax)}, ${number(r.thetaMin)} ≤ θ ≤ ${number(r.thetaMax)} rad`
    : r.type === 'typeI' ? `${number(r.a)} ≤ x ≤ ${number(r.b)}, ${r.lower} ≤ y ≤ ${r.upper}`
    : r.type === 'typeII' ? `${number(r.c)} ≤ y ≤ ${number(r.d)}, ${r.lower} ≤ x ≤ ${r.upper}`
    : `${number(r.a)} ≤ x ≤ ${number(r.b)}, ${number(r.c)} ≤ y ≤ ${number(r.d)}`;
  add('Identificar la función y la región', `${f}(${result.coordinates === 'polar' ? 'r, θ' : 'x, y'}) = ${result.expression}. Región D: ${domain}. ${result.model === 'solid' ? 'Buscamos V = ∫∫D f dA, en u³.' : result.model === 'lamina' ? 'Buscamos M = ∫∫D ρ dA, en uₘ; ρ es densidad superficial.' : 'Buscamos I = ∫∫D f dA, conservando el signo de cada contribución.'}`);
  if (r.type === 'polar') {
    add('Dividir el dominio polar', `n = ${n}: ${n} × ${n} = ${result.cells.length} celdas. Δr = (r máximo − r mínimo)/n = ${number(result.dr)}; Δθ = (θ final − θ inicial)/n = ${number(result.dTheta)} rad.`);
    add('Tomar el primer punto medio y transformar', `r₁ = (${number(cell.r0)} + ${number(cell.r1)})/2 = ${number(cell.sampleR)}; θ₁ = (${number(cell.theta0)} + ${number(cell.theta1)})/2 = ${number(cell.sampleTheta)}. x₁ = r₁ cosθ₁ = ${number(cell.sampleX)}; y₁ = r₁ sinθ₁ = ${number(cell.sampleY)}. Jacobiano J = r₁. ΔA₁ = r₁ Δr Δθ = ${number(cell.area)}. El factor r se incluye una sola vez.`);
  } else {
    add('Dividir la región', `n = ${n}: ${n} × ${n} = ${result.cells.length} celdas. ${r.type === 'rectangle' ? `Δx = (b−a)/n = ${number(result.dx)}; Δy = (d−c)/n = ${number(result.dy)}.` : r.type === 'typeI' ? `Δx = (b−a)/n = ${number(result.dx)}. En cada xᵢ: Δyᵢ = (g₂(xᵢ)−g₁(xᵢ))/n.` : `Δy = (d−c)/n = ${number(result.dy)}. En cada yᵢ: Δxᵢ = (h₂(yᵢ)−h₁(yᵢ))/n.`}`);
    add('Tomar el primer punto medio y su área', `Primera celda: x de ${number(cell.x0)} a ${number(cell.x1)}, y de ${number(cell.y0)} a ${number(cell.y1)}. x₁ = (${number(cell.x0)} + ${number(cell.x1)})/2 = ${number(cell.sampleX)}; y₁ = (${number(cell.y0)} + ${number(cell.y1)})/2 = ${number(cell.sampleY)}. ΔA₁ = (${number(cell.x1-cell.x0)}) × (${number(cell.y1-cell.y0)}) = ${number(cell.area)}.`);
  }
  const args = result.coordinates === 'polar' ? `${number(cell.sampleR)}, ${number(cell.sampleTheta)}` : `${number(cell.sampleX)}, ${number(cell.sampleY)}`;
  add('Evaluar y calcular una contribución', `Sustituimos el punto medio en ${f} = ${result.expression}: ${f}(${args}) ≈ ${number(cell.value)}. Contribución₁ = ${f}₁ ΔA₁ ≈ (${number(cell.value)}) × (${number(cell.area)}) = ${number(cell.value * cell.area)}.`);
  const contributions = result.cells.slice(0, 3).map(c => `(${number(c.value*c.area)})`).join(' + ');
  add('Sumar todas las contribuciones', `Repetimos la evaluación para las ${result.cells.length} celdas. Σ ${f}ᵢ ΔAᵢ ≈ ${contributions}${result.cells.length > 3 ? ' + …' : ''} = ${number(result.approximation)}. El cálculo suma los valores completos con compensación de redondeo; aquí se muestran cifras redondeadas. Puedes consultar cada término en «Datos de la escena».`);
  const app = result.application;
  if (app) {
    if (!app.centroid) add('Comprobar el centroide', 'El total muestreado es cero. No se puede dividir entre cero: el centroide no está definido.');
    else {
      const sum = (fn) => { let total = 0, correction = 0; for (const c of result.cells) { const adjusted = fn(c)-correction, next = total+adjusted; correction = (next-total)-adjusted; total=next; } return total; };
      const sx = sum(c => c.sampleX*(c.value*c.area)), sy = sum(c => c.sampleY*(c.value*c.area));
      add('Ponderar las coordenadas y dividir por el total', `Σ xᵢ ${f}ᵢ ΔAᵢ ≈ ${number(sx)}; Σ yᵢ ${f}ᵢ ΔAᵢ ≈ ${number(sy)}. x̄ ≈ (${number(sx)})/(${number(result.approximation)}) = ${number(app.centroid.x)} u; ȳ ≈ (${number(sy)})/(${number(result.approximation)}) = ${number(app.centroid.y)} u.`);
      if (result.model === 'solid') {
        const sz = sum(c => c.value*(c.value*c.area)/2);
        add('Obtener la coordenada vertical del sólido', `Al integrar z desde 0 hasta f, ∫₀ᶠ z dz = f²/2. Σ (fᵢ²/2) ΔAᵢ ≈ ${number(sz)}. z̄ ≈ (${number(sz)})/(${number(app.volume)}) = ${number(app.centroid.z)} u. La densidad uniforme se cancela en los cocientes.`);
      } else add('Situar la lámina', 'La lámina está en el plano XY: z̄ = 0 u. La densidad no representa una altura.');
    }
    if (result.model === 'lamina') add('Calcular las inercias respecto de los ejes', `Ix ≈ Σ yᵢ² ρᵢ ΔAᵢ = ${number(app.Ix)}; Iy ≈ Σ xᵢ² ρᵢ ΔAᵢ = ${number(app.Iy)}. IO = Ix + Iy ≈ (${number(app.Ix)}) + (${number(app.Iy)}) = ${number(app.IO)} uₘ·u². Estos ejes pasan por el origen.`);
  }
  if (preset) add('Comparar con la referencia analítica', `${preset.derivation} Para la integral principal: error absoluto = |${number(preset.exact)} − ${number(result.approximation)}| ≈ ${number(Math.abs(preset.exact-result.approximation))}.`);
  else add('Interpretar la aproximación', 'No hay una solución exacta conocida para esta entrada personalizada. La tabla de convergencia compara refinamientos; una diferencia pequeña no certifica exactitud ni integrabilidad.');
  return steps;
}

export function renderSolutionSteps(result, preset) {
  const list = document.querySelector('#solution-steps'); list.replaceChildren();
  for (const step of solutionSteps(result, preset)) {
    const li = document.createElement('li'), title = document.createElement('h4'), text = document.createElement('p');
    title.textContent = step.title; text.textContent = step.text; li.append(title, text); list.append(li);
  }
}
