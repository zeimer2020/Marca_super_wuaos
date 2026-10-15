import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LETTER_PATHS } from './lettering.js';
import { createSurface, addClassicBar } from './surfaces.js';
import { createPowerTransition } from './power.js';


export function createStage(mount, { onLetter = () => {}, onHover = () => {}, onReady = () => {} } = {}) {
  const power = createPowerTransition(onReady);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
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
  scene.environmentIntensity = 0.55;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffd6a0, 0x21100a, 0.72));
  const key = new THREE.DirectionalLight(0xffd3a0, 2.1);
  key.position.set(-10, 11, 15); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 15, bottom: -15, near: 0.1, far: 60 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.025;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffc58d, 0.8);
  fill.position.set(13, 2, 9); scene.add(fill);
  const woodSurface = createSurface('walnut', 2048, 1024);
  const clothSurface = createSurface('cloth', 1024, 512);
  const leatherSurface = createSurface('leather');
  const tolexSurface = createSurface('tolex');
  const tolex = new THREE.MeshStandardMaterial({ map: tolexSurface.color, bumpMap: tolexSurface.bump, bumpScale: .09, roughness: .73 });
  const wood = woodSurface.color;
  const cloth = new THREE.MeshStandardMaterial({ map: clothSurface.color, bumpMap: clothSurface.bump, bumpScale: .045, roughness: .94 });
  const leather = new THREE.MeshStandardMaterial({ map: leatherSurface.color, bumpMap: leatherSurface.bump, bumpScale: .055, roughness: .65 });
  const walnut = new THREE.MeshPhysicalMaterial({ map: wood, bumpMap: woodSurface.bump, bumpScale: .025, roughness: .36, metalness: 0, clearcoat: .4, clearcoatRoughness: .3 });
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
  addClassicBar(scene, { box, walnut, bronze, darkWood, leather });
  const cabinet = new THREE.Group(); scene.add(cabinet);
  const roomObjects = new Set(scene.children);
  // Black textured cabinet with a recessed woven grille and narrow brass piping.
  // Proportions and top-mounted brass controls evoke Marshall home speakers.
  box(30.2, 16, 6.4, tolex, 0, 2.8, -3.05, .58);
  box(28.65, 14.45, .22, darkWood, 0, 2.8, .13, .32);
  box(28.24, 14.04, .18, bronze, 0, 2.8, .27, .27);
  box(28.04, 13.84, .18, cloth, 0, 2.8, .38, .24);
  // The lower brass signature line is part of the physical cabinet.
  box(27.9, .24, .16, bronze, 0, -3.85, .53, .045);
  box(1.5, .48, 3.8, tolex, -11, -5.43, -2.8, .15);
  box(1.5, .48, 3.8, tolex, 11, -5.43, -2.8, .15);
  box(15.7, .10, 3.25, darkWood, 0, 10.82, -3.05, .16);
  box(15.4, .08, 3.0, bronze, 0, 10.9, -3.05, .12);
  const dialFace = new THREE.MeshStandardMaterial({ color: 0xd9b777, roughness: .38, metalness: .85 });
  for (const x of [-3.5, 0, 3.5]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.68, .73, .16, 48), darkWood);
    base.position.set(x, 11.02, -3.05); scene.add(base);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(.57, .6, .52, 48), bronze);
    knob.position.set(x, 11.28, -3.05); knob.castShadow = true; scene.add(knob);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, .035, 48), dialFace);
    face.position.set(x, 11.56, -3.05); scene.add(face);
    box(.05, .025, .27, darkWood, x, 11.59, -3.29, .01);
    for (let tick = 0; tick < 11; tick++) {
      const angle = (-140 + tick * 28) * Math.PI / 180;
      const mark = box(.045, .012, .13, darkWood, x + Math.sin(angle) * .91, 10.95, -3.05 - Math.cos(angle) * .91, .005);
      mark.rotation.y = -angle;
    }
  }
  // A small physical toggle and input socket complete the top panel.
  const toggle = new THREE.Mesh(new THREE.CylinderGeometry(.10, .13, .5, 20), dialFace);
  toggle.position.set(6.15, 11.2, -3.05); toggle.rotation.z = -.25; scene.add(toggle);
  const socket = new THREE.Mesh(new THREE.TorusGeometry(.23, .08, 12, 32), dialFace);
  socket.rotation.x = -Math.PI / 2; socket.position.set(-6.15, 10.96, -3.05); scene.add(socket);
  for (const object of [...scene.children]) if (!roomObjects.has(object)) cabinet.add(object);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshStandardMaterial({ map: floorMap, color: 0x94775d, roughness: 0.64 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -5.68; floor.receiveShadow = true; scene.add(floor);
  const loader = new SVGLoader();
  const letters = [], clickable = [], states = [], wires = [], tips = [];
  let strand = 0;
  class ScriptCurve extends THREE.Curve {
    constructor(path) { super(); this.path = path; }
    getPoint(t, target = new THREE.Vector3()) {
      const p = this.path.getPoint(t);
      return target.set((p.x - 326) * 0.041, (98 - p.y) * 0.041, 0);
    }
  }
  LETTER_PATHS.forEach((paths, index) => {
    const group = new THREE.Group(); group.position.set(0, 2.65, 0.8); group.scale.set(.76, .76, .65);
    const gold = new THREE.MeshPhysicalMaterial({ color: 0xe6b64f, metalness: 1, roughness: 0.24, clearcoat: .3, clearcoatRoughness: .2, emissive: 0xe79c2d, emissiveIntensity: 0 });
    const svg = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg">${paths.map(d => `<path d="${d}" fill="none" stroke="black"/>`).join('')}</svg>`);
    for (const path of svg.paths) for (const subpath of path.subPaths) {
      const curve = new ScriptCurve(subpath);
      const length = subpath.getLength();
      const segments = Math.max(64, Math.ceil(length * 0.9));
      const geometry = new THREE.TubeGeometry(curve, segments, .17, 24, false);
      const seed = strand++;
      // Each existing stroke begins as a loose cable, with matching topology.
      // Morphing the tube itself makes the cable bend into its final letter.
      const centerX = ((seed * .61803398875) % 1 - .5) * 23;
      const centerY = ((seed * .41421356237 + .2) % 1 - .5) * 9;
      const loose = new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, j) =>
        new THREE.Vector3(centerX + Math.sin(seed * 2.1 + j * 1.3) * 3.2,
          centerY + Math.cos(seed * 1.7 + j * 1.1) * 1.8, .12 + Math.sin(j * .9 + seed) * .1)));
      const scattered = new THREE.TubeGeometry(loose, segments, .17, 24, false);
      geometry.morphAttributes.position = [scattered.attributes.position.clone()];
      geometry.morphAttributes.normal = [scattered.attributes.normal.clone()];
      scattered.dispose();
      const mesh = new THREE.Mesh(geometry, gold);
      mesh.morphTargetInfluences[0] = 1; mesh.frustumCulled = false;
      wires.push(mesh);
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.letter = index;
      group.add(mesh); clickable.push(mesh);
      for (const t of [0, 1]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), gold);
        const home = curve.getPoint(t), start = loose.getPoint(t);
        cap.position.copy(start); cap.castShadow = true; cap.userData.letter = index;
        tips.push({ cap, home, start });
        group.add(cap); clickable.push(cap);
      }
    }
    cabinet.add(group); letters.push(group); states.push({ age: 10, material: gold });
  });
  let hovered = -1;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function hit(event) {
    if (power.state !== 'ready') return -1;
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
    if (index >= 0) onLetter(index);
  };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointerdown', press);
  function resize() {
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height); camera.aspect = width / height;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = Math.max(18 / (Math.tan(verticalFov / 2) * camera.aspect), 11.5 / Math.tan(verticalFov / 2));
    camera.position.set(distance * 0.15, distance * 0.20, distance);
    camera.lookAt(0, 2.6, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
  }
  let jump = 0, jumpVelocity = 0;
  function strike(index) { if (power.state === 'ready' && states[index]) { states[index].age = 0; jumpVelocity = Math.min(4, Math.max(0, jumpVelocity) + 3.2); } }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function draw(delta = 0.016) {
    const dt = Math.max(0, Math.min(delta, .05));
    const formed = power.step(dt, reduced.matches);
    for (const wire of wires) wire.morphTargetInfluences[0] = 1 - formed;
    for (const tip of tips) tip.cap.position.lerpVectors(tip.start, tip.home, formed);
    // Small substeps keep the soft landing stable at low frame rates.
    for (let remaining = dt; remaining > 0;) {
      const step = Math.min(remaining, 1 / 120); remaining -= step;
      jumpVelocity += (-85 * jump - 11 * jumpVelocity) * step;
      jump += jumpVelocity * step;
      if (jump < 0) { jump = 0; jumpVelocity = 0; }
      if (jump > .6) { jump = .6; jumpVelocity = Math.min(0, jumpVelocity); }
    }
    if (reduced.matches) { jump = 0; jumpVelocity = 0; }
    cabinet.position.y = jump;
    states.forEach((state, i) => {
      state.age += Math.min(delta, 0.05);
      const strength = Math.exp(-state.age * 4.5);
      letters[i].position.z = 0.8 + (reduced.matches ? 0 : Math.sin(state.age * 22) * 0.34 * strength);
      letters[i].position.y = 2.65 + (reduced.matches ? 0 : Math.sin(state.age * 14) * 0.08 * strength);
      const ignition = power.state === 'forming' ? Math.sin(formed * Math.PI) * .75 : 0;
      state.material.emissiveIntensity = power.state === 'off' ? 0 : .05 + ignition + strength * (reduced.matches ? 0.28 : 0.65) + (hovered === i ? 0.16 : 0);
    });
    renderer.render(scene, camera);
  }
  resize(); draw();
  return { canvas, resize, draw, strike, turnOn: () => power.start(), dispose() {
    canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', press);
    const materials = new Set(), geometries = new Set();
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
    floorMap.dispose(); wallMap.dispose();
    for (const surface of [woodSurface, clothSurface, leatherSurface, tolexSurface]) { surface.color.dispose(); surface.bump.dispose(); } environment.dispose(); renderer.dispose(); canvas.remove();
  } };
}





