import * as THREE from 'three';

const palettes = [
  ['#c9a15c', '#fff2cc'], ['#d9c7a6', '#fff9e9'],
  ['#be9450', '#fff0bd'], ['#ad9c7e', '#eee6d7'],
];

export function createStage(mount, simulation, params) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'particle-canvas';
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Marshall: letras de partículas. Arrastra para deformar, pulsa para golpear y suelta para que recuperen su identidad.');
  mount.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-16, 16, 10, -10, 0.1, 100);
  camera.position.set(0, 0, 30);
  const geometry = new THREE.BufferGeometry();
  const renderPositions = simulation.positions.slice();
  const positionAttribute = new THREE.BufferAttribute(renderPositions, 3).setUsage(THREE.DynamicDrawUsage);
  const activityAttribute = new THREE.BufferAttribute(simulation.activity, 1).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('activity', activityAttribute);
  const seeds = new Float32Array(simulation.count);
  for (let i = 0; i < seeds.length; i++) seeds[i] = (i * 0.61803398875) % 1;
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      cold: { value: new THREE.Color(palettes[0][0]) },
      hot: { value: new THREE.Color(palettes[0][1]) },
      pointScale: { value: 2 }, pulse: { value: 0 },
    },
    vertexShader: `attribute float activity; attribute float seed;
      uniform float pointScale; uniform float pulse;
      varying float energy; varying float grain;
      void main() {
        energy = clamp(activity, 0.0, 1.0); grain = seed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointScale * (0.85 + seed * 0.45 + energy * 0.18 + pulse * 0.2);
      }`,
    fragmentShader: `uniform vec3 cold; uniform vec3 hot;
      varying float energy; varying float grain;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float opacity = 1.0 - smoothstep(0.26, 0.5, r);
        vec3 color = mix(cold, hot, clamp(grain * 0.6 + energy * 0.5, 0.0, 1.0));
        gl_FragColor = vec4(color, opacity * 0.94);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  const targetCold = new THREE.Color(), targetHot = new THREE.Color();
  function resize() {
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    const aspect = width / height;
    // Always reserve breathing room around the complete word, including phones.
    const halfWidth = Math.max(15.2, 7.5 * aspect), halfHeight = halfWidth / aspect;
    camera.left = -halfWidth; camera.right = halfWidth;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    const density = Math.sqrt(4500 / Math.max(1000, simulation.count));
    material.uniforms.pointScale.value = Math.max(1.3, Math.min(4.6, width / (halfWidth * 2) * 0.085 * density)) * renderer.getPixelRatio();
  }
  function draw(delta, frozen = false, interpolation = 1) {
    const palette = palettes[params.palette] || palettes[0];
    targetCold.set(palette[0]); targetHot.set(palette[1]);
    material.uniforms.cold.value.lerp(targetCold, Math.min(1, delta * 4));
    material.uniforms.hot.value.lerp(targetHot, Math.min(1, delta * 4));
    material.uniforms.pulse.value = params.pulse || 0;
    if (!frozen) {
      const previous = simulation.previousPositions || simulation.positions;
      const alpha = THREE.MathUtils.clamp(interpolation, 0, 1);
      for (let i = 0; i < renderPositions.length; i++) renderPositions[i] = previous[i] + (simulation.positions[i] - previous[i]) * alpha;
      positionAttribute.needsUpdate = true;
      activityAttribute.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  function projectPointer(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2), camera);
    return raycaster.ray.intersectPlane(plane, hit);
  }
  resize();
  return {
    canvas: renderer.domElement, draw, resize, projectPointer,
    clear() { renderer.clear(); }, setPresentation() { resize(); },
    dispose() { geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
