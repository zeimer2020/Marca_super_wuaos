// Pentatonic notes make any sequence musical; every character has its own pitch.
export const NOTES = Object.freeze([
  ['M', 'C4', 261.625565, 'a'],
  ['a', 'D4', 293.664768, 's'],
  ['r', 'E4', 329.627557, 'd'],
  ['s', 'G4', 391.995436, 'f'],
  ['h', 'A4', 440, 'g'],
  ['a', 'C5', 523.251131, 'h'],
  ['l', 'D5', 587.329536, 'j'],
  ['l', 'E5', 659.255114, 'k'],
].map(([letter, note, frequency, key]) => Object.freeze({ letter, note, frequency, key })));

export function createInstrument() {
  let context;
  let master;
  let limiter;
  let volume = 0.65;
  let muted = false;
  let disposed = false;
  const voices = new Set();
  const sounding = new Set();

  function updateGain() {
    if (context && master) master.gain.setTargetAtTime(muted ? 0 : volume * 0.34, context.currentTime, 0.015);
  }

  function initialize() {
    if (context) return;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Este navegador no admite audio web.');
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : volume * 0.34;
    limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 12;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    master.connect(limiter);
    limiter.connect(context.destination);
  }

  function removeVoice(voice) {
    voices.delete(voice);
    sounding.delete(voice);
    for (const oscillator of voice.oscillators) {
      oscillator.onended = null;
      oscillator.disconnect();
    }
    voice.envelope.disconnect();
    for (const gain of voice.harmonics) gain.disconnect();
    voice.filter.disconnect();
  }

  function releaseVoice(voice, immediate = false) {
    voices.delete(voice);
    const now = context.currentTime;
    if (!immediate) {
      // A short release prevents clicks when replacing the oldest voice.
      if (voice.envelope.gain.cancelAndHoldAtTime) voice.envelope.gain.cancelAndHoldAtTime(now);
      else {
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
      }
      voice.envelope.gain.linearRampToValueAtTime(0, now + 0.025);
    }
    for (const oscillator of voice.oscillators) {
      try { oscillator.stop(immediate ? now : now + 0.03); } catch { /* Already stopped. */ }
    }
    if (immediate) removeVoice(voice);
  }

  return {
    async play(index) {
      if (!Number.isInteger(index) || index < 0 || index >= NOTES.length) throw new RangeError('Índice de letra inválido.');
      if (disposed) throw new Error('El instrumento ya está cerrado.');
      if (muted || volume === 0) return false;
      // Called directly by pointer/keyboard handlers: no audio context on load.
      initialize();
      if (context.state !== 'running') await context.resume();
      if (disposed || muted || volume === 0) return false;
      if (context.state !== 'running') throw new Error('Activa el sonido con un clic o una tecla.');
      while (voices.size >= 12) releaseVoice(voices.values().next().value);

      const now = context.currentTime;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.75, now + 0.009);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3800, now);
      filter.frequency.exponentialRampToValueAtTime(850, now + 1.4);
      filter.Q.value = 0.35;
      filter.connect(envelope);
      envelope.connect(master);

      const voice = { oscillators: [], harmonics: [], envelope, filter };
      // A round fundamental with rapidly decaying upper harmonics: a warm pluck.
      for (const [multiple, strength, decay] of [[1, 0.8, 1.75], [2, 0.2, 0.6], [3, 0.07, 0.25]]) {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = NOTES[index].frequency * multiple;
        const harmonic = context.createGain();
        harmonic.gain.setValueAtTime(strength, now);
        harmonic.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        oscillator.connect(harmonic);
        harmonic.connect(filter);
        voice.oscillators.push(oscillator);
        voice.harmonics.push(harmonic);
      }
      voices.add(voice);
      sounding.add(voice);
      voice.oscillators[0].onended = () => removeVoice(voice);
      for (const oscillator of voice.oscillators) {
        oscillator.start(now);
        oscillator.stop(now + 1.85);
      }
      return true;
    },
    setVolume(value) {
      if (!Number.isFinite(value)) throw new TypeError('El volumen debe ser un número.');
      volume = Math.min(1, Math.max(0, value));
      updateGain();
    },
    setMuted(value) {
      muted = Boolean(value);
      updateGain();
    },
    get enabled() { return !disposed && !muted && volume > 0; },
    get contextState() { return context?.state ?? 'uninitialized'; },
    async dispose() {
      if (disposed) return;
      disposed = true;
      for (const voice of [...sounding]) releaseVoice(voice, true);
      master?.disconnect();
      limiter?.disconnect();
      if (context && context.state !== 'closed') await context.close();
    },
  };
}
