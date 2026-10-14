# Marshall Letter Studio

Una identidad tipográfica convertida en instrumento: ocho letras sólidas doradas, una caja de nogal y una cámara fija. Proyecto académico sin afiliación con Marshall.

## Uso

Ejecuta `npm install` si faltan las dependencias y después `npm run dev`. Abre la dirección local que indique Vite. `npm run build` genera dist; `npm run preview` sirve esa compilación. `npm test` comprueba el sintetizador.

Pulsa directamente los trazos dorados de cada letra, los ocho botones o las teclas A S D F G H J K. Cada posición tiene una nota diferente: C4, D4, E4, G4, A4, C5, D5 y E5. Las dos a y las dos l también suenan distinto. Ajusta Volumen o Silenciar. El navegador activa Web Audio en la primera interacción; no hay reproducción automática ni canción descargada.

## Diseño

Marshall produce equipos de audio para músicos y amantes de la música. La pieza explora su carácter musical y la amplificación del gesto: una pequeña pulsación produce una nota y una respuesta física breve en el metal. Está planteada como portada web o pantalla táctil en un evento. Se descubren relaciones entre letra, altura musical, secuencia y acorde.

El dibujo caligráfico es propio e inspirado en la referencia facilitada. Los trazos son mallas tubulares sólidas con reflejos, volumen, sombras y extremos redondeados. Cada letra se detecta con raycasting. La madera es procedural y local. La cámara conserva su orientación: no hay órbita ni rotación automática. La pulsación desplaza brevemente cada letra y respeta la preferencia de movimiento reducido.

## Arquitectura nueva

- src/lettering.js: ocho grupos de trazos vectoriales.
- src/renderer.js: escena Three.js, nogal, oro, luces, cámara fija, selección y respuesta de las letras.
- src/audio/instrument.js: sintetizador Web Audio con ocho alturas, envolvente, armónicos, volumen, compresor y límite de polifonía.
- src/ui/instrumentPanel.js: teclado accesible, volumen, silencio y explicación.
- src/main.js: coordinación de eventos, teclado, sonido, renderizado y cambios de tamaño.
- src/styles.css e index.html: estructura adaptable.

Se retiran los antiguos módulos simulation, heyBackdrop y labPanel y sus pruebas: este proyecto ya no utiliza partículas. No necesita fuentes, texturas o sonidos descargados en tiempo de ejecución.

Referencias: https://www.marshall.com/ch/en/about-marshall · https://pleaseenjoy.com/word-as-image/ · https://playables.net/
