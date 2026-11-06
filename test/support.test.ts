import { describe, expect, it } from "vitest";
import { GUIDE_KEYS } from "../src/core/detect";
import { assistantKind, DEFAULT_SUPPORT, isAssistantEnabled } from "../src/core/support";

describe("support table", () => {
  it("only verified cases are on: Chrome Android (emulator) and Safari 26 on iPhone and iPad (iOS 26.3 simulator)", () => {
    const on = Object.entries(DEFAULT_SUPPORT)
      .filter(([, entry]) => entry.assistant)
      .map(([key]) => key)
      .sort();
    expect(on).toEqual(["android-chrome", "ipad-safari-26", "iphone-safari-26"]);
  });

  it("every key is a guide that exists", () => {
    for (const key of Object.keys(DEFAULT_SUPPORT)) expect(GUIDE_KEYS).toContain(key);
  });

  it("Safari 26 is on for 26.x only: 27 falls back to the guide until measured", () => {
    for (const key of ["iphone-safari-26", "ipad-safari-26"] as const) {
      expect(isAssistantEnabled(key, { iosVersion: 26 })).toBe(true);
      expect(isAssistantEnabled(key, { iosVersion: 26.3 })).toBe(true);
      expect(isAssistantEnabled(key, { iosVersion: 27 })).toBe(false);
      // Picked by hand on another device: no version to check.
      expect(isAssistantEnabled(key, { iosVersion: null })).toBe(true);
    }
  });

  it("implemented but off (not verified): Safari 18 and older, other Chromium browsers on Android", () => {
    for (const key of [
      "iphone-safari",
      "ipad-safari",
      "android-edge",
      "android-samsung",
      "android-opera",
      "android-brave",
    ] as const) {
      expect(assistantKind(key)).not.toBeNull();
      expect(isAssistantEnabled(key)).toBe(false);
      expect(isAssistantEnabled(key, { force: true })).toBe(true);
    }
  });

  it("no assisted flow at all, not even forced: Firefox, other browsers, iOS non-Safari, in-app, desktop", () => {
    for (const key of [
      "android-firefox",
      "android-other",
      "ios-chrome",
      "ios-edge",
      "ios-firefox",
      "ios-other",
      "in-app",
      "desktop",
      null,
    ] as const) {
      expect(assistantKind(key)).toBeNull();
      expect(isAssistantEnabled(key, { force: true })).toBe(false);
    }
  });

  it("the app can turn cases on or off, with a boolean or an entry", () => {
    expect(isAssistantEnabled("android-samsung", { support: { "android-samsung": true } })).toBe(true);
    expect(isAssistantEnabled("android-chrome", { support: { "android-chrome": false } })).toBe(false);
    expect(
      isAssistantEnabled("iphone-safari-26", {
        support: { "iphone-safari-26": { assistant: true, ios: [26, 28] } },
        iosVersion: 27,
      }),
    ).toBe(true);
  });
});
