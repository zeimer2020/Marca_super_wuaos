import test from 'node:test';
import assert from 'node:assert/strict';
import { createMelody, MELODY } from '../src/audio/melody.js';
const flush = () => new Promise(resolve => setImmediate(resolve));
test('phrase plays all eight letters and starts only on request without duplicate timers', async () => {
  const notes = [], jobs = new Map(); let serial = 0;
  const m = createMelody({ play: async n => notes.push(n), silence() {}, schedule(fn) { jobs.set(++serial,fn); return serial; }, cancel(id) { jobs.delete(id); } });
  assert.equal(notes.length,0); m.start(); m.start(); await flush();
  for(let i=1;i<MELODY.length;i++){const [id,fn]=jobs.entries().next().value;jobs.delete(id);fn();await flush();}
  assert.equal(new Set(notes).size,8); assert.equal(jobs.size,1); m.stop(); assert.equal(jobs.size,0);
});
test('stopping during audio unlock cancels pending note and prevents rescheduling', async () => {
  let release, guard, timers=0;
  const m=createMelody({play:(_,isCurrent)=>{guard=isCurrent;return new Promise(r=>{release=r;});},silence(){},schedule(){timers++;},cancel(){}});
  m.start(); assert.equal(guard(),true); m.stop(); assert.equal(guard(),false); release(); await flush(); assert.equal(timers,0); assert.equal(m.running,false);
});
test('audio failures restore off state and notify once', async () => {
  let errors=0, silenced=0;
  const m=createMelody({play:async()=>{throw new Error('blocked');},silence(){silenced++;},onError(){errors++;}});
  m.start(); await flush(); assert.equal(m.running,false); assert.equal(errors,1); assert.equal(silenced,1);
});
