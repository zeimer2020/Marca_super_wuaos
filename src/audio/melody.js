// An original pentatonic phrase uses every letter and repeats with a short rest.
export const MELODY = [[0,1],[2,1],[3,1],[4,1],[5,2],[3,1],[2,1],[1,1],[3,1],[4,1],[6,1],[7,2],[5,1],[4,1],[2,1],[1,1],[0,3]];
export function createMelody({ play, silence, onChange = () => {}, onError = () => {}, schedule = setTimeout, cancel = clearTimeout }) {
  let running = false, generation = 0, timer;
  function stop() {
    running = false; generation++; cancel(timer); timer = undefined;
    silence(); onChange(false);
  }
  async function step(position, token) {
    if (!running || token !== generation) return;
    const [index, beats] = MELODY[position];
    try {
      await play(index, () => running && token === generation);
      if (running && token === generation) timer = schedule(() => { void step((position + 1) % MELODY.length, token); }, beats * 360);
    } catch (error) { if (token === generation) { stop(); onError(error); } }
  }
  return {
    start() { if (running) return; running = true; const token = ++generation; onChange(true); void step(0, token); },
    stop,
    get running() { return running; },
  };
}
