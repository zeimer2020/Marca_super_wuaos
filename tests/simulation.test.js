import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation } from '../src/simulation/createSimulation.js';
import { createParameters, applyPreset, motionLimits } from '../src/simulation/parameters.js';
import { sampleFlow } from '../src/simulation/flowField.js';
import { strike, releaseCharge } from '../src/simulation/gestures.js';
function instrument(count = 120) {
  const params = createParameters();
  const targets = Float32Array.from({length: count * 3}, (_, k) => k % 3 === 0 ? ((k / 3) % 20) - 9.5 : k % 3 === 1 ? Math.floor(k / 60) - 2.5 : 0);
  return { params, targets, sim: createSimulation({params, count, targets}) };
}
const advance = (sim, frames) => { for(let i = 0; i < frames; i++) sim.step(1 / 60); };
const error = ({sim, targets}) => Math.sqrt(sim.positions.reduce((sum, value, i) => sum + (value - targets[i]) ** 2, 0) / sim.count);

test('The word is stable at rest and target input is copied', () => {
  const state = instrument(), before = state.targets.slice();
  state.targets.fill(0); advance(state.sim, 180);
  assert.deepEqual(state.sim.positions, before);
  assert.ok(state.sim.velocities.every(v => v === 0));
});
test('A manual accent deforms the letters then returns to the same readable form', () => {
  for (let preset = 0; preset < 4; preset++) {
    const s = instrument(); applyPreset(s.params, preset); strike(s.params);
    assert.deepEqual(s.sim.positions, s.targets);
    advance(s.sim, 12); assert.ok(error(s) > 0.2);
    advance(s.sim, 360); assert.ok(error(s) < 0.005);
    assert.equal(s.params.pulse, 0);
  }
});
test('Local drag deforms nearby particles more than distant lettering', () => {
  const s = instrument(); Object.assign(s.params.pointer, { active: true, x: -8, y: 1, vx: 10 });
  advance(s.sim, 20);
  let near = 0, far = 0;
  for(let i = 0; i < s.sim.count; i++) {
    const k = i * 3, d = Math.hypot(s.sim.positions[k] - s.targets[k], s.sim.positions[k+1] - s.targets[k+1]);
    if (s.targets[k] < -5) near += d;
    if (s.targets[k] > 5) far += d;
  }
  assert.ok(near > 2); assert.ok(far < 0.01);
  s.params.pointer.active = false; advance(s.sim, 300); assert.ok(error(s) < 0.005);
});
test('Compression and release store energy without losing the word', () => {
  const s = instrument(); s.params.gather = true; advance(s.sim, 90);
  assert.equal(s.params.charge, 1);
  const width = () => Math.max(...s.sim.positions.filter((_, i) => i % 3 === 0)) - Math.min(...s.sim.positions.filter((_, i) => i % 3 === 0));
  const compressed = width(); assert.ok(compressed < 9);
  s.params.gather = false; releaseCharge(s.params); advance(s.sim, 30);
  assert.ok(width() > compressed * 1.5);
  advance(s.sim, 360); assert.ok(error(s) < 0.005);
});
test('Sustained gestures stay finite, bounded, and respect speed caps for every preset', () => {
  for(let preset = 0; preset < 4; preset++) {
    const s = instrument(); applyPreset(s.params, preset);
    for(let frame = 0; frame < 600; frame++) {
      Object.assign(s.params.pointer, {active: frame % 80 < 40, x: Math.sin(frame * 0.1) * 12, y: 2, vx: 1000, repel: frame % 50 < 25});
      s.params.vibrate = frame % 90 < 45;
      s.params.gather = frame % 100 > 70;
      if(frame % 30 === 0) strike(s.params);
      const cap = motionLimits(s.params).speed;
      s.sim.step(frame % 17 === 0 ? 0.5 : 1 / 60);
      assert.ok(s.sim.positions.every(Number.isFinite));
      for(let i = 0; i < s.sim.count; i++) {
        const k = i * 3;
        assert.ok(Math.hypot(...s.sim.velocities.subarray(k, k+3)) <= cap + 0.00001);
        assert.ok(Math.abs(s.sim.positions[k]) < 18 && Math.abs(s.sim.positions[k+1]) < 10 && Math.abs(s.sim.positions[k+2]) < 6);
      }
    }
  }
});
test('Reset restores letter positions and interpolation; invalid time cannot poison state', () => {
  const s = instrument(); strike(s.params); advance(s.sim, 15);
  const before = s.sim.positions.slice(); s.sim.step(0); s.sim.step(NaN); assert.deepEqual(s.sim.positions, before);
  s.sim.step(1/60); assert.deepEqual(s.sim.previousPositions, before);
  s.sim.reset(); assert.deepEqual(s.sim.positions, s.targets); assert.deepEqual(s.sim.previousPositions, s.targets);
  assert.ok(s.sim.velocities.every(v => v === 0)); assert.ok(s.sim.trail.every(v => v === 0));
});
test('Vibration is visible and suspension slows an otherwise identical response', () => {
  const a = instrument(), b = instrument();
  a.params.vibrate = b.params.vibrate = true; b.params.suspend = true;
  advance(a.sim, 15); advance(b.sim, 15); assert.ok(error(a) > 0.1); assert.ok(error(b) < error(a) * 0.1);
  a.params.vibrate = false; advance(a.sim, 300); assert.ok(error(a) < 0.005);
});
test('Gesture timings never schedule music or automatic pulses', () => {
  const s = instrument(); releaseCharge(s.params); assert.equal(s.params.pulse, 0);
  for(const time of [0, 0.4, 0.8]) strike(s.params, 1, false, time);
  assert.equal(s.params.rhythm.beatSeconds, 0.4);
  const serial = s.params.hitSerial; advance(s.sim, 180);
  assert.equal(s.params.hitSerial, serial); assert.equal(s.params.pulse, 0);
  Object.assign(s.params.pointer, {active: true, x: 5, y: -2}); strike(s.params); s.params.pointer.active = false;
  assert.equal(s.params.localHit, true); assert.equal(s.params.pulseX, 5); assert.equal(s.params.pulseY, -2);
});
test('All attack fields return normalized directions', () => {
  const out = new Float32Array(2);
  for(let field = 0; field < 4; field++) for(const [x, y] of [[0,0],[5,2],[-9,3]]) {
    sampleFlow(x,y,field,0.5,out); assert.ok(Math.abs(Math.hypot(...out) - 1) < 0.00001);
  }
});

test('Reduced motion keeps interaction available with smaller amplitude', () => {
  const a = instrument(), b = instrument(); b.params.reducedMotion = true;
  strike(a.params); strike(b.params); advance(a.sim, 12); advance(b.sim, 12);
  assert.ok(error(b) > 0.01); assert.ok(error(b) < error(a) * 0.4);
});

test('Higher Sustain preserves elastic energy longer after the same manual strike', () => {
  const short = instrument(), long = instrument();
  short.params.memory = 0; long.params.memory = 1;
  strike(short.params); strike(long.params);
  advance(short.sim, 75); advance(long.sim, 75);
  const energy = s => s.sim.positions.reduce((sum, value, i) => sum + 60 * (value - s.targets[i]) ** 2 + s.sim.velocities[i] ** 2, 0);
  assert.ok(energy(long) > energy(short) * 10, 'Sustain must visibly prolong physical resonance');
  assert.ok(error(long) > 0.02);
  advance(long.sim, 480); assert.ok(error(long) < 0.005, 'Even maximum Sustain must recover the lettering');
});

test('Tension changes drag and vibration amplitude below the speed limit', () => {
  for (const gesture of ['drag', 'vibrate']) {
    const soft = instrument(), hard = instrument(); soft.params.tension = 0; hard.params.tension = 1;
    for (const state of [soft, hard]) {
      if (gesture === 'drag') Object.assign(state.params.pointer, { active: true, x: -8, y: 1, vx: 2 });
      else state.params.vibrate = true;
      advance(state.sim, 8);
      assert.ok(state.sim.velocities.every(v => Math.abs(v) < 10));
    }
    assert.ok(error(hard) > error(soft) * 1.3, `${gesture} must respond to Tension`);
  }
});

