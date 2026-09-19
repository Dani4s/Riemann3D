import * as THREE from '../vendor/three/three.module.js';

/** Una geometría compartida; escalas positivas incluso para contribuciones negativas. */
export function buildPrisms(result) {
  if (result.model === 'lamina') return buildLamina(result);
  if (result.region.type === 'polar') return buildPolarSectors(result);
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.04 }),
    result.cells.length,
  );
  mesh.name = 'riemann-prisms';
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  result.cells.forEach((cell, index) => {
    matrix.makeScale(cell.x1 - cell.x0, cell.y1 - cell.y0, Math.abs(cell.value));
    matrix.setPosition(cell.sampleX, cell.sampleY, cell.value / 2);
    mesh.setMatrixAt(index, matrix);
    color.set(cell.value < 0 ? '#ed9678' : '#55cbb9');
    // Alternar tonos permite ver la partición sin reducir el área de las bases.
    if ((Math.floor(index / result.resolution) + index % result.resolution) % 2) color.multiplyScalar(0.78);
    mesh.setColorAt(index, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  return mesh;
}

/** Superficie de referencia interpolada entre muestras; no evalúa puntos nuevos. */
export function buildSampleSurface(result) {
  if (result.model === 'lamina') return null;
  if (result.resolution < 2) return null;
  const positions = new Float32Array(result.cells.length * 3);
  result.cells.forEach((cell, index) => positions.set([cell.sampleX, cell.sampleY, cell.value], index * 3));
  const indices = [];
  const n = result.resolution;
  const wrap = result.region.type === 'polar' && Math.abs(result.region.thetaMax - result.region.thetaMin - 2 * Math.PI) < 1e-12;
  if (wrap && n < 3) return null;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < (wrap ? n : n - 1); j++) {
    const a = i * n + j;
    const b = i * n + (j + 1) % n;
    indices.push(a, a + n, b, b, a + n, b + n);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const surface = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: '#e2efff', transparent: true, opacity: 0.3, side: THREE.DoubleSide,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  }));
  surface.name = 'sample-surface';
  return surface;
}

/** Densidad codificada por luminosidad en una malla estrictamente plana. */
export function buildLamina(result) {
  const positions = [], colors = [];
  let maximum = 0;
  for (const cell of result.cells) maximum = Math.max(maximum, cell.value);
  const color = new THREE.Color();
  const triangle = (a, b, c) => {
    positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
  };
  for (const cell of result.cells) {
    color.setRGB(0.04, 0.12, 0.19).lerp(new THREE.Color('#55cbb9'), maximum ? cell.value / maximum : 0);
    if (result.region.type === 'polar') {
      const segments = Math.max(1, Math.ceil((cell.theta1 - cell.theta0) / (Math.PI / 24)));
      const p = (r, t) => [r * Math.cos(t), r * Math.sin(t), 0];
      for (let s = 0; s < segments; s++) {
        const a = cell.theta0 + (cell.theta1 - cell.theta0) * s / segments;
        const b = cell.theta0 + (cell.theta1 - cell.theta0) * (s + 1) / segments;
        triangle(p(cell.r0, a), p(cell.r1, a), p(cell.r1, b));
        triangle(p(cell.r0, a), p(cell.r1, b), p(cell.r0, b));
      }
    } else {
      const a = [cell.x0, cell.y0, 0], b = [cell.x1, cell.y0, 0], c = [cell.x1, cell.y1, 0], d = [cell.x0, cell.y1, 0];
      triangle(a, b, c); triangle(a, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  mesh.name = 'density-lamina'; mesh.userData.cellCount = result.cells.length;
  return mesh;
}

export function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.removeFromParent();
  mesh.geometry.dispose();
  mesh.material.dispose();
  if (mesh.isInstancedMesh) mesh.dispose();
}

/** Contorno de la región, muestreado en el cálculo y situado sobre z=0. */
export function buildRegionBoundary(result) {
  if (!result.boundary) return null;
  if (result.boundaryLoops) {
    const points = [];
    for (const loop of result.boundaryLoops) for (let i = 1; i < loop.length; i++) {
      points.push(new THREE.Vector3(loop[i - 1].x, loop[i - 1].y, 0), new THREE.Vector3(loop[i].x, loop[i].y, 0));
    }
    const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#ffdc98', depthTest: false }));
    lines.name = 'region-boundary'; lines.renderOrder = 5;
    return lines;
  }
  const points = result.boundary.map(({ x, y }) => new THREE.Vector3(x, y, 0));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: '#ffdc98', depthTest: false }));
  line.name = 'region-boundary';
  line.renderOrder = 5;
  return line;
}

/** Sectores anulares facetados en UNA malla: evita miles de objetos/draw calls.
 * El cálculo usa r·Δr·Δθ; las cuerdas dibujadas sólo aproximan los arcos. */
export function buildPolarSectors(result) {
  const positions = [], colors = [];
  const color = new THREE.Color();
  const point = (r, theta, z) => [r * Math.cos(theta), r * Math.sin(theta), z];
  const triangle = (a, b, c) => {
    positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
  };
  for (const [index, cell] of result.cells.entries()) {
    color.set(cell.value < 0 ? '#ed9678' : '#55cbb9');
    if ((Math.floor(index / result.resolution) + index % result.resolution) % 2) color.multiplyScalar(0.78);
    const low = Math.min(0, cell.value), high = Math.max(0, cell.value);
    const segments = Math.max(1, Math.ceil((cell.theta1 - cell.theta0) / (Math.PI / 24)));
    for (let s = 0; s < segments; s++) {
      const a = cell.theta0 + (cell.theta1 - cell.theta0) * s / segments;
      const b = cell.theta0 + (cell.theta1 - cell.theta0) * (s + 1) / segments;
      const ia = point(cell.r0, a, low), oa = point(cell.r1, a, low), ob = point(cell.r1, b, low), ib = point(cell.r0, b, low);
      const iat = point(cell.r0, a, high), oat = point(cell.r1, a, high), obt = point(cell.r1, b, high), ibt = point(cell.r0, b, high);
      triangle(iat, oat, obt); triangle(iat, obt, ibt);
      triangle(ia, ob, oa); triangle(ia, ib, ob);
      triangle(oa, ob, obt); triangle(oa, obt, oat);
      triangle(ia, iat, ibt); triangle(ia, ibt, ib);
      if (s === 0) { triangle(ia, oa, oat); triangle(ia, oat, iat); }
      if (s === segments - 1) { triangle(ib, ibt, obt); triangle(ib, obt, ob); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, side: THREE.DoubleSide }));
  mesh.name = 'riemann-prisms'; mesh.userData.cellCount = result.cells.length;
  return mesh;
}
