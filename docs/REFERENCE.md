# Referencia: el instalador de PlanABC

La implementación de referencia vive en **`mauroz9/planabc-front`** (privado; el agente lo lee con `gh`), PR **#73** (Task 78) sobre la base de la Task 65 (#46). Es el comportamiento que hay que reproducir, generalizado y sin nada propio de PlanABC.

## Ficheros a estudiar

| Qué | Fichero |
|---|---|
| Detección de dispositivo, navegador, versión de iOS, navegadores integrados (UA + Client Hints, iPadOS que se presenta como Mac) con tests de 40+ User-Agents reales | `src/lib/install/detect.ts`, `detect.test.ts` |
| Guías estáticas por caso (pasos e ilustraciones) | `src/lib/install/guides.ts`, `src/components/install/Scene.tsx`, `GuideStepper.tsx` |
| Asistente: interruptor por caso (`ARROW_ENABLED`), tabla de posiciones de la flecha (`ARROW_SPOTS`), máquina de estados de Android (`nextPhase`, `promptStatus`, `LAUNCHER_CONFIRM_HINT`), señal de la hoja de iOS (`IOS_SHEET_SIGNAL`) | `src/lib/install/assistant.ts`, `assistant.test.ts` |
| Flujo automático de Android (`beforeinstallprompt`, `userChoice`, `appinstalled`) | `src/components/install/PromptAssistant.tsx`, `install-store.ts` |
| Flujo de iOS (animación previa, pregunta de la barra de Safari, flecha, pista fija) | `src/components/install/IosAssistant.tsx` |
| Página de diagnóstico de eventos (`?diagnostico=1`) | `src/components/install/SheetDiagnostics.tsx` |
| QR local para escritorio | `src/lib/install/qr.ts` (librería `uqr`) |
| «Ya instalada» (`display-mode`, `navigator.standalone`, `getInstalledRelatedApps`, marca local) | `src/lib/pwa/pwa.ts`, `install-store.ts`, `storage.ts` |
| Resultados medidos en simulador/emulador y lista de comprobación | `docs/pwa.md` (secciones «Asistente con flecha», «Resultados en el simulador de iOS 26.3», «Resultados en el emulador de Android») |
| Arnés de pruebas iOS (XcodeGen + XCUITest que maneja Safari) | carpeta local `tiamat/work/ios-uitest/` del jefe de proyecto (recrearlo en `e2e/ios/` de este repo) |

## Hechos verificados (2026-11-05)

### iOS / iPadOS 26.3 (simulador, Safari)
- **No hay API de instalación** ni evento fiable al abrir o cerrar la hoja de Compartir (`blur`, `visibilitychange`, `pagehide` y `visualViewport` no se disparan al abrirla). Solo el diálogo «Añadir a pantalla de inicio» dispara `blur` (y `visualViewport.resize` por el teclado). ⇒ En iOS el asistente **no puede avanzar solo** durante la instalación; muestra todos los pasos y una pista fija.
- **Diseños de la barra** (Ajustes › Apps › Safari › Pestañas): «Compacta» (por defecto: «•••» a ~58 pt del borde derecho, abajo, y luego «Compartir»), «Abajo» y «Arriba» (sin «•••»: «Compartir» en el centro de la barra inferior). No se puede leer desde la página ⇒ se pregunta una vez con dibujos y se recuerda.
- **iPad**: «Compartir» a ~120 pt del borde derecho, arriba, en vertical y horizontal; la hoja sale como globo a la derecha (la pista va a la izquierda).
- La hoja de Compartir abre a media altura: una **pista fija arriba** se lee; «Ver más» (necesario para llegar a «Añadir a pantalla de inicio») la tapa.
- Al hacer scroll, Safari **recoge la barra**: hay que llevar arriba la página o pedir que se toque la dirección.
- «Abrir como app web» viene activado por defecto en iOS 26; si se desactiva queda un marcador, no una app (no detectable).
- En `http://localhost` Safari aplica `upgrade-insecure-requests` de la CSP: probar detrás de un proxy local o con HTTPS.
- El carácter «⋯» no existe en algunas fuentes: usar «•••».
- **Éxito detectable** solo al abrir el icono: `navigator.standalone` / `display-mode: standalone`.

### Android (emulador Pixel 7, Chrome 124)
- `beforeinstallprompt` **no llega al cargar** en la primera visita: llega tras interacción y tiempo en la página (~30 s). Hasta entonces se muestra la guía del menú y el asistente aparece al llegar el evento.
- Cancelar → Chrome vuelve a lanzar el evento: volver al paso 1 («Intentarlo otra vez»).
- Instalar → `appinstalled` → «¡Instalada!». Instalar desde el menú ⋮ también dispara `appinstalled`.
- Sin WebAPK (p. ej. localhost) Chrome crea un acceso directo y el **lanzador pide confirmar después de `appinstalled`**: avisar de que se acepte.
- Con poca RAM (2 GB) Chrome puede cerrarse al cancelar: usar 3 GB en el emulador.
- Sin probar aún: Samsung Internet, Firefox, Edge/Opera/Brave por separado, WebAPK real, `getInstalledRelatedApps`, dispositivo real.

### Investigación de alternativas (2026-11-05)
Ninguna librería cubre todos los dispositivos y avanza sola. Las más cercanas: `@khmyznikov/pwa-install` (muchos idiomas, sin flecha, depende de Lit) y `pwa-add-to-homescreen` de philfung (flecha y guías por versión de iOS, sin avance automático). Usar como referencia de casos y textos, no como dependencia. Seguimiento de la vía «instalación automática» (Web Install API de Chrome, perfiles Web Clip en iOS): `mauroz9/planabc-front#76`.
