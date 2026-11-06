// What `npm publish` would ship: only dist/, the READMEs, the licence and
// package.json, and every file the `exports` map points to.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  encoding: "utf8",
  env: { ...process.env, npm_config_ignore_scripts: "true" },
});
// Some npm versions still run `prepare` and print the build before the JSON.
const json = out.slice(out.search(/^\[\s*\{/m));
const [info] = JSON.parse(json);
const files = info.files.map((f) => f.path);
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const targets = Object.values(pkg.exports).flatMap((t) => (typeof t === "string" ? [t] : Object.values(t)));
const must = ["package.json", "LICENSE", "README.md", ...targets.map((t) => t.replace(/^\.\//, ""))];
const missing = must.filter((f) => !files.includes(f));
const stray = files.filter((f) => !/^(dist\/|package\.json$|LICENSE$|README(\.es)?\.md$)/.test(f));

if (missing.length || stray.length) {
  console.error({ missing, stray });
  process.exit(1);
}
console.log(`${files.length} files, ${info.size} bytes packed, ${info.unpackedSize} bytes unpacked`);
