# Marshall: la fuerza tiene forma

Sistema tipográfico jugable para una portada web o pantalla interactiva de un evento. Las partículas pertenecen al trazado de las letras; no forman un fondo independiente. La caligrafía es un dibujo vectorial propio inspirado en la referencia aportada, no una fuente oficial.

## Decisiones de diseño

1. Marshall desarrolla amplificadores, altavoces y auriculares para músicos y amantes de la música.
2. El atributo es la potencia expresiva: una acción aporta energía y transforma una palabra reconocible. Se basa en la relación histórica de Marshall con la amplificación.
3. La pieza se plantea como portada web o instalación interactiva; Presentar oculta controles.
4. Arrastrar aplica fuerza local; clic o Q genera un pulso; mantener W/Cargar comprime y soltar libera energía. V introduce oscilación; Espacio aumenta esa oscilación; E ralentiza. Shift al arrastrar repele. Los botones admiten ratón, táctil, Enter y Espacio.
5. La persona descubre que la intensidad cambia la forma y que esta recupera su identidad: resortes amortiguados devuelven cada partícula a su lugar. Tensión amplifica la respuesta, Vínculo refuerza el retorno y Memoria prolonga la resonancia.

Clean, Crunch, Drive y Sustain ofrecen cuatro respuestas. B pausa, R reinicia, P/H alternan presentación, F solicita pantalla completa. Se respeta la preferencia de movimiento reducido.

## Ejecución

Desde la carpeta del proyecto: `npm run dev`. Para producción: `npm run build`; para comprobarla: `npm run preview`. Pruebas: `npm test`.

## Informe de agentes y revisión

- Agente de simulación: createSimulation.js, flowField.js, gestures.js, parameters.js y pruebas. Resortes, impulsos, campos de dirección y oscilación; estabilidad y regreso a la forma.
- Agente de representación: heyBackdrop.js y renderer.js. Trazado cursivo local, muestreo determinista de letras, cámara ortográfica y partículas doradas.
- Agente de interfaz: labPanel.js, styles.css e index.html. Controles, adaptación móvil y diálogo con las cinco consideraciones.
- Integración: main.js, eliminación de player.js y not-ok.mp3, conexión de objetivos tipográficos y controles. Correcciones de calidad: Memoria afecta a la amortiguación visible, Tensión afecta al arrastre y vibración, color de shader convertido a espacio de pantalla, gesto táctil sin desplazamiento de página.

Validación: build de producción correcto; 12 pruebas aprobadas; revisión visual de escritorio (1280 × 720) y móvil (390 × 844); comprobación de presets, presentación y diálogo. Sin errores en la consola del navegador durante la revisión. Vite avisa de un paquete de ~541 kB, principalmente Three.js. La vista previa integrada mostró una frecuencia reducida; no se certifica una tasa de cuadros estable en el equipo del usuario.

No hay reproducción de audio ni archivo de canción en public o dist. Los documentos antiguos sobre el proyecto musical se conservan como antecedentes; esta guía describe la versión actual.

## Referencias

- [Marshall](https://www.marshall.com/ch/en/about-marshall)
- [Word as Image, Ji Lee](https://pleaseenjoy.com/word-as-image/)
- [Playables](https://playables.net/)

Exploración académica sin afiliación con Marshall.
