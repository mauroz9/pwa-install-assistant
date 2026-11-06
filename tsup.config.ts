import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

export default defineConfig({
  entry: {
    index: "src/index.ts",
    headless: "src/core/index.ts",
    qr: "src/qr/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  // Shared chunks: the detection and the state machine are written once,
  // whichever entries an app imports.
  splitting: true,
  treeshake: true,
  clean: true,
  target: "es2020",
  define: { __VERSION__: JSON.stringify(version) },
});
