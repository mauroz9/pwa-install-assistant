/**
 * The assistant's stylesheet. Injected once per document as a `<style>` with
 * the `nonce` option (strict CSP), or shipped as `pwa-install-assistant/style.css`
 * for `injectStyles: false`. Everything is themable with `--pia-*` variables.
 * Motion only under `prefers-reduced-motion: no-preference`.
 */
export const CSS = /* css */ `
.pia {
  --pia-accent: #1546d1;
  --pia-accent-ink: #0f379f;
  --pia-accent-soft: #eaf0ff;
  --pia-accent-line: #b9c9f5;
  --pia-on-accent: #ffffff;
  --pia-success: #22c07f;
  --pia-success-soft: #e7f8ef;
  --pia-success-ink: #0b5e3b;
  --pia-fg: #172030;
  --pia-muted: #46536a;
  --pia-faint: #8390a6;
  --pia-bg: #ffffff;
  --pia-canvas: #f4f6fb;
  --pia-hush: #eef1f7;
  --pia-line: #dfe5ef;
  --pia-line-strong: #c4cddc;
  --pia-device: #172030;
  --pia-radius: 14px;
  --pia-font: inherit;
  --pia-shadow: 0 18px 40px -18px rgba(23, 32, 48, 0.45);
  --pia-arrow-size: 44px;
  --pia-arrow-color: var(--pia-accent);
  --pia-z: 2147483000;
  box-sizing: border-box;
  color: var(--pia-fg);
  font-family: var(--pia-font);
  font-size: 16px;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
}
.pia[data-scheme="dark"] {
  --pia-accent: #8fb0ff;
  --pia-accent-ink: #b8ccff;
  --pia-accent-soft: #1b2850;
  --pia-accent-line: #34508f;
  --pia-on-accent: #0b1430;
  --pia-success: #43d495;
  --pia-success-soft: #0f3324;
  --pia-success-ink: #a4efc9;
  --pia-fg: #eef1f7;
  --pia-muted: #b4bed0;
  --pia-faint: #7d889e;
  --pia-bg: #121826;
  --pia-canvas: #1a2233;
  --pia-hush: #222c40;
  --pia-line: #2c374d;
  --pia-line-strong: #3d4a63;
  --pia-device: #05070c;
  --pia-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.8);
}
@media (prefers-color-scheme: dark) {
  .pia[data-scheme="auto"] {
    --pia-accent: #8fb0ff;
    --pia-accent-ink: #b8ccff;
    --pia-accent-soft: #1b2850;
    --pia-accent-line: #34508f;
    --pia-on-accent: #0b1430;
    --pia-success: #43d495;
    --pia-success-soft: #0f3324;
    --pia-success-ink: #a4efc9;
    --pia-fg: #eef1f7;
    --pia-muted: #b4bed0;
    --pia-faint: #7d889e;
    --pia-bg: #121826;
    --pia-canvas: #1a2233;
    --pia-hush: #222c40;
    --pia-line: #2c374d;
    --pia-line-strong: #3d4a63;
    --pia-device: #05070c;
    --pia-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.8);
  }
}
.pia *, .pia *::before, .pia *::after { box-sizing: border-box; }
.pia [hidden] { display: none !important; }
.pia :focus-visible { outline: 3px solid var(--pia-accent); outline-offset: 2px; }
.pia-sr {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.pia-stack { display: flex; flex-direction: column; gap: 1.5rem; }
.pia-stack-sm { display: flex; flex-direction: column; gap: 0.75rem; }
.pia-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.pia-card {
  border: 1px solid var(--pia-line); border-radius: calc(var(--pia-radius) + 4px);
  background: var(--pia-bg); padding: 1.25rem;
}
@media (min-width: 640px) { .pia-card { padding: 1.75rem; } }
.pia-card-accent { border-color: var(--pia-accent-line); }
.pia-h2 { margin: 0; font-size: 1.5rem; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; }
.pia-h3 { margin: 0; font-size: 1.5rem; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; outline: none; }
@media (min-width: 768px) { .pia-h3 { font-size: 1.75rem; } }
.pia-h4 { margin: 0; font-size: 1.15rem; font-weight: 800; }
.pia-p { margin: 0; color: var(--pia-muted); }
.pia-lead { margin: 0; color: var(--pia-muted); font-size: 1.1rem; }
.pia-small { font-size: 0.875rem; }
.pia-eyebrow {
  margin: 0; color: var(--pia-accent); font: 700 0.75rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.14em; text-transform: uppercase;
}
.pia-icon { width: 1.25em; height: 1.25em; flex-shrink: 0; }
.pia-icon-xs { width: 0.7em; height: 0.7em; }
.pia-icon-xl { width: 3rem; height: 3rem; }

/* Buttons */
.pia-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  min-height: 48px; padding: 0 1.25rem; border: 1.5px solid var(--pia-accent); border-radius: var(--pia-radius);
  background: var(--pia-accent); color: var(--pia-on-accent); font: inherit; font-weight: 800;
  text-decoration: none; cursor: pointer; transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
.pia-btn:hover { background: var(--pia-accent-ink); border-color: var(--pia-accent-ink); }
.pia-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pia-btn-secondary { background: var(--pia-bg); color: var(--pia-accent-ink); border-color: var(--pia-line-strong); }
.pia-btn-secondary:hover { background: var(--pia-accent-soft); border-color: var(--pia-accent); }
.pia-btn-sm { min-height: 40px; padding: 0 0.9rem; font-size: 0.9rem; }
.pia-link {
  padding: 0; border: 0; background: none; color: var(--pia-accent-ink); font: inherit; font-weight: 700;
  text-decoration: underline; text-underline-offset: 4px; cursor: pointer;
}
.pia-icon-btn {
  display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0;
  border: 1px solid var(--pia-line); border-radius: 12px; background: var(--pia-bg);
  color: var(--pia-accent-ink); font: inherit; font-size: 1.25rem; font-weight: 800; cursor: pointer;
}
.pia-icon-btn:hover { border-color: var(--pia-accent); }

/* Step chips */
.pia-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.pia-chip {
  display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px;
  border: 1.5px dashed var(--pia-line-strong); background: transparent; color: var(--pia-faint);
  font: inherit; font-size: 1.1rem; font-weight: 800; line-height: 1; cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}
button.pia-chip:hover { border-color: var(--pia-accent); color: var(--pia-accent); }
.pia-chip-sm { width: 36px; height: 36px; font-size: 1rem; cursor: default; }
.pia-chip-xs { width: 24px; height: 24px; border-radius: 8px; font-size: 0.75rem; cursor: default; }
.pia-chip[data-state="done"] { border: 0; background: var(--pia-success); color: #08321f; }
.pia-chip[data-state="now"] { border: 0; background: var(--pia-accent); color: var(--pia-on-accent); }
.pia-chip .pia-icon { width: 1.1em; height: 1.1em; }

/* Guide stepper */
.pia-step { display: grid; align-items: start; gap: 1.5rem 3rem; }
@media (min-width: 768px) {
  .pia-step { grid-template-columns: auto 1fr; grid-template-rows: auto 1fr; }
  .pia-step-text { grid-column: 2; grid-row: 1; padding-top: 1.5rem; }
  .pia-step-figure { grid-column: 1; grid-row: 1 / span 2; }
  .pia-step-controls { grid-column: 2; grid-row: 2; }
}
.pia-step-text, .pia-step-controls { display: flex; flex-direction: column; gap: 0.75rem; }
.pia-step-text .pia-p { font-size: 1.1rem; }
.pia-details { border: 1px solid var(--pia-line); border-radius: var(--pia-radius); background: var(--pia-bg); }
.pia-details > summary {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; font-weight: 700;
  cursor: pointer; list-style: none;
}
.pia-details > summary::-webkit-details-marker { display: none; }
.pia-details > summary .pia-icon { color: var(--pia-accent); }
.pia-details-body {
  display: flex; flex-direction: column; gap: 0.75rem; padding: 0.75rem 1rem;
  border-top: 1px solid var(--pia-line); color: var(--pia-muted);
}
.pia-list { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding-left: 1.25rem; }
.pia-list b { color: var(--pia-fg); }
.pia-notice {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 1rem; border: 1px solid var(--pia-success); border-radius: var(--pia-radius);
  background: var(--pia-success-soft); color: var(--pia-success-ink);
}
.pia-notice p { margin: 0; }
.pia-select {
  width: 100%; max-width: 28rem; min-height: 48px; padding: 0 0.75rem;
  border: 1.5px solid var(--pia-line-strong); border-radius: var(--pia-radius);
  background: var(--pia-bg); color: var(--pia-fg); font: inherit; font-weight: 700;
}
.pia-label { font-size: 1.1rem; font-weight: 800; }

/* Illustrations */
.pia-scene, .pia-scene-art { display: flex; justify-content: center; }
.pia-frame {
  position: relative; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
  border: 7px solid var(--pia-device); border-radius: 34px; background: var(--pia-bg);
  box-shadow: var(--pia-shadow); font-size: 10.5px; line-height: 1.35; color: var(--pia-fg);
}
.pia-frame-phone { width: min(200px, 54vw); aspect-ratio: 9 / 19; }
.pia-frame-tablet { width: min(330px, 82vw); aspect-ratio: 3 / 4; border-width: 8px; border-radius: 26px; }
.pia-status {
  display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; height: 24px; padding: 0 16px;
  font: 700 9px ui-monospace, SFMono-Regular, Menlo, monospace;
}
.pia-island { width: 56px; height: 14px; border-radius: 999px; background: var(--pia-device); }
.pia-signal { letter-spacing: -0.1em; }
.pia-bar {
  display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 2px;
  padding: 6px 4px; background: var(--pia-hush); border-color: var(--pia-line); border-style: solid; border-width: 0;
}
.pia-bar-top { border-bottom-width: 1px; }
.pia-bar-bottom { border-top-width: 1px; padding-bottom: 12px; }
.pia-bar-button {
  display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0; border-radius: 8px;
  color: var(--pia-accent); opacity: 0.7;
}
.pia-bar-button .pia-icon { width: 16px; height: 16px; }
.pia-bar-button-on { opacity: 1; color: var(--pia-accent-ink); }
.pia-url {
  display: flex; flex: 1; min-width: 0; align-items: center; justify-content: center; gap: 4px; height: 28px;
  padding: 0 8px; border-radius: 999px; background: var(--pia-bg); color: var(--pia-muted); font-size: 9.5px;
}
.pia-url-host { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pia-page {
  position: relative; display: flex; flex: 1; min-height: 0; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; padding: 0 16px; background: var(--pia-canvas);
}
.pia-page-icon { width: 44px; height: 44px; }
.pia-line { display: block; width: 66%; height: 6px; border-radius: 999px; background: var(--pia-line-strong); }
.pia-line-strong { width: 75%; height: 8px; background: var(--pia-fg); opacity: 0.8; }
.pia-line-short { width: 50%; }
.pia-page-button { display: block; width: 50%; height: 20px; margin-top: 4px; border-radius: 6px; background: var(--pia-accent); }
.pia-dim { position: absolute; inset: 0; background: rgba(23, 32, 48, 0.45); }
.pia-app-icon {
  display: grid; place-items: center; flex-shrink: 0; border-radius: 22%; object-fit: cover;
  box-shadow: 0 1px 3px rgba(23, 32, 48, 0.2);
}
.pia-app-icon-letter { background: var(--pia-accent); color: var(--pia-on-accent); font-weight: 800; font-size: 1.4em; }
.pia-icon-sm { width: 28px; height: 28px; }
.pia-icon-md { width: 40px; height: 40px; }
.pia-icon-lg { width: 72px; height: 72px; font-size: 2rem; }
.pia-sheet-panel {
  position: absolute; padding: 6px; background: var(--pia-bg); box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.45);
}
.pia-anchor-bottom { left: 0; right: 0; bottom: 0; border-radius: 16px 16px 0 0; padding-bottom: 16px; }
.pia-anchor-top-right { right: 8px; top: 32px; width: 78%; border-radius: 12px; }
.pia-anchor-bottom-right { right: 8px; bottom: 12px; width: 78%; border-radius: 12px; }
.pia-anchor-bottom-center { left: 9%; bottom: 12px; width: 82%; border-radius: 12px; }
.pia-sheet-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px; padding: 4px 8px 8px;
  border-bottom: 1px solid var(--pia-line);
}
.pia-sheet-app, .pia-confirm-name { display: flex; min-width: 0; flex-direction: column; }
.pia-sheet-app span, .pia-confirm-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--pia-muted); font-size: 0.85em; }
.pia-sheet-title { margin: 0; padding: 4px 8px 6px; font-weight: 800; }
.pia-sheet-items { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.pia-sheet-item { padding: 6px 8px; border-bottom: 1px solid var(--pia-line); color: var(--pia-muted); }
.pia-sheet-item:last-child { border-bottom: 0; }
.pia-sheet-item-on { margin: 2px 0; }
.pia-sheet-target { display: flex; padding: 6px 32px 6px 8px; border-radius: 6px; font-weight: 800; }
.pia-confirm-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 8px;
  border-bottom: 1px solid var(--pia-line); white-space: nowrap; font-size: 10px;
}
.pia-confirm-bar .pia-link { font-weight: 400; text-decoration: none; }
.pia-confirm-add { padding: 2px 6px; border-radius: 6px; font-weight: 800; }
.pia-confirm-body { display: flex; flex: 1; flex-direction: column; gap: 12px; padding: 12px; background: var(--pia-canvas); }
.pia-card-mini { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; background: var(--pia-bg); }
.pia-toggle-row { justify-content: space-between; box-shadow: 0 0 0 2px var(--pia-success); }
.pia-toggle { display: flex; justify-content: flex-end; width: 28px; height: 16px; padding: 2px; border-radius: 999px; background: var(--pia-success); }
.pia-toggle span { width: 12px; height: 12px; border-radius: 50%; background: #fff; }
.pia-confirm-note { margin: 0; padding: 0 4px; color: var(--pia-muted); font-size: 10px; }
.pia-android-dialog {
  position: absolute; left: 12px; right: 12px; top: 50%; transform: translateY(-50%);
  padding: 12px; border-radius: 16px; background: var(--pia-bg); box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.45);
}
.pia-android-dialog-title { margin: 0; font-size: 13px; font-weight: 800; }
.pia-android-dialog-app { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.pia-android-dialog-actions {
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; color: var(--pia-accent); font-weight: 800;
}
.pia-android-dialog-actions > span:first-child { padding: 2px 6px; }
.pia-android-dialog-action { padding: 2px 6px; border-radius: 6px; }
.pia-home {
  display: flex; flex: 1; flex-direction: column; padding: 16px 12px 0;
  background: linear-gradient(to bottom, var(--pia-accent-soft), var(--pia-canvas));
}
.pia-home-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px 8px; }
.pia-home-grid-tablet { grid-template-columns: repeat(5, 1fr); }
.pia-home-app { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pia-home-tile { display: block; width: 100%; aspect-ratio: 1; border-radius: 22%; background: rgba(255, 255, 255, 0.7); }
.pia-home-name { display: block; width: 75%; height: 4px; border-radius: 999px; background: rgba(255, 255, 255, 0.8); }
.pia-home-target { display: block; width: 100%; border-radius: 22%; }
.pia-home-icon { width: 100%; height: auto; aspect-ratio: 1; font-size: 1.3em; }
.pia-home-label { overflow: hidden; max-width: 100%; text-overflow: ellipsis; white-space: nowrap; font-size: 8.5px; }
.pia-dock { display: block; width: 90%; height: 48px; margin: auto auto 12px; border-radius: 16px; background: rgba(255, 255, 255, 0.5); }
.pia-minimal { display: grid; place-items: center; min-width: 200px; min-height: 160px; padding: 2rem; }
.pia-minimal-target { display: grid; place-items: center; min-width: 96px; min-height: 64px; padding: 0.75rem 1.25rem; border-radius: 16px; font-size: 1.25rem; font-weight: 800; }

/* The thing to tap */
.pia-target {
  position: relative; z-index: 1; background: var(--pia-accent-soft); color: var(--pia-accent-ink);
  box-shadow: 0 0 0 2px var(--pia-accent);
}
.pia-target-pulse { position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 0 0 2px var(--pia-accent-line); pointer-events: none; }
.pia-target-arrow { position: absolute; z-index: 2; display: block; color: var(--pia-accent); pointer-events: none; filter: drop-shadow(0 0 2px #fff); }
.pia-target-arrow .pia-icon { display: block; width: 24px; height: 24px; stroke-width: 3; }
.pia-target-arrow-up { top: 100%; left: 50%; margin-left: -12px; padding-top: 2px; }
.pia-target-arrow-down { bottom: 100%; left: 50%; margin-left: -12px; padding-bottom: 2px; }
.pia-target-arrow-left { right: 4px; top: 50%; margin-top: -12px; }

/* Android prompt assistant */
.pia-prompt-grid { display: grid; align-items: center; gap: 1.5rem; }
@media (min-width: 768px) { .pia-prompt-grid { grid-template-columns: 1fr auto; } }
.pia-prompt-steps { display: flex; flex-direction: column; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
.pia-prompt-steps li { display: flex; align-items: flex-start; gap: 0.75rem; }
.pia-prompt-steps li > span:last-child { display: flex; flex-direction: column; }
.pia-prompt-steps li[data-state="todo"] b { color: var(--pia-muted); }
.pia-prompt-steps li > span:last-child > span { color: var(--pia-muted); }
.pia-prompt-action { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.pia-prompt-pointer { color: var(--pia-accent); filter: drop-shadow(0 0 2px #fff); }
.pia-prompt-pointer .pia-icon { display: block; width: 36px; height: 36px; stroke-width: 3; }
.pia-btn-glow { box-shadow: 0 0 0 4px var(--pia-accent-soft); }
.pia-busy { display: flex; align-items: center; gap: 0.5rem; color: var(--pia-accent-ink); font-weight: 700; }
.pia-busy-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--pia-accent); }
.pia-celebrate { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.pia-celebrate .pia-app-icon { width: 72px; height: 72px; font-size: 2rem; }

/* iOS assistant */
.pia-ios-grid { display: grid; align-items: start; gap: 1.5rem 3rem; }
@media (min-width: 768px) { .pia-ios-grid { grid-template-columns: auto 1fr; } .pia-ios-side { padding-top: 1rem; } }
.pia-ios-side { display: flex; flex-direction: column; gap: 1.25rem; }
.pia-preview { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin: 0; }
.pia-preview figcaption { display: flex; max-width: 260px; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center; }
.pia-preview-controls { display: flex; align-items: center; gap: 0.5rem; }
.pia-bars {
  display: flex; flex-direction: column; gap: 0.75rem; margin: 0; padding: 1rem;
  border: 1px solid var(--pia-accent-line); border-radius: var(--pia-radius); background: var(--pia-accent-soft);
}
.pia-bars legend { float: left; width: 100%; margin-bottom: 0.25rem; padding: 0; font-weight: 800; }
.pia-bars legend + p { clear: both; }
.pia-bars-options { display: flex; gap: 0.5rem; }
.pia-bar-option {
  display: flex; flex: 1; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.5rem;
  border: 2px solid var(--pia-line); border-radius: 12px; background: var(--pia-bg); font-weight: 800; cursor: pointer;
}
.pia-bar-option:has(input:checked) { border-color: var(--pia-accent); color: var(--pia-accent-ink); }
.pia-bar-option:has(input:focus-visible) { outline: 3px solid var(--pia-accent); outline-offset: 2px; }
.pia-bar-option input { position: absolute; opacity: 0; pointer-events: none; }
.pia-mini {
  display: flex; flex-direction: column; overflow: hidden; width: 48px; height: 96px;
  border: 3px solid var(--pia-device); border-radius: 10px; background: var(--pia-canvas);
}
.pia-mini-gap { height: 8px; flex-shrink: 0; }
.pia-mini-gap-b { height: 4px; flex-shrink: 0; }
.pia-mini-body { display: flex; flex: 1; flex-direction: column; gap: 4px; padding: 6px 6px 0; }
.pia-mini-body span { height: 4px; border-radius: 999px; background: var(--pia-line-strong); }
.pia-mini-body span + span { width: 75%; }
.pia-mini-url-row { display: flex; align-items: center; gap: 2px; margin: 4px; }
.pia-mini-url { flex: 1; height: 10px; border-radius: 999px; background: var(--pia-accent-line); }
.pia-mini-more { width: 10px; height: 10px; flex-shrink: 0; border-radius: 50%; background: var(--pia-accent); }
.pia-mini-buttons { display: flex; justify-content: space-around; margin: 0 4px 4px; }
.pia-mini-buttons span { width: 6px; height: 6px; border-radius: 50%; background: var(--pia-line-strong); }
.pia-mini-buttons span:nth-child(2) { background: var(--pia-accent); }

/* Fixed overlays: the arrow at Safari's real button, and the pinned hint */
.pia-overlay { position: fixed; z-index: var(--pia-z); }
.pia-arrow {
  position: fixed; z-index: var(--pia-z); width: var(--pia-arrow-size); height: var(--pia-arrow-size);
  pointer-events: none; left: var(--pia-left, auto); right: var(--pia-right, auto); top: var(--pia-top, auto); bottom: var(--pia-bottom, auto);
}
.pia-arrow-body {
  display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; background: var(--pia-bg);
  color: var(--pia-arrow-color); box-shadow: 0 4px 12px rgba(23, 32, 48, 0.35), 0 0 0 2px var(--pia-arrow-color);
}
.pia-arrow-body .pia-icon { width: 64%; height: 64%; stroke-width: 3.2; }
.pia-hint {
  position: fixed; z-index: var(--pia-z); top: 0; left: 0; right: var(--pia-hint-right, 0);
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 0; pointer-events: none;
}
.pia-hint-card {
  display: flex; align-items: flex-start; gap: 0.75rem; max-width: 36rem; margin: 0 auto; padding: 0.75rem;
  border: 1px solid var(--pia-accent-line); border-radius: 16px; background: var(--pia-bg);
  box-shadow: 0 12px 30px -12px rgba(23, 32, 48, 0.45); pointer-events: auto;
}
.pia-hint-left .pia-hint-card { max-width: 24rem; margin: 0; }
.pia-hint-steps { display: flex; flex: 1; flex-direction: column; gap: 0.4rem; margin: 0; padding: 0; list-style: none; font-size: 15px; line-height: 1.35; }
.pia-hint-steps li { display: flex; align-items: flex-start; gap: 0.5rem; color: var(--pia-muted); }
.pia-hint-steps li[data-state="now"] { color: var(--pia-fg); font-weight: 700; }
.pia-hint-close {
  display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border: 0; border-radius: 10px;
  background: transparent; color: var(--pia-muted); cursor: pointer;
}
.pia-hint-close:hover { background: var(--pia-hush); }

/* In-app, desktop */
.pia-qr-grid { display: grid; align-items: center; gap: 2rem; }
@media (min-width: 768px) { .pia-qr-grid { grid-template-columns: auto 1fr; gap: 3rem; } }
.pia-qr { margin: 0 auto; padding: 12px; border: 1px solid var(--pia-line); border-radius: 16px; background: #fff; }
.pia-qr svg { display: block; width: 208px; height: 208px; }
.pia-url-text { margin: 0; color: var(--pia-muted); font: 0.875rem ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
.pia-copy-input {
  width: 100%; max-width: 28rem; min-height: 44px; padding: 0 0.75rem; border: 1px solid var(--pia-line-strong);
  border-radius: 10px; background: var(--pia-bg); color: var(--pia-fg); font: 0.9rem ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Diagnostics */
.pia-diag { border: 2px dashed #b7791f; border-radius: var(--pia-radius); background: #fffaf0; color: #3d2a06; padding: 1rem; }
.pia-diag ol { max-height: 18rem; overflow-y: auto; margin: 0; padding: 0.5rem; border-radius: 8px; background: #fff; list-style: none; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
.pia-diag li { padding: 0.25rem 0; border-bottom: 1px solid #f0e2c4; }

/* Modal and bottom sheet */
.pia-dialog {
  width: min(56rem, calc(100vw - 32px)); max-height: calc(100dvh - 32px); margin: auto; padding: 0;
  border: 0; border-radius: calc(var(--pia-radius) + 8px); background: var(--pia-bg); color: var(--pia-fg);
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.55); overflow: auto;
}
.pia-dialog::backdrop { background: rgba(10, 14, 24, 0.55); }
.pia-dialog-sheet {
  width: 100%; max-width: 48rem; max-height: min(88dvh, calc(100dvh - 24px)); margin: auto auto 0;
  border-radius: calc(var(--pia-radius) + 10px) calc(var(--pia-radius) + 10px) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pia-dialog-head {
  position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--pia-line); background: var(--pia-bg);
}
.pia-dialog-body { padding: 1.25rem; }
@media (min-width: 640px) { .pia-dialog-body { padding: 1.75rem; } }
.pia-grabber { display: block; width: 40px; height: 5px; margin: 8px auto 0; border-radius: 999px; background: var(--pia-line-strong); }

@media (prefers-reduced-motion: no-preference) {
  .pia-target-pulse { animation: pia-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }
  .pia-target-arrow-up > .pia-icon, .pia-arrow-top .pia-arrow-body { animation: pia-nudge-up 1.1s ease-in-out infinite; }
  .pia-target-arrow-down > .pia-icon, .pia-prompt-pointer > .pia-icon, .pia-arrow-bottom .pia-arrow-body { animation: pia-nudge-down 1.1s ease-in-out infinite; }
  .pia-target-arrow-left > .pia-icon { animation: pia-nudge-left 1.1s ease-in-out infinite; }
  .pia-busy-dot { animation: pia-ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; }
  .pia-scene-in { animation: pia-scene-in 0.45s ease-out both; }
  .pia-pop { animation: pia-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .pia-dialog[open] { animation: pia-fade-in 0.2s ease-out both; }
  .pia-dialog-sheet[open] { animation: pia-sheet-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
}
@keyframes pia-ping { 0% { transform: scale(1); opacity: 0.9; } 80%, 100% { transform: scale(1.35); opacity: 0; } }
@keyframes pia-nudge-up { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes pia-nudge-down { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
@keyframes pia-nudge-left { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-6px); } }
@keyframes pia-scene-in { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes pia-pop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: none; } }
@keyframes pia-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes pia-sheet-in { from { transform: translateY(100%); } to { transform: none; } }
`;

const STYLE_ID = "pia-styles";

/**
 * Adds the stylesheet to `doc` once. Pass the page's CSP `nonce` so a policy
 * without `'unsafe-inline'` accepts it.
 */
export function injectStyles(doc: Document = document, nonce?: string): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  if (nonce) {
    style.nonce = nonce;
    style.setAttribute("nonce", nonce);
  }
  style.textContent = CSS;
  (doc.head ?? doc.documentElement).appendChild(style);
}
