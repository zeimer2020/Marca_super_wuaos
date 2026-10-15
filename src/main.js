import './styles.css';
import { createStage } from './renderer.js';
import { createInstrument, NOTES } from './audio/instrument.js';
import { createMelody } from './audio/melody.js';
const mount = document.querySelector('#stage');
const instrument = createInstrument();
let stage, frameId, lastFrame = 0;
const lever = document.createElement('button');
lever.type = 'button'; lever.className = 'melody-lever';
lever.setAttribute('aria-label', 'Activar melodía automática');
lever.setAttribute('aria-pressed', 'false');
lever.title = 'Bajar: melodía automática · Subir: detener';
lever.innerHTML = '<span class="lever-light" aria-hidden="true"></span><span class="lever-slot" aria-hidden="true"><span class="lever-arm"></span></span><span class="lever-label" aria-hidden="true">AUTO</span>';
document.body.append(lever);
const melody = createMelody({
  async play(index, isCurrent) {
    const sounded = await instrument.play(index, { isCurrent });
    if (sounded && isCurrent()) stage?.strike(index);
  },
  silence: () => instrument.stopAll(),
  onChange(active) {
    lever.classList.toggle('engaged', active);
    lever.setAttribute('aria-pressed', String(active));
    lever.setAttribute('aria-label', active ? 'Detener melodía automática' : 'Activar melodía automática');
  },
  onError(error) { console.error(error); lever.title = 'No se pudo activar el audio. Pulsa de nuevo para reintentar.'; },
});
const toggleMelody = () => melody.running ? melody.stop() : melody.start();
lever.addEventListener('click', toggleMelody);
async function play(index) {
  if (!NOTES[index]) return;
  try { if (await instrument.play(index)) stage?.strike(index); }
  catch (error) { console.error('No se pudo activar el sonido', error); }
}
try {
  stage = createStage(mount, { onLetter: play, onHover(index) { mount.dataset.hover = index >= 0 ? String(index) : ''; } });
  mount.dataset.status = 'ready';
} catch (error) {
  console.error(error); mount.dataset.status = 'error';
  mount.innerHTML = '<div class="stage-error">No se pudo abrir el escenario 3D. Activa la aceleración gráfica del navegador.</div>';
}
const keyMap = new Map(NOTES.map((note,index) => [note.key.toUpperCase(), index]));
function onKey(event) {
  if (event.code === 'Escape') { melody.stop(); return; }
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
  const index = keyMap.get(event.key.toUpperCase());
  if (index === undefined) return;
  event.preventDefault(); void play(index);
}
window.addEventListener('keydown', onKey);
const observer = new ResizeObserver(() => stage?.resize()); observer.observe(mount);
function frame(now) {
  const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 1 / 60;
  lastFrame = now; stage?.draw(delta); frameId = requestAnimationFrame(frame);
}
frameId = requestAnimationFrame(frame);
function onVisibility() { lastFrame = 0; if (document.hidden) melody.stop(); }
document.addEventListener('visibilitychange', onVisibility);
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(frameId); observer.disconnect();
  window.removeEventListener('keydown', onKey);
  document.removeEventListener('visibilitychange', onVisibility);
  melody.stop(); lever.removeEventListener('click', toggleMelody); lever.remove();
  stage?.dispose(); instrument.dispose();
});
