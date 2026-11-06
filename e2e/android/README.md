# Real Chrome on the Android emulator

`run.mjs` boots an AVD, opens the demo in Chrome (`adb reverse` makes `localhost` a secure context), reads the page
over the Chrome DevTools Protocol and taps like a person with `adb shell input`, finding Chrome's own buttons and
the page's with `uiautomator`. Nothing is injected into the page: `beforeinstallprompt`, the native dialog,
`userChoice` and `appinstalled` are Chrome's own.

```bash
npm run build && npm run build -w demo
npx vite preview demo --port 4173 --strictPort &
AVD=t78pixel node e2e/android/run.mjs        # results and screenshots in e2e/android/out/
```

Use an AVD with 3 GB of RAM (with 2 GB Chrome may die after a cancelled install) and a Google Play image.
On a first visit Chrome only fires `beforeinstallprompt` after some engagement; the script scrolls the page while
it waits (up to 4 minutes).
