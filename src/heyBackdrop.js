// A self-contained, hand-drawn script inspired by the supplied Marshall lettering.
// The strokes themselves are the particle targets: there is no background logo,
// font download, image overlay, or decoration outside the letters.
const strokes = [
  'M 14 145 C 26 124 49 120 57 135 C 64 150 49 167 31 163 C 10 158 16 139 36 140',
  'M 37 162 C 80 173 113 76 158 25 C 164 17 173 18 169 27 C 145 72 116 121 106 160 C 131 141 175 66 216 24 C 224 16 233 18 227 28 C 194 75 171 113 154 150 C 145 173 168 169 188 145',
  'M 244 119 C 233 103 213 111 198 130 C 180 153 189 171 205 165 C 225 158 241 132 251 114 M 251 114 C 239 136 228 157 237 163 C 247 169 261 150 276 133',
  'M 267 147 C 282 127 291 112 294 100 C 302 85 300 76 292 80 C 278 88 283 110 303 112 C 313 112 316 115 309 126 L 295 151 C 283 173 306 168 325 145',
  'M 325 145 C 340 130 349 114 359 104 C 365 98 368 104 364 111 C 348 127 344 135 355 143 C 377 158 352 176 336 164 C 329 158 337 152 346 153 M 356 163 C 372 160 387 139 398 120',
  'M 383 163 C 400 124 423 77 433 54 C 437 45 447 46 444 55 L 406 136 C 420 116 436 106 446 114 C 454 121 438 144 432 156 C 424 176 449 163 461 146',
  'M 512 119 C 500 106 482 112 468 130 C 450 152 457 171 474 165 C 493 158 508 134 518 115 M 518 115 C 506 139 495 158 505 164 C 517 169 531 147 543 132',
  'M 534 143 C 559 120 597 76 600 52 C 603 38 591 43 582 54 C 562 79 545 116 535 144 C 524 175 548 169 571 145',
  'M 568 145 C 598 119 633 78 639 50 C 642 35 631 40 620 54 C 602 76 583 117 573 145 C 560 179 591 173 612 146',
];
let maskCanvas;
export function createLetterMask() {
  if (maskCanvas) return maskCanvas;
  const canvas = document.createElement('canvas');
  canvas.width = 1950; canvas.height = 510;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.scale(3, 3);
  context.translate(0, -12);
  context.strokeStyle = '#fff'; context.lineWidth = 7.4;
  context.lineCap = 'round'; context.lineJoin = 'round';
  for (const stroke of strokes) context.stroke(new Path2D(stroke));
  maskCanvas = canvas;
  return canvas;
}

export function createLetterTargets(count) {
  const canvas = createLetterMask();
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const candidates = [];
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      if (data[(y * canvas.width + x) * 4 + 3] > 160) candidates.push(x, y);
    }
  }
  const targets = new Float32Array(count * 3), size = candidates.length / 2;
  // A reproducible irrational stride distributes every particle through the word.
  for (let i = 0; i < count; i++) {
    const sample = Math.floor(((i * 0.6180339887498949) % 1) * size) * 2;
    targets[i * 3] = (candidates[sample] / canvas.width - 0.5) * 26;
    targets[i * 3 + 1] = (0.5 - candidates[sample + 1] / canvas.height) * 6.8;
    targets[i * 3 + 2] = Math.sin(i * 2.3999632297) * 0.035;
  }
  return targets;
}
