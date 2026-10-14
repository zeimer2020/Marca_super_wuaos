import { PRESETS, PARTICLE_COUNT, normalizeParticleCount } from '../simulation/parameters.js';

export function createLabPanel({ params, callbacks }) {
  const root = document.querySelector('#interface');
  root.innerHTML = `
    <header class="topbar">
      <a class="identity" href="#" aria-label="Marshall, identidad en juego"><strong>Marshall</strong><span>IDENTIDAD EN JUEGO</span></a>
      <nav aria-label="Herramientas"><button id="about-button">La idea <span>↗</span></button><button id="fullscreen-button" title="Pantalla completa (F)" aria-label="Pantalla completa">⛶</button><button id="perform-button" class="perform">Presentar <span>↗</span></button></nav>
    </header>
    <section class="stage-caption" aria-label="Cómo jugar"><span class="eyebrow">01 / POTENCIA EXPRESIVA</span><h1>La fuerza tiene forma.</h1><p>Arrastra las letras o mantén Cargar. Suelta y observa su respuesta.</p></section>
    <div class="stage-side"><span>UNA PALABRA. TU ENERGÍA.</span><span>SIN SONIDO · TODO SE SIENTE</span></div>
    <section class="console" aria-label="Controles del instrumento">
      <div class="console-top"><div class="state"><span class="eyebrow">CARÁCTER</span><strong id="state-name"></strong><span id="state-description"></span></div><span id="gesture-label" role="status">Toca las letras para empezar</span><button id="pause-button" aria-pressed="false">Pausar <kbd>B</kbd></button><button id="reset-button">Reiniciar <kbd>R</kbd></button></div>
      <div class="console-body"><div class="pads" aria-label="Estados de la identidad">${PRESETS.map((p,i) => `<button class="pad" data-preset="${i}" aria-pressed="${i === 0}"><span class="pad-number">0${i+1}</span><span>${p.name}</span><kbd>${i+1}</kbd></button>`).join('')}</div>
      <div class="faders">${[['tension','Tensión','Suave','Intensa'],['bond','Vínculo','Libre','Unido'],['memory','Memoria','Breve','Persistente']].map(([key,label,left,right]) => `<div class="fader"><label for="${key}">${label}<output id="${key}-value"></output></label><input id="${key}" type="range" min="0" max="100" value="${Math.round(params[key]*100)}"><div class="range-extremes"><span>${left}</span><span>${right}</span></div></div>`).join('')}</div></div>
      <div class="console-bottom"><div class="gestures" aria-label="Gestos: mantén pulsado para activar"><button data-gesture="pulse"><kbd>Q</kbd> Pulso</button><button data-gesture="gather" title="Mantén para comprimir; suelta para liberar"><kbd>W</kbd> Cargar</button><button data-gesture="suspend"><kbd>E</kbd> Cámara lenta</button><button data-gesture="vibrate"><kbd>V</kbd> Vibrar</button><button data-gesture="hey"><kbd>Espacio</kbd> Amplificar</button></div><div class="particle-amount"><label for="particle-count">Densidad <output id="particle-count-value"></output></label><input id="particle-count" type="range" min="${PARTICLE_COUNT.min}" max="${PARTICLE_COUNT.max}" step="${PARTICLE_COUNT.step}" value="${PARTICLE_COUNT.initial}"></div></div>
    </section>
    <footer class="page-footer"><span>Exploración académica · Sin afiliación con Marshall</span><div class="readouts"><span id="manual-pulse">Q marca tu pulso</span><span id="stats">Preparando letras…</span></div></footer>
    <div class="stage-tools"><button id="return-button" hidden title="Mostrar controles (P)">Mostrar controles ↗</button></div>
    <dialog id="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><span class="eyebrow">DE LA LETRA AL COMPORTAMIENTO</span><button data-close aria-label="Cerrar información">×</button></div><h2 id="about-title">La identidad se siente<br>cuando la pones en juego.</h2><p class="dialog-intro">Una exploración de la potencia expresiva de Marshall: la energía altera sus letras, pero su carácter vuelve a aparecer.</p><ol class="concepts"><li><h3>Una marca para vivir la música</h3><p>Marshall desarrolla amplificadores, altavoces y auriculares para músicos y amantes de la música.</p></li><li><h3>Potencia con carácter</h3><p>Su vínculo con la amplificación inspira el atributo elegido: una pequeña acción puede provocar una respuesta intensa. El gesto caligráfico toma como referencia su identidad visual.</p></li><li><h3>Una portada que se puede tocar</h3><p>Pensada para una portada web o una pantalla interactiva en un evento. El modo Presentar deja el escenario libre de controles.</p></li><li><h3>Tú aportas la energía</h3><p>Arrastra para desplazar las letras, haz clic para dar un pulso o mantén Cargar y suelta para liberar fuerza. Vibrar introduce oscilación; Cámara lenta ralentiza el movimiento; Amplificar expande el gesto. También puedes usar los atajos indicados o enfocar un botón y mantener Enter.</p></li><li><h3>La fuerza cambia la forma, la memoria la recupera</h3><p>Descubre cómo la tensión aumenta la respuesta, el vínculo mantiene la palabra unida y la memoria deja una huella. Las fuerzas de retorno recuperan la identidad tras cada intervención.</p></li></ol><p class="small-note">Referencias: <a href="https://www.marshall.com/ch/en/about-marshall" target="_blank" rel="noopener noreferrer">Marshall</a>, <a href="https://pleaseenjoy.com/word-as-image/" target="_blank" rel="noopener noreferrer">Word as Image</a> y <a href="https://playables.net/" target="_blank" rel="noopener noreferrer">Playables</a>. Sin reproducción de audio.</p></dialog>`;
  const $ = selector => root.querySelector(selector);
  const dialog = $('#about-dialog');
  $('.identity').onclick = event => event.preventDefault();
  $('#about-button').onclick = () => { callbacks.release(); dialog.showModal(); };
  $('[data-close]').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect=dialog.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) dialog.close(); });
  $('#perform-button').onclick = callbacks.perform;
  $('#return-button').onclick = callbacks.perform;
  $('#fullscreen-button').onclick = callbacks.fullscreen;
  $('#pause-button').onclick = callbacks.pause;
  $('#reset-button').onclick = callbacks.reset;
  root.querySelectorAll('[data-preset]').forEach(button => button.onclick = () => callbacks.preset(Number(button.dataset.preset)));
  for (const key of ['tension','bond','memory']) $(`#${key}`).addEventListener('input',event => { params[key]=Number(event.target.value)/100; refresh(); });
  root.querySelectorAll('[data-gesture]').forEach(button => {
    const start = () => { callbacks.gesture(button.dataset.gesture,true); button.classList.add('held'); };
    const stop = () => { callbacks.gesture(button.dataset.gesture,false); button.classList.remove('held'); };
    button.addEventListener('pointerdown',event => { if(event.button!==0) return; button.setPointerCapture(event.pointerId); start(); });
    for(const name of ['pointerup','pointercancel','lostpointercapture','blur']) button.addEventListener(name,stop);
    button.addEventListener('keydown',event => { if(event.code==='Enter'||event.code==='Space') { event.preventDefault(); event.stopPropagation(); if(!event.repeat) start(); } });
    button.addEventListener('keyup',event => { if(event.code==='Enter'||event.code==='Space') { event.preventDefault(); event.stopPropagation(); stop(); } });
  });
  const particleCount=$('#particle-count'), countValue=$('#particle-count-value');
  particleCount.addEventListener('input',() => { countValue.textContent=normalizeParticleCount(particleCount.value).toLocaleString('es-CO'); });
  particleCount.addEventListener('change',() => callbacks.particleCount(particleCount.value));
  function refresh() {
    $('#state-name').textContent=params.name; $('#state-description').textContent=params.subtitle;
    root.querySelectorAll('[data-preset]').forEach(button => { const selected=Number(button.dataset.preset)===params.preset; button.classList.toggle('selected',selected); button.setAttribute('aria-pressed',String(selected)); });
    for(const key of ['tension','bond','memory']) { const value=Math.round(params[key]*100); $(`#${key}`).value=value; $(`#${key}-value`).textContent=`${value}%`; }
  }
  refresh(); countValue.textContent=PARTICLE_COUNT.initial.toLocaleString('es-CO');
  return {
    refresh,
    get modalOpen() { return dialog.open; },
    setPerformance(value) { root.classList.toggle('performing',value); $('#return-button').hidden=!value; },
    setPaused(value) { $('#pause-button').innerHTML=`${value?'Continuar':'Pausar'} <kbd>B</kbd>`; $('#pause-button').setAttribute('aria-pressed',String(value)); },
    closeDialogs() { if(dialog.open) dialog.close(); },
    setStats(fps,count) { $('#stats').textContent=`${count.toLocaleString('es-CO')} partículas · ${fps} fps`; },
    setParticleCount(value) { particleCount.value=value; countValue.textContent=value.toLocaleString('es-CO'); },
    setGesture(text) { $('#gesture-label').textContent=text; $('#manual-pulse').textContent=params.rhythm.measured?`Tu pulso · ${Math.round(60/params.rhythm.beatSeconds)} / min`:'Q marca tu pulso'; for(const key of ['gather','suspend','vibrate','hey']) $(`[data-gesture=${key}]`).classList.toggle('held',params[key]); },
  };
}


