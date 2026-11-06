import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

export default defineConfig({
  entry: {
    index: "src/index.ts",
    headless: "src/core/index.ts",
    qr: "src/qr/index.ts",
    react: "src/react/index.tsx",
    vue: "src/vue/index.ts",
    svelte: "src/svelte/index.ts",
    solid: "src/solid/index.ts",
    element: "src/element/index.ts",
    "locales/en": "src/locales/en.ts",
    "locales/es": "src/locales/es.ts",
    "locales/pt": "src/locales/pt.ts",
    "locales/fr": "src/locales/fr.ts",
    "locales/de": "src/locales/de.ts",
    "locales/it": "src/locales/it.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  // Shared chunks: the detection and the state machine are written once,
  // whichever entries an app imports.
  splitting: true,
  treeshake: true,
  clean: true,
  target: "es2020",
  external: ["react", "react-dom", "vue", "svelte", "solid-js"],
  define: { __VERSION__: JSON.stringify(version) },
});
