import test from 'node:test';
import assert from 'node:assert/strict';
import { createPowerTransition } from '../src/power.js';
test('off remains scattered, repeated activation cannot restart formation, readiness fires once', () => {
  let calls = 0; const p = createPowerTransition(() => calls++);
  p.step(20); assert.equal(p.state,'off'); assert.equal(p.progress,0);
  assert.equal(p.start(),true); assert.equal(p.start(),false);
  p.step(1.6); assert.equal(p.state,'forming'); assert.equal(p.progress,.5); assert.equal(calls,0);
  p.step(1.6); assert.equal(p.state,'ready'); assert.equal(p.progress,1); assert.equal(calls,1);
  p.step(10); p.start(); assert.equal(calls,1);
});
test('reduced motion finishes promptly and invalid deltas cannot unlock or corrupt state', () => {
  const p=createPowerTransition(); p.start();
  for(const delta of [NaN,Infinity,-2,0]) p.step(delta);
  assert.equal(p.progress,0); p.step(.45,true); assert.equal(p.state,'ready');
});
