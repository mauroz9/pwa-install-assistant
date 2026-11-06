import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "examples/**",
      "demo/dist/**",
      "e2e/ios/build/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Privacy and CSP: nothing evaluates strings, nothing parses HTML.
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Build nodes with h(): innerHTML breaks Trusted Types." },
        { property: "outerHTML", message: "Build nodes with h()." },
        { property: "insertAdjacentHTML", message: "Build nodes with h()." },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "The library makes no network calls." },
        { name: "XMLHttpRequest", message: "The library makes no network calls." },
        { name: "WebSocket", message: "The library makes no network calls." },
        { name: "EventSource", message: "The library makes no network calls." },
      ],
    },
  },
);
