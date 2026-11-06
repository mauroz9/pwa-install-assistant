import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import { encodeQr, qrPath, type Ecc } from "../src/qr/encode";

/** Rasterises the modules (with a quiet zone) and reads them back with jsQR. */
function decode(modules: boolean[][], scale = 4): string | null {
  const quiet = 4;
  const n = modules.length + quiet * 2;
  const w = n * scale;
  const rgba = new Uint8ClampedArray(w * w * 4).fill(255);
  modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (!dark) return;
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + quiet) * scale + dy) * w + (x + quiet) * scale + dx) * 4;
          rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
        }
    }),
  );
  return jsQR(rgba, w, w)?.data ?? null;
}

describe("QR encoder", () => {
  const samples = [
    "https://planabc.quobit.es/",
    "https://example.com/install?utm_source=desktop&x=1",
    "https://ñandú.example/café — ✓",
    `https://example.com/${"a".repeat(140)}`,
    `https://example.com/${"long/path/".repeat(60)}`,
  ];

  it.each(samples)("round-trips with ECC M: %s", (text) => {
    expect(decode(encodeQr(text, "M"))).toBe(text);
  });

  it.each(["L", "Q", "H"] as Ecc[])("round-trips with ECC %s", (ecc) => {
    for (const text of samples.slice(0, 4)) expect(decode(encodeQr(text, ecc))).toBe(text);
  });

  it("uses the smallest version: a short URL fits in version 2 (25×25)", () => {
    expect(encodeQr("https://planabc.quobit.es/").length).toBe(25);
  });

  it("size grows with the text and is always 4·version + 17", () => {
    for (const text of samples) expect((encodeQr(text).length - 17) % 4).toBe(0);
  });

  it("a single path with the quiet zone", () => {
    const { size, d } = qrPath("https://a.example/");
    expect(size).toBe(encodeQr("https://a.example/").length + 8);
    expect(d.startsWith("M4 4h7")).toBe(true);
  });

  it("refuses text that cannot fit", () => {
    expect(() => encodeQr("x".repeat(3000), "H")).toThrow(RangeError);
  });
});
