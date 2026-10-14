import { clamp, motionLimits } from './parameters.js';
import { sampleFlow } from './flowField.js';

const WIDTH = 32, HEIGHT = 20;
const MAP_W = 128, MAP_H = 80;

// Every particle remembers its place in the lettering. Forces deform the word;
// damped springs restore its identity when the visitor lets go.
export function createSimulation({ params, count = 9000, targets, random = Math.random }) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  if (targets && (targets.length !== count * 3 || !targets.every(Number.isFinite))) {
    throw new RangeError('targets must contain three finite coordinates per particle');
  }
  const homes = targets ? new Float32Array(targets) : Float32Array.from({ length: count * 3 }, (_, k) =>
    k % 3 === 0 ? (random() - 0.5) * 26 : k % 3 === 1 ? (random() - 0.5) * 6 : 0);
  let positions = homes.slice(), previous = homes.slice();
  const velocities = new Float32Array(count * 3), activity = new Float32Array(count);
  const trail = new Float32Array(MAP_W * MAP_H), flow = new Float32Array(2);
  let phase = 0;

  function reset() {
    positions.set(homes); previous.set(homes); velocities.fill(0); activity.fill(0); trail.fill(0);
    phase = 0;
    Object.assign(params, { charge: 0, pulse: 0, rebound: 0, spreadBurst: false, localHit: false });
  }
  function sampleTrail(x, y) {
    const ix = clamp(Math.floor((x / WIDTH + 0.5) * MAP_W), 0, MAP_W - 1);
    const iy = clamp(Math.floor((y / HEIGHT + 0.5) * MAP_H), 0, MAP_H - 1);
    return trail[iy * MAP_W + ix];
  }
  function step(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, 1 / 30) * (params.suspend ? 0.045 : 1);
    const tension = clamp(params.tension, 0, 1), bond = clamp(params.bond, 0, 1);
    // Sustain controls the real decay of elastic energy, not just its rendering.
    const memory = clamp(params.memory, 0, 1);
    const spring = 35 + bond * 30, damping = (8 + bond * 3) * (1 - memory * 0.65);
    const gestureGain = 0.75 + tension * 0.65;
    const limits = motionLimits(params);
    phase += dt * Math.PI * 2 * clamp(1 / params.rhythm.beatSeconds, 1, 6);
    params.charge = params.gather ? Math.min(1, params.charge + dt * 1.8) : Math.max(0, params.charge - dt * 3);
    previous.set(positions);
    for (let i = 0; i < count; i++) {
      const k = i * 3, x = positions[k], y = positions[k + 1], z = positions[k + 2];
      const motionScale = params.reducedMotion ? 0.2 : 1;
      const compression = params.gather ? 1 - params.charge * 0.66 * motionScale : 1;
      let ax = (homes[k] * compression - x) * spring - velocities[k] * damping;
      let ay = (homes[k + 1] * (params.gather ? 1 - 0.2 * motionScale : 1) - y) * spring - velocities[k + 1] * damping;
      let az = (homes[k + 2] - z) * spring - velocities[k + 2] * damping;
      const springX = ax, springY = ay, springZ = az;
      if (params.pointer.active) {
        const dx = params.pointer.x - x, dy = params.pointer.y - y;
        const distance = Math.hypot(dx, dy), influence = Math.max(0, 1 - distance / 4.5) ** 2;
        const sign = params.pointer.repel ? -1 : 1;
        ax += influence * gestureGain * (dx * sign * 95 + clamp(params.pointer.vx, -30, 30) * 5);
        ay += influence * gestureGain * (dy * sign * 95 + clamp(params.pointer.vy, -30, 30) * 5);
        az += influence * gestureGain * 15;
      }
      if (params.pulse > 0) {
        const dx = x - params.pulseX, dy = y - params.pulseY;
        const distance = Math.hypot(dx, dy), local = params.localHit ? Math.max(0, 1 - distance / 6) : 1;
        const amplitude = params.pulse * local * (65 + tension * 65);
        sampleFlow(homes[k], homes[k + 1], params.field, tension, flow);
        if (params.spreadBurst) {
          ax += homes[k] * amplitude * 0.15; ay += homes[k + 1] * amplitude * 0.15;
        } else if (params.localHit) {
          ax += dx / Math.max(0.3, distance) * amplitude;
          ay += dy / Math.max(0.3, distance) * amplitude;
        } else {
          ax += flow[0] * amplitude * 0.3;
          ay += Math.sin(homes[k] * 0.9) * amplitude;
        }
        az += Math.sin(homes[k] * 0.6) * amplitude * 0.25;
      }
      if (params.vibrate || params.hey) {
        const wave = Math.sin(phase * 2 - homes[k] * 0.6);
        ay += wave * (params.hey ? 95 : 65) * gestureGain;
        az += Math.cos(phase - homes[k] * 0.4) * 20 * gestureGain;
      }
      ax = springX + (ax - springX) * motionScale;
      ay = springY + (ay - springY) * motionScale;
      az = springZ + (az - springZ) * motionScale;
      const force = Math.hypot(ax, ay, az), forceScale = Math.min(1, limits.force / Math.max(force, 0.0001));
      let vx = velocities[k] + ax * forceScale * dt;
      let vy = velocities[k + 1] + ay * forceScale * dt;
      let vz = velocities[k + 2] + az * forceScale * dt;
      const speed = Math.hypot(vx, vy, vz), scale = Math.min(1, limits.speed / Math.max(speed, 0.0001));
      vx *= scale; vy *= scale; vz *= scale;
      velocities[k] = vx; velocities[k + 1] = vy; velocities[k + 2] = vz;
      positions[k] = x + vx * dt; positions[k + 1] = y + vy * dt; positions[k + 2] = z + vz * dt;
      activity[i] += (clamp(speed / 10, 0, 1) - activity[i]) * (1 - Math.exp(-dt * 7));
      const ix = clamp(Math.floor((x / WIDTH + 0.5) * MAP_W), 0, MAP_W - 1);
      const iy = clamp(Math.floor((y / HEIGHT + 0.5) * MAP_H), 0, MAP_H - 1);
      trail[iy * MAP_W + ix] = Math.min(12, trail[iy * MAP_W + ix] + activity[i] * dt);
    }
    const decay = Math.exp(-dt * (3 - clamp(params.memory, 0, 1) * 2.5));
    for (let i = 0; i < trail.length; i++) trail[i] *= decay;
    params.pulse = Math.max(0, params.pulse - dt / Math.max(0.05, params.pulseDuration));
    params.rebound = Math.max(0, params.rebound - dt * 2);
  }
  return { count, step, reset, sampleTrail, bounds: { width: WIDTH, height: HEIGHT },
    get positions() { return positions; }, get previousPositions() { return previous; },
    get velocities() { return velocities; }, get activity() { return activity; }, get trail() { return trail; } };
}


