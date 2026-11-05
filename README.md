<h1 align="center">pwa-install-assistant</h1>

<p align="center"><strong>Get your web app onto the home screen. The assistant points at the exact button on every phone and tablet, and moves on by itself wherever the browser allows.</strong></p>

> **Status: planned.** No code has been written yet. The full spec for the agent who will build it is in [`docs/SPEC.md`](docs/SPEC.md), written in Spanish. The working reference is the `/instalar` installer of PlanABC.

- **Every device.** It covers iPhone, iPad, Android phones and tablets, in-app browsers and desktop. Desktop shows a QR code.
- **An arrow on the real button.** It knows where Share, `•••` or `⋮` sits for each device, OS version and Safari bar layout.
- **Moves on by itself where it can.** On Chromium browsers for Android it goes from offering the install to asking for confirmation to "Installed!" without the user tapping "next". Where the browser offers no signal, it falls back to a clear illustrated guide.
- **Any stack.** A framework-agnostic core with wrappers for React and Next.js, Vue, Svelte, Angular, Solid and a Web Component.
- **Private and strict-CSP friendly.** No network calls and no third parties. It works under a CSP with a nonce.

Planned license: MIT. It will be published on npm, the same way as [reel-gallery](https://github.com/mauroz9/reel-gallery).
