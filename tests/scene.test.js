import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from '../vendor/three/three.module.js';
import { createSceneContent, disposeScene } from '../js/sceneContent.js';
import { createDemoBoxes } from '../js/demoData.js';

test('las cuatro cajas apoyan su base en z=0 y conservan las dimensiones de los datos', () => {
  const { scene, boxes } = createSceneContent();
  assert.equal(boxes.children.length, 4);
  boxes.children.forEach((mesh, index) => {
    const data = createDemoBoxes()[index];
    const bounds = new Box3().setFromObject(mesh);
    const size = bounds.getSize(new Vector3());
    assert.ok(Math.abs(bounds.min.z) < 1e-6);
    assert.ok(Math.abs(bounds.max.z - data.height) < 1e-6);
    assert.ok(Math.abs(size.x - data.width) < 1e-6);
    assert.ok(Math.abs(size.y - data.depth) < 1e-6);
    assert.equal(mesh.position.x, data.x);
    assert.equal(mesh.position.y, data.y);
  });
  disposeScene(scene);
});

test('cámara Z-up, cuadrícula en XY, ejes e iluminación para materiales físicos', () => {
  const { scene, camera, grid, axes } = createSceneContent();
  assert.deepEqual(camera.up.toArray(), [0, 0, 1]);
  assert.ok(camera.near > 0 && camera.far > camera.position.length());
  grid.updateMatrixWorld();
  const normal = new Vector3(0, 1, 0).transformDirection(grid.matrixWorld);
  assert.ok(Math.abs(normal.z - 1) < 1e-6);
  assert.equal(axes.type, 'AxesHelper');
  assert.equal(scene.children.filter((object) => object.isLight).length, 3);
  disposeScene(scene);
});

test('las escenas no comparten estado y liberan geometrías y materiales', () => {
  const first = createSceneContent();
  const second = createSceneContent();
  let geometryDisposed = false;
  let materialDisposed = false;
  first.boxes.children[0].geometry.addEventListener('dispose', () => { geometryDisposed = true; });
  first.boxes.children[0].material.addEventListener('dispose', () => { materialDisposed = true; });
  first.boxes.children[0].position.z = 99;
  assert.notEqual(second.boxes.children[0].position.z, 99);
  disposeScene(first.scene);
  assert.ok(geometryDisposed && materialDisposed);
  assert.equal(first.scene.children.length, 0);
  assert.ok(second.scene.children.length > 0);
  disposeScene(second.scene);
});
