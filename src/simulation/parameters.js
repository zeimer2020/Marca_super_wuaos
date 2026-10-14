export const PRESETS = [
  { name: 'Clean', subtitle: 'Precisión y respuesta elástica', field: 0, tension: 0.35, bond: 0.85, memory: 0.2, palette: 0 },
  { name: 'Crunch', subtitle: 'Carácter que vibra en cada letra', field: 1, tension: 0.65, bond: 0.5, memory: 0.4, palette: 1 },
  { name: 'Drive', subtitle: 'Máxima energía, la misma identidad', field: 2, tension: 1, bond: 0.25, memory: 0.55, palette: 2 },
  { name: 'Sustain', subtitle: 'La energía deja una resonancia', field: 3, tension: 0.5, bond: 0.35, memory: 0.9, palette: 3 },
];
export const PARTICLE_COUNT = { min: 1000, max: 20000, step: 500, initial: 9000 };
export function normalizeParticleCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return PARTICLE_COUNT.initial;
  return Math.max(PARTICLE_COUNT.min, Math.min(PARTICLE_COUNT.max, Math.round(number / PARTICLE_COUNT.step) * PARTICLE_COUNT.step));
}
export function createParameters() {
  return { ...PRESETS[0], preset: 0,
    pointer: { x: 0, y: 0, vx: 0, vy: 0, active: false, repel: false },
    reducedMotion: false, gather: false, suspend: false, vibrate: false, hey: false, pulse: 0, charge: 0,
    pulseX: 0, pulseY: 0, spreadBurst: false, hitSerial: 0,
    pulseDuration: 0.22, rebound: 0, hitDirection: 1, localHit: false,
    rhythm: { beatSeconds: 0.5, lastTap: null, intervals: [], measured: false },
  };
}
export function applyPreset(params, index) {
  if (!PRESETS[index]) return;
  Object.assign(params, PRESETS[index], { preset: index });
}
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function motionLimits(params) {
  const tension = clamp(params.tension, 0, 1), accent = clamp(params.pulse, 0, 1);
  return { speed: 14 + tension * 8 + accent * 12, force: 180 + tension * 100 + accent * 180 };
}

