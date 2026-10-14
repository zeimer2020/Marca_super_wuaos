import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstrument, NOTES } from '../src/audio/instrument.js';

function mockAudio(t) {
  const contexts = [];
  const parameter = () => ({ value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime(v) { this.value = v; }, cancelAndHoldAtTime() {} });
  const node = () => ({ connect() {}, disconnect() { this.disconnected = true; } });
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 1; this.destination = {}; this.oscillators = []; this.gains = []; contexts.push(this); }
    createGain() { const gain = { ...node(), gain: parameter() }; this.gains.push(gain); return gain; }
    createDynamicsCompressor() { return { ...node(), ...Object.fromEntries(['threshold', 'knee', 'ratio', 'attack', 'release'].map(k => [k, parameter()])) }; }
    createBiquadFilter() { return { ...node(), frequency: parameter(), Q: parameter() }; }
    createOscillator() { const oscillator = { ...node(), frequency: parameter(), start() { this.started = true; }, stop(time) { this.stopTime = time; } }; this.oscillators.push(oscillator); return oscillator; }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  const previous = globalThis.AudioContext;
  globalThis.AudioContext = AudioContext;
  t.after(() => { globalThis.AudioContext = previous; });
  return contexts;
}

// Node has no AudioContext property; install a temporary configurable placeholder.
if (!('AudioContext' in globalThis)) globalThis.AudioContext = function () {};

test('all eight characters have distinct pitches and keyboard keys, including repeated letters', () => {
  assert.equal(NOTES.map(n => n.letter).join(''), 'Marshall');
  assert.equal(new Set(NOTES.map(n => n.frequency)).size, 8);
  assert.equal(NOTES.map(n => n.key).join(''), 'asdfghjk');
  assert.deepEqual(NOTES.map(n => n.note), ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']);
  assert.ok(Math.abs(NOTES[5].frequency / NOTES[0].frequency - 2) < 0.00001);
});

test('context is lazy, muted and zero-volume clicks stay silent, invalid inputs reject', async t => {
  const contexts = mockAudio(t);
  const instrument = createInstrument();
  assert.equal(contexts.length, 0);
  instrument.setMuted(true);
  assert.equal(await instrument.play(0), false);
  instrument.setMuted(false);
  instrument.setVolume(-4);
  assert.equal(await instrument.play(0), false);
  assert.equal(contexts.length, 0);
  assert.throws(() => instrument.setVolume(NaN), TypeError);
  await assert.rejects(instrument.play(8), RangeError);
  await assert.rejects(instrument.play(0.5), RangeError);
});

test('click starts the selected pitch and applies master volume and mute', async t => {
  const contexts = mockAudio(t);
  const instrument = createInstrument();
  instrument.setVolume(2);
  assert.equal(await instrument.play(4), true);
  const context = contexts[0];
  assert.equal(context.oscillators[0].frequency.value, 440);
  assert.equal(context.gains[0].gain.value, 0.34);
  assert.equal(context.state, 'running');
  instrument.setMuted(true);
  assert.equal(context.gains[0].gain.value, 0);
  await instrument.dispose();
});

test('thirteenth note releases oldest voice, natural endings and disposal disconnect nodes', async t => {
  const contexts = mockAudio(t);
  const instrument = createInstrument();
  for (let i = 0; i < 13; i++) await instrument.play(i % 8);
  const context = contexts[0];
  assert.equal(context.oscillators[0].stopTime, 1.03);
  context.oscillators[0].onended();
  assert.ok(context.oscillators[0].disconnected);
  await instrument.dispose();
  assert.ok(context.oscillators.every(o => o.disconnected));
  assert.equal(context.state, 'closed');
  assert.equal(instrument.enabled, false);
  await assert.rejects(instrument.play(0), /cerrado/);
  await instrument.dispose();
});

