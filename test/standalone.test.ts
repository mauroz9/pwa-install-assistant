import { describe, expect, it } from "vitest";
import { detectStandalone } from "../src/core/standalone";

const media = (modes: string[]) => (query: string) => ({ matches: modes.some((m) => query.includes(m)) });

describe("detectStandalone", () => {
  it("iOS: navigator.standalone", () => {
    expect(detectStandalone({ navigatorStandalone: true })).toBe(true);
    expect(detectStandalone({ navigatorStandalone: false })).toBe(false);
  });

  it("display-mode from the manifest: standalone, minimal-ui, window-controls-overlay", () => {
    expect(detectStandalone({ matchMedia: media(["standalone"]) })).toBe(true);
    expect(detectStandalone({ matchMedia: media(["minimal-ui"]) })).toBe(true);
    expect(detectStandalone({ matchMedia: media(["window-controls-overlay"]) })).toBe(true);
  });

  it("never fullscreen: a normal browser in full screen matches it too", () => {
    expect(detectStandalone({ matchMedia: media(["fullscreen"]) })).toBe(false);
  });

  it("Trusted Web Activity: android-app:// referrer", () => {
    expect(detectStandalone({ referrer: "android-app://com.example.app/" })).toBe(true);
    expect(detectStandalone({ referrer: "https://example.com/" })).toBe(false);
  });

  it("nothing known: not installed", () => {
    expect(detectStandalone({})).toBe(false);
  });
});
