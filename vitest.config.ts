import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

// e2e/ is Playwright's; vitest only runs the unit tests.
export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
  // Solid's package resolves to its server build under Node; the directive runs in a browser.
  resolve: { alias: [{ find: /^solid-js$/, replacement: "solid-js/dist/solid.js" }] },
  test: { include: ["test/**/*.test.ts", "test/**/*.test.tsx"] },
});
