# pwa-install-assistant: notes for agents

Read **`docs/SPEC.md`** before doing anything: it holds the goal, the full behaviour, the API and the acceptance criteria. Look up the facts and positions already proven in **`docs/REFERENCE.md`**; that file points to the reference implementation in `mauroz9/planabc-front`.

- **Structure:** follow the model of `mauroz9/reel-gallery`. It uses a framework-agnostic core with thin wrappers, `tsup`, `vitest` and Playwright, a demo on GitHub Pages, `README.md` plus `README.es.md`, and examples in `examples/`. Look it up with `gh` before you design anything.
- **No guessing:** nothing from browsers, positions or events is made up. Whatever is not verified in a simulator, an emulator or on a real device stays **turned off** in the support table and falls back to the static guide.
- **Privacy and CSP:**
  - Zero network calls and zero runtime dependencies, except an optional QR generator that must itself have no dependencies.
  - No inline styles or scripts that a CSP with a nonce would block. A `nonce` option covers any `<style>` that gets injected.
- **Workflow:**
  - One task is one issue, one branch and one PR (`Closes #n`).
  - Tests and CI must be green.
  - The repository owner merges.
  - Do not publish to npm without permission.
