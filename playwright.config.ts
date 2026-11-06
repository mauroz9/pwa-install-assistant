import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against the demo, in real Chromium. Phones are emulated
 * (viewport, touch, User-Agent); `beforeinstallprompt` is simulated by the
 * tests, because no browser fires it for a page served by Playwright.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:5299",
  },
  webServer: {
    command: "npm run build && npm --prefix demo run dev -- --port 5299 --strictPort",
    url: "http://localhost:5299",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
