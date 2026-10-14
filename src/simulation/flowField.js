// Spatial directions shape the attack only. At rest no field erases the word.
export function sampleFlow(x, y, field, tension, out) {
  if (field === 0) { out[0] = 1; out[1] = Math.sin(x * 0.65) * 0.5; }
  else if (field === 1) { out[0] = -y * 0.4; out[1] = Math.sin(x * 0.5); }
  else if (field === 2) { out[0] = Math.cos(y * (0.4 + tension)); out[1] = Math.sin(x * 1.2); }
  else { out[0] = Math.cos(x * 0.25); out[1] = Math.sin(y * 0.5); }
  const length = Math.hypot(out[0], out[1]);
  if (length < 0.00001) { out[0] = 1; out[1] = 0; }
  else { out[0] /= length; out[1] /= length; }
  return out;
}
