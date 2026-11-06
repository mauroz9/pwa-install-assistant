import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "../src/index";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
  dependencies?: Record<string, string>;
  exports: Record<string, unknown>;
};

describe("package", () => {
  it("exposes its version", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("has no runtime dependencies", () => {
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  it("is importable without a DOM (SSR)", async () => {
    // vitest runs in Node here: no window, no document.
    expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
    await expect(import("../src/index")).resolves.toBeTruthy();
  });
});
