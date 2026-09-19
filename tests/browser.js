const results = document.querySelector('#results');
const result = document.querySelector('#result');
let failures = 0;
function check(condition, message) {
  const item = document.createElement('li');
  item.textContent = `${condition ? 'OK' : 'FALLO'} · ${message}`;
  results.append(item);
  if (!condition) failures++;
}
try {
  const { integrateRectangle } = await import('../js/integrator.js');
  const { RECTANGULAR_PRESETS } = await import('../js/presets.js');
  for (const preset of RECTANGULAR_PRESETS) {
    const numerical = integrateRectangle({ ...preset, resolution: 32 });
    check(Math.abs(numerical.approximation - preset.exact) / Math.abs(preset.exact) < 0.01, `Integral rectangular: ${preset.name}`);
  }
  let rejected = false;
  try { integrateRectangle({ ...RECTANGULAR_PRESETS[0], expression: 'x=2' }); }
  catch { rejected = true; }
  check(rejected, 'El validador rechaza asignaciones');
  const { mountScene } = await import('../js/scene.js');
  const fixture = document.querySelector('#fixture');
  const app = mountScene(fixture);
  const canvas = fixture.querySelector('canvas');
  check(Boolean(canvas && app.renderer.getContext()), 'Contexto WebGL creado');
  check(app.renderer.info.render.triangles >= 48, 'Cuatro cajas enviadas al renderizador');
  const initial = app.camera.position.clone();
  canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  check(initial.distanceTo(app.camera.position) > 0.1, 'Teclado gira la cámara');
  app.reset();
  check(initial.distanceTo(app.camera.position) < 1e-8, 'Restablecer recupera la cámara');
  fixture.style.width = '480px';
  await new Promise((resolve) => setTimeout(resolve, 100));
  check(Math.abs(app.camera.aspect - 2) < 1e-8, 'ResizeObserver actualiza la proyección');
  check(canvas.clientWidth === 480 && canvas.clientHeight === 240, 'Lienzo sigue el tamaño del contenedor');
  app.dispose();
  check(!fixture.querySelector('canvas') && app.scene.children.length === 0, 'Liberación elimina lienzo y objetos');
  const second = mountScene(fixture);
  check(second.boxes.children.length === 4, 'La escena vuelve a montarse');
  const dense = integrateRectangle({ ...RECTANGULAR_PRESETS[0], resolution: 128 });
  second.setResult(dense);
  check(second.prisms.isInstancedMesh && second.prisms.count === 16384, '16384 prismas en una malla instanciada');
  check(second.renderer.info.render.calls < 20, 'Número de draw calls acotado con n=128');
  const geometryCount = second.renderer.info.memory.geometries;
  for (let i = 0; i < 4; i++) second.setResult(integrateRectangle({ ...RECTANGULAR_PRESETS[i % 3], resolution: 16 }));
  check(second.renderer.info.memory.geometries === geometryCount, 'Reemplazar resultados no acumula geometrías WebGL');
  second.setSurfaceVisible(true);
  check(second.scene.getObjectByName('sample-surface').visible, 'La superficie de muestras se puede mostrar');
  second.clearResult();
  check(second.prisms === null && !second.scene.getObjectByName('riemann-prisms'), 'Invalidar elimina la malla anterior');
  const { integrate } = await import('../js/integrator.js');
  const { VARIABLE_PRESETS } = await import('../js/presets.js');
  for (const preset of VARIABLE_PRESETS) {
    const variableResult = integrate({ ...preset, resolution: 32 });
    second.setResult(variableResult);
    check(Math.abs(variableResult.approximation - preset.exact) / preset.exact < 0.01, `Región variable: ${preset.name}`);
    check(second.scene.getObjectByName('region-boundary').geometry.attributes.position.count > 256 && Number.isFinite(second.camera.position.x), `Contorno y cámara: ${preset.name}`);
  }
  second.clearResult();
  check(!second.scene.getObjectByName('region-boundary'), 'Se libera el contorno al invalidar');
  const { POLAR_PRESETS } = await import('../js/presets.js');
  for (const preset of POLAR_PRESETS) {
    const polar = integrate({ ...preset, resolution: 32 });
    second.setResult(polar);
    check(Math.abs(polar.approximation - preset.exact) / preset.exact < 0.01, `Preset polar: ${preset.name}`);
    check(second.prisms.userData.cellCount === 1024 && second.renderer.info.render.calls < 20, `Sectores agrupados: ${preset.name}`);
  }
  second.setResult(integrate({ ...POLAR_PRESETS[0], resolution: 128 }));
  check(second.prisms.userData.cellCount === 16384 && second.renderer.info.render.calls < 20, '16384 sectores polares con draw calls acotados');
  const polarGeometries = second.renderer.info.memory.geometries;
  for (const preset of POLAR_PRESETS) second.setResult(integrate({ ...preset, resolution: 16 }));
  check(second.renderer.info.memory.geometries === polarGeometries, 'Cambiar sectores no acumula geometrías WebGL');
  second.clearResult();
  check(second.prisms === null, 'La malla polar se libera al invalidar');
  second.dispose();
} catch (error) {
  check(false, error.message);
  console.error(error);
}
result.textContent = failures ? `${failures} pruebas fallidas` : 'Todas las pruebas pasaron';
result.dataset.failures = String(failures);
