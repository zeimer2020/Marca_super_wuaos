export function createPowerTransition(onReady = () => {}) {
  let state = 'off', elapsed = 0, progress = 0;
  return {
    get state() { return state; },
    get progress() { return progress; },
    start() { if (state !== 'off') return false; state = 'forming'; return true; },
    step(delta, reduced = false) {
      if (state !== 'forming' || !Number.isFinite(delta) || delta <= 0) return progress;
      elapsed += delta;
      const t = Math.min(1, elapsed / (reduced ? .45 : 3.2));
      progress = t * t * (3 - 2 * t);
      if (t === 1) { state = 'ready'; onReady(); }
      return progress;
    },
  };
}
