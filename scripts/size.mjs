// Size of every public entry as an app would ship it: bundled with its
// shared chunks, minified, gzipped. Frameworks are external (the app has them).
// Fails when an entry goes over its budget.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

/** Budgets in bytes, min+gzip. Entries without a budget are only reported. */
const BUDGETS = {
  headless: 12 * 1024,
};

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const external = ["react", "react-dom", "vue", "svelte", "solid-js", "solid-js/web"];
let failed = false;
const rows = [];

for (const [subpath, target] of Object.entries(pkg.exports)) {
  const file = typeof target === "object" ? target.import : null;
  if (!file || !file.endsWith(".js")) continue;
  const name = subpath === "." ? "index" : subpath.slice(2);
  const result = await build({
    entryPoints: [new URL("../" + file, import.meta.url).pathname],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    external,
    logLevel: "silent",
  });
  const bytes = gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
  const budget = BUDGETS[name];
  const over = budget !== undefined && bytes > budget;
  failed ||= over;
  rows.push({
    entry: name,
    "min+gzip": `${(bytes / 1024).toFixed(2)} kB`,
    budget: budget ? `${budget / 1024} kB` : "—",
    ok: over ? "OVER" : "ok",
  });
}

console.table(rows);
if (failed) {
  console.error("An entry is over its size budget.");
  process.exit(1);
}
