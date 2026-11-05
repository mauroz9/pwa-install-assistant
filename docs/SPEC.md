# Especificación: pwa-install-assistant

Encargo completo para el agente que construya la librería. Lee también `docs/REFERENCE.md` (implementación de referencia y hechos verificados) y `CLAUDE.md` (reglas).

## 1. Objetivo
Componente reutilizable y publicable en npm que guía a cualquier persona para **añadir una web app (PWA) a la pantalla de inicio** en su dispositivo concreto, **idéntico en comportamiento** al instalador `/instalar` de PlanABC (Tasks 65 y 78), pero genérico, configurable y para todos los frameworks.

## 2. Comportamiento
### 2.1 Detección (sin red, en el navegador)
- Capacidades primero (`beforeinstallprompt`, `navigator.standalone`, `display-mode`), luego UA y Client Hints para elegir guía.
- Casos: iPhone / iPad (iPadOS que se presenta como Mac: `maxTouchPoints`), versión de iOS (< 26, 26+, preparado para 27), Safari y navegadores de iOS (Chrome, Edge, Firefox…), Android con Chromium (Chrome, Edge, Samsung Internet, Opera, Brave), Firefox Android, navegadores de fabricante, **navegadores integrados** (Instagram, Facebook, Messenger, TikTok, WhatsApp, Telegram, Gmail, LinkedIn, X…), escritorio, y «ya instalada».
- Tests con una matriz amplia de User-Agents reales (mínimo la de la referencia).

### 2.2 Modos de asistencia (por caso, según tabla de soporte)
1. **Automático (Android Chromium):** botón propio → diálogo nativo (`prompt()`); avanza solo con `userChoice` (aceptar / cancelar → reintentar) y `appinstalled` → «¡Instalada!» + «Abrir». Si `beforeinstallprompt` aún no ha llegado, mostrar la guía del menú y cambiar al asistente cuando llegue. Aviso del lanzador cuando no hay WebAPK.
2. **Flecha guiada (iOS/iPadOS Safari verificados):** animación previa en bucle con la secuencia completa (incl. «•••» y «Ver más» en iOS 26), **flecha animada al botón real** según dispositivo/versión/orientación/diseño de barra (pregunta única con dibujos, recordada), **pista fija arriba** con los pasos siguientes (visible detrás de la hoja), aviso de barra recogida. Sin «Siguiente» en la página (tocarla cierra la hoja). Avance automático solo si alguna vez se verifica una señal fiable (`sheetSignal`, hoy `null`).
3. **Guía ilustrada (resto):** pasos con ilustraciones SVG/CSS del navegador, selector manual «¿Usas otro dispositivo?».
4. **Navegador integrado:** «Abrir en Safari/Chrome» (intent en Android) y «Copiar enlace».
5. **Escritorio:** QR local (sin servicios externos) para abrir la URL en el móvil.
6. **Ya instalada:** detección y «Abrir la app» / mensaje de éxito; evento para la app.
- Cada caso de flecha/automático se **activa solo si está verificado** (tabla `support`), si no cae en la guía.

### 2.3 Accesibilidad y movimiento
WCAG 2.2 AA: instrucciones siempre en texto (la flecha es apoyo), roles y foco correctos, `aria-live` para cambios de paso, contraste, `prefers-reduced-motion` (sin animación, flecha fija).

## 3. API (propuesta; el agente puede mejorarla justificándolo)
### Núcleo (vanilla, sin dependencias)
```ts
import { createInstallAssistant } from "pwa-install-assistant";

const assistant = createInstallAssistant(element, {
  appName: "PlanABC",
  appUrl: "https://planabc.quobit.es/",      // QR y «Copiar enlace»
  icon: "/icons/icon-192.png",
  locale: "es",                               // es, en, pt, fr, de, it… (paquetes de idioma)
  messages: { /* sobrescribir cualquier texto */ },
  theme: { accent: "#1546d1", success: "#22c07f", radius: 14, font: "inherit" }, // o variables CSS
  mode: "inline" | "modal" | "sheet",
  arrow: { size: 44, color: "currentColor", render?: (el) => void },
  steps: { illustrations: "default" | "minimal" | custom },
  support: { /* sobrescribir la tabla de casos activados */ },
  storage: "localStorage" | "none" | customAdapter, // marcas «instalada», «barra de Safari»
  qr: true | false | ((url) => SVGElement),
  nonce: "…",                                 // CSP
  debug: false,                               // panel de diagnóstico de eventos (como ?diagnostico=1)
  onEvent: (e) => {},                         // detected, shown, prompt, accepted, dismissed, installed, opened-standalone…
});
assistant.destroy();
```
- Utilidades exportadas: `detectDevice()`, `isStandalone()`, `canPrompt()`, `whenInstalled()`.
- **Headless**: estado + eventos sin UI, para quien quiera pintar lo suyo.

### Envoltorios
React (y Next.js, SSR-safe), Vue 3, Svelte 5, Angular (standalone), Solid, Web Component `<pwa-install-assistant>`; ejemplos con Astro, Nuxt, SvelteKit, Remix y HTML plano.

## 4. Personalización
Textos e idiomas, colores/tipografía/radios (variables CSS + `theme`), tamaño y dibujo de la flecha, ilustraciones (por defecto, mínimas o propias), modo inline/modal/hoja inferior, qué casos mostrar, momento de aparición (al cargar, tras X segundos, tras gesto, manual), frecuencia (no volver a mostrar si se descartó), y ganchos de eventos para analítica propia (la librería no envía nada).

## 5. Calidad
- TypeScript estricto, ESM + CJS + tipos, sin dependencias en tiempo de ejecución (QR opcional sin dependencias), objetivo < 12 kB min+gzip del núcleo sin QR.
- Tests unitarios (detección, tabla de soporte, máquina de estados, posiciones), E2E con Playwright (escritorio, Android emulado con evento simulado) y **pruebas reales**: simulador iOS (XcodeGen + XCUITest manejando Safari, ver referencia) y emulador Android (adb + CDP). Documentar resultados en `docs/support.md` con fecha y versión.
- CSP estricta sin `unsafe-inline`; sin `eval`; SSR sin tocar el DOM antes de montar.
- Demo pública en GitHub Pages (como reel-gallery) con modo «simular dispositivo».

## 6. Publicación (como reel-gallery)
README en inglés + `README.es.md`, GIF/WEBP de demo, licencia MIT, CHANGELOG, `npm publish --provenance` desde GitHub Actions al etiquetar, GitHub Release con notas. **No publicar sin permiso del propietario.**

## 7. Integración de vuelta en PlanABC
Al terminar, sustituir el instalador propio de `planabc-front` por la librería (issue aparte en ese repo), manteniendo su CSP con nonce, textos y estética.
