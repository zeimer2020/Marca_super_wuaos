import './styles.css';
import { createStage } from './renderer.js';
import { createInstrument, NOTES } from './audio/instrument.js';


const mount = document.querySelector('#stage');
const instrument = createInstrument();
let stage, frameId, lastFrame = 0;

async function play(index) {
  if (!NOTES[index]) return;
  stage?.strike(index);

  try { await instrument.play(index); }
  catch (error) {
    console.error('No se pudo activar el sonido', error);

  }
}

try {
  stage = createStage(mount, {
    onLetter: play,
    onHover(index) {
      mount.dataset.hover = index >= 0 ? String(index) : '';
    },
  });
  mount.dataset.status = 'ready';
} catch (error) {
  console.error(error);
  mount.dataset.status = 'error';
  mount.innerHTML = '<div class="stage-error"><h2>No se pudo abrir el escenario 3D.</h2><p>Activa la aceleración gráfica del navegador.</p></div>';
}
const keyMap = new Map(NOTES.map((note,index) => [note.key.toUpperCase(), index]));
function onKey(event) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
  if (event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
  const index = keyMap.get(event.key.toUpperCase());
  if (index === undefined) return;
  event.preventDefault(); void play(index);
}
window.addEventListener('keydown', onKey);
const observer = new ResizeObserver(() => stage?.resize());
observer.observe(mount);
function frame(now) {
  const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 1 / 60;
  lastFrame = now;
  stage?.draw(delta);
  frameId = requestAnimationFrame(frame);
}
frameId = requestAnimationFrame(frame);
function onVisibility() { lastFrame = 0; }
document.addEventListener('visibilitychange',onVisibility);
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(frameId); observer.disconnect();
  window.removeEventListener('keydown',onKey);
  document.removeEventListener('visibilitychange',onVisibility);
  stage?.dispose(); instrument.dispose();
});

