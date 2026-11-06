// Size of every public entry as an app would ship it on first load: bundled
// with its static imports, minified, gzipped. Chunks loaded on demand (the QR
// encoder) are reported separately. Frameworks are external (the app has them).
// Fails when an entry goes over its budget.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

/** Budgets in bytes, min+gzip, first load. Entries without a budget are only reported. */
const BUDGETS = {
  // The headless core: detection, support table, positions, state machine, storage.
  headless: 12 * 1024,
  // The full UI with English and Spanish, without the QR encoder (loaded on demand).
  index: 34 * 1024,
  qr: 4 * 1024,
  ...Object.fromEntries(["en", "es", "pt", "fr", "de", "it"].map((code) => [`locales/${code}`, 6 * 1024])),
};

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const external = ["react", "react-dom", "vue", "svelte", "solid-js", "solid-js/web", "@angular/core"];
let failed = false;
const rows = [];

for (const [subpath, target] of Object.entries(pkg.exports)) {
  const file = typeof target === "object" ? target.import : null;
  if (!file || !file.endsWith(".js")) continue;
  const name = subpath === "." ? "index" : subpath.slice(2);
  const result = await build({
    entryPoints: [new URL("../" + file, import.meta.url).pathname],
    bundle: true,
    splitting: true,
    minify: true,
    format: "esm",
    outdir: "/tmp/pia-size",
    write: false,
    metafile: true,
    external,
    logLevel: "silent",
  });
  const outputs = result.metafile.outputs;
  const gz = (path) => {
    const file = result.outputFiles.find((f) => f.path.endsWith(path.replace(/^.*\/tmp\/pia-size/, "")));
    return gzipSync(file.contents, { level: 9 }).length;
  };
  const entry = Object.keys(outputs).find((p) => outputs[p].entryPoint);
  const seen = new Set();
  const lazy = new Set();
  const walk = (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    for (const imp of outputs[path].imports) {
      if (imp.external) continue;
      if (imp.kind === "dynamic-import") lazy.add(imp.path);
      else walk(imp.path);
    }
  };
  walk(entry);
  const bytes = [...seen].reduce((sum, p) => sum + gz(p), 0);
  const lazyBytes = [...lazy].filter((p) => !seen.has(p)).reduce((sum, p) => sum + gz(p), 0);
  const budget = BUDGETS[name];
  const over = budget !== undefined && bytes > budget;
  failed ||= over;
  rows.push({
    entry: name,
    "first load": `${(bytes / 1024).toFixed(2)} kB`,
    "on demand": lazyBytes ? `${(lazyBytes / 1024).toFixed(2)} kB` : "—",
    budget: budget ? `${budget / 1024} kB` : "—",
    ok: over ? "OVER" : "ok",
  });
}

console.table(rows);
if (failed) {
  console.error("An entry is over its size budget.");
  process.exit(1);
}
