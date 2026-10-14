import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LETTER_PATHS } from './lettering.js';

function woodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#51301d'; ctx.fillRect(0, 0, 1024, 512);
  // Continuous irregular grain, with a deterministic palette and no external assets.
  for (let y = 0; y < 512; y++) {
    const value = Math.sin(y * 1.72) * 11 + Math.sin(y * 0.19) * 10;
    ctx.strokeStyle = `rgba(${value > 0 ? '193,132,74' : '19,8,3'},${0.13 + Math.abs(value) / 70})`;
    ctx.lineWidth = 0.6 + (y % 4) * 0.3;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const bend = Math.sin(x * 0.007 + y * 0.018) * 6 + Math.sin(x * 0.021 + y * 0.013) * 1.7;
      if (x === 0) ctx.moveTo(x, y + bend); else ctx.lineTo(x, y + bend);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createStage(mount, { onLetter = () => {}, onHover = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const canvas = renderer.domElement;
  canvas.className = 'instrument-canvas';
  canvas.setAttribute('aria-label', 'Marshall tridimensional. Pulsa cada letra dorada para tocar una nota. Teclado: A S D F G H J K.');
  canvas.style.touchAction = 'none';
  mount.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffe5be, 0x1e0b05, 1.5));
  const key = new THREE.DirectionalLight(0xffe9c5, 4);
  key.position.set(-8, 13, 18); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 15, bottom: -15, near: 0.1, far: 60 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.025;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffbc65, 1.8);
  fill.position.set(13, 2, 9); scene.add(fill);
  const wood = woodTexture();
  const walnut = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.48, metalness: 0.04 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0xa97e38, roughness: 0.28, metalness: 0.85 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x21140e, roughness: 0.55 });
  // A real wooden room receives the cabinet's shadows; the camera stays fixed.
  const floorMap = wood.clone();
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(8, 12);
  const wallMap = wood.clone();
  wallMap.wrapS = wallMap.wrapT = THREE.RepeatWrapping;
  wallMap.repeat.set(5, 5);
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallMap, color: 0x805e46, roughness: 0.8 });
  function box(width, height, depth, material, x, y, z, radius = 0.14) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  box(180, 100, 0.7, wallMaterial, 0, 38, -12, 0.05);
  box(180, 0.7, 0.5, walnut, 0, -4.8, -11.4, 0.08);
  box(180, 0.3, 0.4, walnut, 0, 12, -11.5, 0.05);
  for (let x = -80; x <= 80; x += 10) box(0.16, 80, 0.3, darkWood, x, 28, -11.5, 0.035);
  // Thick walnut case and inset soundboard visibly expose their depth from the fixed camera.
  box(30.2, 10.3, 2.5, darkWood, 0, -0.15, -1.2, 0.35);
  box(30, 10.1, 2.1, walnut, 0, 0, -1, 0.28);
  box(28.8, 8.9, 0.15, bronze, 0, 0, 0.08, 0.12);
  box(28.57, 8.67, 0.16, walnut, 0, 0, 0.17, 0.10);
  box(1.7, 0.5, 1.5, darkWood, -11, -5.4, -1.1);
  box(1.7, 0.5, 1.5, darkWood, 11, -5.4, -1.1);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshStandardMaterial({ map: floorMap, color: 0x94775d, roughness: 0.64 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -5.68; floor.receiveShadow = true; scene.add(floor);
  const loader = new SVGLoader();
  const letters = [], clickable = [], states = [];
  class ScriptCurve extends THREE.Curve {
    constructor(path) { super(); this.path = path; }
    getPoint(t, target = new THREE.Vector3()) {
      const p = this.path.getPoint(t);
      return target.set((p.x - 326) * 0.041, (98 - p.y) * 0.041, 0);
    }
  }
  LETTER_PATHS.forEach((paths, index) => {
    const group = new THREE.Group(); group.position.z = 0.72;
    const gold = new THREE.MeshStandardMaterial({ color: 0xe6b64f, metalness: 0.94, roughness: 0.22, emissive: 0xe79c2d, emissiveIntensity: 0 });
    const svg = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg">${paths.map(d => `<path d="${d}" fill="none" stroke="black"/>`).join('')}</svg>`);
    for (const path of svg.paths) for (const subpath of path.subPaths) {
      const curve = new ScriptCurve(subpath);
      const length = subpath.getLength();
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, Math.ceil(length * 0.5)), 0.157, 12, false), gold);
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.letter = index;
      group.add(mesh); clickable.push(mesh);
      for (const t of [0, 1]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.157, 12, 8), gold);
        cap.position.copy(curve.getPoint(t)); cap.castShadow = true; cap.userData.letter = index;
        group.add(cap); clickable.push(cap);
      }
    }
    scene.add(group); letters.push(group); states.push({ age: 10, material: gold });
  });
  let hovered = -1;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function hit(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(clickable, false)[0]?.object.userData.letter ?? -1;
  }
  function hover(index) {
    if (index === hovered) return;
    hovered = index; canvas.style.cursor = index >= 0 ? 'pointer' : 'default'; onHover(index);
  }
  const move = event => hover(hit(event));
  const leave = () => hover(-1);
  const press = event => {
    if (event.button !== 0) return;
    const index = hit(event);
    if (index >= 0) { strike(index); onLetter(index); }
  };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointerdown', press);
  function resize() {
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height); camera.aspect = width / height;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = Math.max(18 / (Math.tan(verticalFov / 2) * camera.aspect), 8.3 / Math.tan(verticalFov / 2));
    camera.position.set(distance * 0.15, distance * 0.20, distance);
    camera.lookAt(0, -0.35, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
  }
  function strike(index) { if (states[index]) states[index].age = 0; }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function draw(delta = 0.016) {
    states.forEach((state, i) => {
      state.age += Math.min(delta, 0.05);
      const strength = Math.exp(-state.age * 7);
      letters[i].position.z = 0.72 - (reduced.matches ? 0 : Math.sin(state.age * 25) * 0.16 * strength);
      state.material.emissiveIntensity = strength * 0.48 + (hovered === i ? 0.11 : 0);
    });
    renderer.render(scene, camera);
  }
  resize(); draw();
  return { canvas, resize, draw, strike, dispose() {
    canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', press);
    const materials = new Set(), geometries = new Set();
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
    floorMap.dispose(); wallMap.dispose(); wood.dispose(); environment.dispose(); renderer.dispose(); canvas.remove();
  } };
}

