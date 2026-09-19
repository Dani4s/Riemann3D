import * as THREE from '../vendor/three/three.module.js';
import { createDemoBoxes } from './demoData.js';

/** Construye objetos sin DOM ni WebGL, para poder probar su geometría con Node. */
export function createSceneContent({ demo = true } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101d30');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.up.set(0, 0, 1); // Convención matemática: altura = z.
  camera.position.set(7, -8, 6);
  camera.lookAt(1, 1, 0.8);

  const grid = new THREE.GridHelper(10, 20, 0x405770, 0x253950);
  grid.rotation.x = Math.PI / 2; // GridHelper comienza en XZ; aquí se lleva a XY.
  grid.position.z = -0.015;
  grid.name = 'xy-grid';
  scene.add(grid);
  const axes = new THREE.AxesHelper(4);
  axes.setColors('#ff786e', '#70deae', '#83baff');
  axes.name = 'axes';
  scene.add(axes);
  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(3, -4, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x91baff, 1.2);
  fill.position.set(-4, 3, 4);
  scene.add(fill);

  const boxes = new THREE.Group();
  boxes.name = 'demo-boxes';
  const colors = [0x56b8b1, 0x54c6b3, 0x43a8c4, 0x63d8c1];
  (demo ? createDemoBoxes() : []).forEach((data, index) => {
    const geometry = new THREE.BoxGeometry(data.width, data.depth, data.height);
    const material = new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.55, metalness: 0.08 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = data.id;
    mesh.position.set(data.x, data.y, data.height / 2);
    mesh.userData = { ...data };
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xb2f4e7, transparent: true, opacity: 0.45 }));
    mesh.add(edges);
    boxes.add(mesh);
  });
  scene.add(boxes);
  return { scene, camera, boxes, axes, grid };
}

export function disposeScene(scene) {
  scene.traverse((object) => {
    object.geometry?.dispose();
    if (object.isInstancedMesh) object.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material?.map?.dispose();
      material?.dispose();
    });
  });
  scene.clear();
}
