/** Casos verificables; los dos últimos complementan el preset rectangular del plan. */
export const RECTANGULAR_PRESETS = Object.freeze([
  { id: 'inclined', name: 'Prisma inclinado', expression: 'x+y', region: { type: 'rectangle', a: 0, b: 2, c: 0, d: 1 }, exact: 3, derivation: '∫₀² ∫₀¹ (x+y) dy dx = ∫₀² (x+1/2) dx = 3.' },
  { id: 'constant', name: 'Altura constante', expression: '2', region: { type: 'rectangle', a: 0, b: 2, c: 0, d: 3 }, exact: 12, derivation: '∬ 2 dA = 2 · (2−0) · (3−0) = 12.' },
  { id: 'quadratic', name: 'Paraboloide rectangular', expression: 'x^2+y^2', region: { type: 'rectangle', a: 0, b: 1, c: 0, d: 1 }, exact: 2 / 3, derivation: '∫₀¹ ∫₀¹ (x²+y²) dy dx = 1/3 + 1/3 = 2/3.' },
].map((preset) => Object.freeze({ ...preset, region: Object.freeze(preset.region) })));

export const VARIABLE_PRESETS = Object.freeze([
  { id: 'between-curves', name: 'Entre curvas · Tipo I', expression: '1', region: { type: 'typeI', a: 0, b: 1, lower: 'x^2', upper: 'x' }, exact: 1 / 6, derivation: 'Área: ∫₀¹ (x−x²) dx = 1/2−1/3 = 1/6.' },
  { id: 'between-curves-ii', name: 'Entre curvas · Tipo II', expression: '1', region: { type: 'typeII', c: 0, d: 1, lower: 'y', upper: 'sqrt(y)' }, exact: 1 / 6, derivation: 'La misma región: ∫₀¹ (√y−y) dy = 2/3−1/2 = 1/6. La raíz en el extremo puede alterar el orden observado.' },
  { id: 'triangle-ii', name: 'Triángulo ponderado · Tipo II', expression: 'x+2*y', region: { type: 'typeII', c: 0, d: 1, lower: '0', upper: '1-y' }, exact: 1 / 2, derivation: '∫₀¹ ∫₀¹⁻ʸ (x+2y) dx dy = ∫₀¹ (1/2+y−3y²/2) dy = 1/2.' },
].map((preset) => Object.freeze({ ...preset, region: Object.freeze(preset.region) })));

export const POLAR_PRESETS = Object.freeze([
  { id: 'polar-paraboloid', name: 'Paraboloide · disco r ≤ 2', expression: 'x^2+y^2', region: { type: 'polar', rMin: 0, rMax: 2, thetaMin: 0, thetaMax: 2 * Math.PI }, exact: 8 * Math.PI, derivation: '∫₀²π ∫₀² r² · r dr dθ = 2π · [r⁴/4]₀² = 8π. El segundo r es el jacobiano.' },
  { id: 'polar-hemisphere', name: 'Hemisferio · disco unitario', expression: 'sqrt(1-x^2-y^2)', region: { type: 'polar', rMin: 0, rMax: 1, thetaMin: 0, thetaMax: 2 * Math.PI }, exact: 2 * Math.PI / 3, derivation: '∫₀²π ∫₀¹ √(1−r²) r dr dθ = 2π/3. La derivada en r=1 es singular; el orden puede diferir de 2.' },
  { id: 'polar-sector', name: 'Sector anular · área', expression: '1', region: { type: 'polar', rMin: 1, rMax: 2, thetaMin: 0, thetaMax: Math.PI / 2 }, exact: 3 * Math.PI / 4, derivation: 'Área = (2²−1²)/2 · (π/2) = 3π/4.' },
].map((preset) => Object.freeze({ ...preset, region: Object.freeze(preset.region) })));

export const PHYSICAL_PRESETS = Object.freeze([
  { id: 'solid-box', name: 'Sólido · caja uniforme', model: 'solid', expression: '2', region: { type: 'rectangle', a: 0, b: 2, c: 0, d: 3 }, exact: 12, derivation: 'V=12; centroide=(1, 1.5, 1). Densidad volumétrica uniforme.', reference: { x: 1, y: 1.5, z: 1 } },
  { id: 'lamina-semicircle', name: 'Lámina · semicírculo uniforme', model: 'lamina', expression: '1', region: { type: 'polar', rMin: 0, rMax: 1, thetaMin: 0, thetaMax: Math.PI }, exact: Math.PI / 2, derivation: 'ρ=1; M=π/2; centroide=(0, 4/(3π)); Ix=Iy=π/8.', reference: { x: 0, y: 4 / (3 * Math.PI), z: 0, Ix: Math.PI / 8, Iy: Math.PI / 8, IO: Math.PI / 4 } },
  { id: 'lamina-disk', name: 'Lámina · disco de masa unitaria', model: 'lamina', expression: '1/pi', region: { type: 'polar', rMin: 0, rMax: 1, thetaMin: 0, thetaMax: 2 * Math.PI }, exact: 1, derivation: 'ρ=1/π; M=1; centroide=(0,0); Ix=Iy=1/4; IO=M/2=1/2.', reference: { x: 0, y: 0, z: 0, Ix: 0.25, Iy: 0.25, IO: 0.5 } },
].map((preset) => Object.freeze({ ...preset, region: Object.freeze(preset.region), reference: Object.freeze(preset.reference) })));
export const PRESETS = Object.freeze([...RECTANGULAR_PRESETS, ...VARIABLE_PRESETS, ...POLAR_PRESETS, ...PHYSICAL_PRESETS]);
