// Post-build steps that tsup cannot do by itself:
//  - dist/style.css, from the same string the assistant injects (for
//    `injectStyles: false` setups that prefer a real stylesheet);
//  - a "use client" directive on the React entry, which esbuild drops.
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);

const index = await import(new URL("index.js", dist).href);
if (typeof index.PWA_INSTALL_CSS === "string") {
  await writeFile(new URL("style.css", dist), index.PWA_INSTALL_CSS.trim() + "\n");
}

for (const file of ["react.js", "react.cjs"]) {
  const url = new URL(file, dist);
  if (!existsSync(url)) continue;
  const code = await readFile(url, "utf8");
  if (!code.startsWith('"use client"')) await writeFile(url, `"use client";\n${code}`);
}
