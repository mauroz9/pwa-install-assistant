// Release notes for a version, from CHANGELOG.md: a summary, the changes and how to update.
// usage: node scripts/release-notes.mjs [version]   (default: package.json's)
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = (process.argv[2] ?? pkg.version).replace(/^v/, "");
const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

const start = changelog.search(new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m"));
if (start < 0) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
const rest = changelog.slice(start).split("\n").slice(1).join("\n");
const end = rest.search(/^## \[|^\[[^\]]+\]: /m);
const section = (end < 0 ? rest : rest.slice(0, end)).trim();
const [summary, ...changes] = section.split(/\n(?=### )/);

console.log(`## Summary

${summary.trim() || `pwa-install-assistant ${version}.`}

## Changes

${changes.join("\n").trim() || "See CHANGELOG.md."}

## How to update

\`\`\`bash
npm i pwa-install-assistant@${version}
\`\`\`

Docs: [README](https://github.com/mauroz9/pwa-install-assistant#readme) · [options](https://github.com/mauroz9/pwa-install-assistant/blob/v${version}/docs/options.md) · [support table](https://github.com/mauroz9/pwa-install-assistant/blob/v${version}/docs/support.md) · [demo](https://mauroz9.github.io/pwa-install-assistant/)

Published from GitHub Actions with npm provenance.`);
