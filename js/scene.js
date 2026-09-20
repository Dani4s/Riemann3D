import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSceneContent, disposeScene } from './sceneContent.js';
import { buildPrisms, buildSampleSurface, buildRegionBoundary, disposeMesh } from './meshBuilder.js';

export function mountScene(container, options = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const { scene, camera, boxes, axes, grid } = createSceneContent(options);
  let prisms = null;
  let sampleSurface = null;
  let boundaryLine = null;
  let fitState = null;
  let lastResult = null;
  let surfaceVisible = false;
  let centroidMarker = null;
  let centroidVisible = true;
  const centroidLabel = document.createElement('span');
  centroidLabel.className = 'centroid-label'; centroidLabel.hidden = true;
  container.append(centroidLabel);
  const labels = [];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Escena 3D. Flechas: girar; más y menos: zoom; R: restablecer cámara.');
  container.append(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(1, 1, 0.8);
  controls.minDistance = 3;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 2 - 0.025;
  controls.update();
  controls.saveState();

  // Etiquetas en los extremos: el significado de los ejes no depende del color.
  for (const [label, position, color] of [
    ['X', [4.3, 0, 0], '#ff786e'], ['Y', [0, 4.3, 0], '#70deae'], ['Z', [0, 0, 4.3], '#83baff'],
  ]) {
    const surface = document.createElement('canvas');
    surface.width = surface.height = 64;
    const context = surface.getContext('2d');
    context.font = 'bold 44px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(label, 32, 34);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(surface), depthTest: false }));
    sprite.position.set(...position);
    sprite.scale.setScalar(0.42);
    scene.add(sprite);
    labels.push(sprite);
  }

  const render = () => {
    renderer.render(scene, camera);
    centroidLabel.hidden = !centroidMarker || !centroidVisible;
    if (centroidMarker && centroidVisible) {
      const point = centroidMarker.position.clone().project(camera);
      centroidLabel.hidden = Math.abs(point.x) > 1 || Math.abs(point.y) > 1 || Math.abs(point.z) > 1;
      centroidLabel.style.left = `${(point.x + 1) * container.clientWidth / 2}px`;
      centroidLabel.style.top = `${(1 - point.y) * container.clientHeight / 2}px`;
    }
  };
  const reset = () => {
    if (!fitState) controls.reset();
    else {
      const { center, radius } = fitState;
      const halfFov = Math.min(THREE.MathUtils.degToRad(camera.fov / 2), Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
      const distance = radius / Math.sin(halfFov) * 1.25;
      controls.target.copy(center);
      camera.position.copy(center).add(new THREE.Vector3(1, -1.4, 1).normalize().multiplyScalar(distance));
      camera.near = Math.max(radius / 10000, 1e-9);
      camera.far = distance + radius * 100;
      controls.minDistance = radius * 0.05;
      controls.maxDistance = distance * 8;
      controls.maxPolarAngle = Math.PI - 0.025;
      camera.updateProjectionMatrix();
      controls.update();
    }
    render();
  };
  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (fitState) reset(); else render();
  };
  const onKey = (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const offset = camera.position.clone().sub(controls.target);
    // Convierte temporalmente Z-up a Y-up para las coordenadas esféricas.
    const rotation = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
    const spherical = new THREE.Spherical().setFromVector3(offset.applyQuaternion(rotation));
    switch (event.key) {
      case 'ArrowLeft': spherical.theta -= 0.12; break;
      case 'ArrowRight': spherical.theta += 0.12; break;
      case 'ArrowUp': spherical.phi -= 0.12; break;
      case 'ArrowDown': spherical.phi += 0.12; break;
      case '+': case '=': spherical.radius *= 0.9; break;
      case '-': spherical.radius *= 1.1; break;
      case 'r': case 'R': event.preventDefault(); reset(); return;
      default: return;
    }
    event.preventDefault();
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.05, controls.maxPolarAngle);
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
    camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).applyQuaternion(rotation.invert()).add(controls.target));
    controls.update();
    render();
  };
  canvas.addEventListener('keydown', onKey);
  controls.addEventListener('change', render);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize(); // Render bajo demanda: las cajas son estáticas.
  function clearResult() {
    disposeMesh(centroidMarker); centroidMarker = null;
    disposeMesh(prisms);
    disposeMesh(sampleSurface);
    disposeMesh(boundaryLine);
    boundaryLine = null;
    prisms = sampleSurface = null;
    lastResult = null;
    boxes.visible = false;
    render();
  }
  function setResult(result) {
    const previous = lastResult;
    const sameProblem = previous && previous.expression === result.expression && JSON.stringify(previous.region) === JSON.stringify(result.region);
    clearResult();
    prisms = buildPrisms(result);
    sampleSurface = buildSampleSurface(result);
    boundaryLine = buildRegionBoundary(result);
    if (boundaryLine) scene.add(boundaryLine);
    scene.add(prisms);
    if (sampleSurface) { sampleSurface.visible = surfaceVisible; scene.add(sampleSurface); }
    lastResult = result;
    const { a, b, c, d } = result.bounds ?? result.region;
    let minZ = 0, maxZ = 0;
    if (result.model !== 'lamina') for (const cell of result.cells) { minZ = Math.min(minZ, cell.value); maxZ = Math.max(maxZ, cell.value); }
    const center = new THREE.Vector3((a + b) / 2, (c + d) / 2, (minZ + maxZ) / 2);
    const radius = Math.max(new THREE.Vector3(b - a, d - c, maxZ - minZ).length() / 2, 1e-9);
    const centroid = result.application?.centroid;
    if (centroid) {
      centroidMarker = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.025, 16, 12),
        new THREE.MeshBasicMaterial({ color: '#ffdf84', depthTest: false, depthWrite: false }));
      centroidMarker.name = 'centroid-marker'; centroidMarker.renderOrder = 20;
      centroidMarker.position.set(centroid.x, centroid.y, centroid.z);
      centroidMarker.visible = centroidVisible; scene.add(centroidMarker);
      centroidLabel.textContent = 'C';
    }
    fitState = { center, radius };
    const axisLength = Math.max(b - a, d - c, maxZ - minZ) * 1.15;
    axes.scale.setScalar(axisLength / 4);
    grid.scale.setScalar(Math.max(b - a, d - c) / 8);
    grid.position.set(center.x, center.y, 0);
    labels.forEach((sprite, index) => {
      sprite.position.set(0, 0, 0);
      sprite.position.setComponent(index, axisLength * 1.08);
      sprite.scale.setScalar(radius * 0.12);
    });
    if (!sameProblem) reset(); else render();
  }
  return {
    scene, camera, boxes, renderer, controls, reset, setResult, clearResult,
    get prisms() { return prisms; },
    setCentroidVisible(value) { centroidVisible = Boolean(value); if (centroidMarker) centroidMarker.visible = centroidVisible; render(); },
    setSurfaceVisible(value) { surfaceVisible = value; if (sampleSurface) sampleSurface.visible = value; render(); },
    dispose() {
      observer.disconnect();
      canvas.removeEventListener('keydown', onKey);
      controls.removeEventListener('change', render);
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
      centroidLabel.remove();
    },
  };
}
