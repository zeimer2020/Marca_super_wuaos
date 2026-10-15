import * as THREE from 'three';

export function createSurface(kind, width = 1024, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  let seed = 17041;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const pixels = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    let value, rgb;
    if (kind === 'walnut') {
      const grain = y + Math.sin(x / width * Math.PI * 2) * 13 + Math.sin(x / width * Math.PI * 6 + y * .006) * 4;
      const fine = Math.sin(grain * 2.6) * 3;
      const ribbon = Math.sin(grain * .13 + Math.sin(grain * .018) * 3) * 9;
      const pores = random() > .985 ? -18 : 0;
      value = fine + ribbon + pores + (random() - .5) * 7;
      rgb = [82 + value, 45 + value * .62, 24 + value * .4];
    } else if (kind === 'tolex') {
      const pebble = Math.sin(x * .45 + Math.sin(y * .31) * 2) * Math.sin(y * .53 + Math.sin(x * .23));
      value = 13 + Math.abs(pebble) * 13 + (random() - .5) * 5;
      rgb = [value, value * .96, value * .89];
    } else if (kind === 'cloth') {
      const vertical = Math.pow(Math.sin(x * Math.PI / 5), 2);
      const horizontal = Math.pow(Math.sin(y * Math.PI / 5), 2);
      value = 12 * vertical + 9 * horizontal + (random() - .5) * 8;
      const thread = ((Math.floor(x / 5) + Math.floor(y / 5)) % 3 === 0) ? 18 : 0;
      rgb = [32 + value + thread, 29 + value * .85 + thread, 23 + value * .62 + thread * .8];
    } else {
      value = (random() - .5) * 10 + Math.sin(x * .7 + Math.sin(y * .51)) * 2;
      rgb = [18 + value * .4, 30 + value * .6, 24 + value * .45];
    }
    pixels.data[i] = rgb[0]; pixels.data[i + 1] = rgb[1]; pixels.data[i + 2] = rgb[2]; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const color = new THREE.CanvasTexture(canvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = color.wrapT = THREE.RepeatWrapping;
  color.anisotropy = 8;
  const bump = color.clone(); bump.colorSpace = THREE.NoColorSpace;
  return { color, bump };
}

export function addClassicBar(scene, { box, walnut, bronze, darkWood, leather }) {
  // Green leather panels and walnut joinery behind the instrument.
  box(170, 80, .4, leather, 0, 34, -11.5, .08);
  for (let x = -72; x <= 72; x += 12) {
    box(11.5, 12.5, .4, walnut, x, .8, -11.1, .10);
    box(10.4, 11.4, .25, darkWood, x, .8, -10.84, .08);
    box(10, 11, .24, walnut, x, .8, -10.66, .07);
    box(.24, 35, .5, walnut, x - 5.9, 11, -10.9, .05);
  }
  box(170, .55, .8, walnut, 0, 7.4, -10.8, .1);
  box(170, .08, .85, bronze, 0, 7.72, -10.77, .025);
  box(170, .8, .9, walnut, 0, 21, -10.8, .12);

  const glass = new THREE.MeshPhysicalMaterial({ color: 0x2c5136, metalness: .05, roughness: .16, transparent: true, opacity: .78, clearcoat: 1 });
  const amber = new THREE.MeshPhysicalMaterial({ color: 0x6b3613, roughness: .2, clearcoat: 1 });
  const label = new THREE.MeshStandardMaterial({ color: 0xbba37a, roughness: .85 });
  const lampShade = new THREE.MeshStandardMaterial({ color: 0xe1bf83, roughness: .85, side: THREE.DoubleSide, emissive: 0xffb34f, emissiveIntensity: .42 });
  function cylinder(radiusTop, radiusBottom, height, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  for (const side of [-1, 1]) {
    const cx = side * 24;
    box(10, .45, 2.4, walnut, cx, 7.9, -8.9, .08);
    box(10, .45, 2.4, walnut, cx, 13.7, -8.9, .08);
    for (const shelfY of [8.2, 14]) for (let i = 0; i < 5; i++) {
      const x = cx - 3.6 + i * 1.8, h = 2.1 + (i % 3) * .33;
      const material = i % 2 ? glass : amber;
      cylinder(.45, .47, h, material, x, shelfY + h / 2, -8.7);
      cylinder(.18, .34, .42, material, x, shelfY + h + .21, -8.7);
      cylinder(.17, .17, .65, material, x, shelfY + h + .72, -8.7);
      cylinder(.19, .19, .18, bronze, x, shelfY + h + 1.05, -8.7);
      cylinder(.476, .476, .65, label, x, shelfY + .85, -8.7);
    }
    const x = side * 16;
    box(.8, 3.5, .3, bronze, x, 10.2, -10.5, .18);
    cylinder(.13, .13, 2.3, bronze, x, 10, -8.8);
    cylinder(.85, 1.55, 2, lampShade, x, 12, -8.8);
    cylinder(1.57, 1.57, .07, bronze, x, 11, -8.8);
    const lamp = new THREE.PointLight(0xffba70, 185, 32, 2);
    lamp.position.set(x, 11, -7.9); scene.add(lamp);
  }
}

