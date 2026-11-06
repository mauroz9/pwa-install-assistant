import { describe, expect, it } from "vitest";
import {
  ARROW_SPOTS,
  arrowPosition,
  arrowSpot,
  DEFAULT_SHEET_SIGNAL,
  iosCase,
  needsBarQuestion,
  type IosDevice,
  type IosGen,
  type Orientation,
} from "../src/core/spots";

describe("arrow positions (iOS)", () => {
  const devices: IosDevice[] = ["iphone", "ipad"];
  const gens: IosGen[] = ["legacy", "26"];
  const orientations: Orientation[] = ["portrait", "landscape"];

  it("covers every device, version and orientation, without duplicates", () => {
    for (const device of devices)
      for (const gen of gens)
        for (const orientation of orientations) {
          const rows = ARROW_SPOTS.filter((r) => r.device === device && r.gen === gen && r.orientation === orientation);
          expect(rows.length, `${device} ${gen} ${orientation}`).toBeGreaterThan(0);
          const bars = rows.map((r) => r.bar);
          // Either one row for every layout, or one per layout.
          expect(bars.length === 1 ? bars : [...bars].sort()).toEqual(
            bars.length === 1 ? [null] : ["bottom", "compact", "top"],
          );
        }
  });

  it("only the iOS 26 rows are verified", () => {
    for (const row of ARROW_SPOTS) expect(row.verified).toBe(row.gen === "26");
  });

  it("iPhone with iOS 18: Share bottom centre, with the address at the top or bottom, without asking", () => {
    const q = { device: "iphone", gen: "legacy", orientation: "portrait" } as const;
    expect(needsBarQuestion(q)).toBe(false);
    for (const bar of ["bottom", "top", null] as const) {
      expect(arrowSpot({ ...q, bar })).toEqual({ edge: "bottom", x: { pct: 50 }, button: "share" });
    }
  });

  it("iPhone with iOS 26 (measured): «•••» bottom right with Compact; Share bottom centre with Bottom and Top", () => {
    const q = { device: "iphone", gen: "26", orientation: "portrait" } as const;
    expect(needsBarQuestion(q)).toBe(true);
    expect(arrowSpot({ ...q, bar: null })).toBeNull();
    expect(arrowSpot({ ...q, bar: "compact" })).toEqual({ edge: "bottom", x: { fromRight: 58 }, button: "more" });
    for (const bar of ["bottom", "top"] as const) {
      expect(arrowSpot({ ...q, bar })).toEqual({ edge: "bottom", x: { pct: 50 }, button: "share" });
    }
  });

  it("iPhone in landscape: no arrow, text only", () => {
    for (const gen of gens) {
      expect(arrowSpot({ device: "iphone", gen, orientation: "landscape", bar: "bottom" })).toBeNull();
      expect(needsBarQuestion({ device: "iphone", gen, orientation: "landscape" })).toBe(false);
    }
  });

  it("iPad: Share at the top, 120 pt from the right edge, portrait and landscape, without asking", () => {
    for (const gen of gens)
      for (const orientation of orientations) {
        expect(needsBarQuestion({ device: "ipad", gen, orientation })).toBe(false);
        expect(arrowSpot({ device: "ipad", gen, orientation, bar: null })).toEqual({
          edge: "top",
          x: { fromRight: 120 },
          button: "share",
        });
      }
  });

  it("fixed position: centred on the button, against the edge, with the safe area", () => {
    expect(arrowPosition({ edge: "bottom", x: { pct: 50 }, button: "share" })).toEqual({
      left: "calc(50% - 22px)",
      bottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
    });
    expect(arrowPosition({ edge: "top", x: { fromRight: 118 }, button: "share" })).toEqual({
      right: "96px",
      top: "calc(env(safe-area-inset-top, 0px) + 4px)",
    });
    expect(arrowPosition({ edge: "top", x: { fromRight: 10 }, button: "more" }).right).toBe("0px");
    expect(arrowPosition({ edge: "bottom", x: { fromRight: 58 }, button: "more" }, 60).right).toBe("28px");
  });

  it("device and generation from the guide", () => {
    expect(iosCase("iphone-safari")).toEqual({ device: "iphone", gen: "legacy" });
    expect(iosCase("iphone-safari-26")).toEqual({ device: "iphone", gen: "26" });
    expect(iosCase("ipad-safari-26")).toEqual({ device: "ipad", gen: "26" });
    expect(iosCase("ios-chrome")).toBeNull();
    expect(iosCase(null)).toBeNull();
  });

  it("the iOS hint does not move on until a reliable event is confirmed", () => {
    expect(DEFAULT_SHEET_SIGNAL).toBeNull();
  });
});
