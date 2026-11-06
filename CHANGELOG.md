# Changelog

All notable changes to this project. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-11-06

First release.

### Added

- Detection of device, browser, iOS version (including the iOS 26 frozen UA and iPadOS posing as a Mac) and in-app
  browsers, from capabilities first and the User-Agent and Client Hints second; tested against 67 real User-Agents.
- Headless core (`pwa-install-assistant/headless`): support table of verified cases, arrow positions measured on the
  iOS 26.3 simulator, the Android prompt state machine, pluggable storage and `createInstallController()`.
- Vanilla UI (`createInstallAssistant`) with `inline`, `modal` and `sheet` modes; illustrated step-by-step guides for
  15 browser cases; Android assistant driven by `beforeinstallprompt` / `userChoice` / `appinstalled`; iOS assistant
  with a looping preview, the Safari toolbar question, an arrow on the real button and a pinned hint; in-app browser
  escape («Open in Safari/Chrome», «Copy link»); desktop QR code from a dependency-free encoder
  (`pwa-install-assistant/qr`, loaded on demand); «already installed».
- Languages: English and Spanish built in; Portuguese, French, German and Italian as separate entries.
- Theming (`theme`, `--pia-*` variables, dark and auto schemes), arrow and illustration options, opening triggers and
  frequency, `onEvent` for your own analytics, `debug` event log.
- Wrappers: React (and Next.js), Vue 3, Svelte, Solid, Web Component; Angular standalone wrapper in the examples.
- Examples: Next, Nuxt, SvelteKit, Astro, Remix (React Router), Solid, Angular and plain HTML.
- Real-browser harnesses: `e2e/ios` (XCUITest driving Safari on the simulator) and `e2e/android` (emulator, adb, CDP),
  with results in `docs/support.md`.

[0.1.0]: https://github.com/mauroz9/pwa-install-assistant/releases/tag/v0.1.0
