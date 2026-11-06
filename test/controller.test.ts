// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InstallEvent } from "../src/core/controller";
import { stubMedia } from "./fixtures/media";
import { fakePromptEvent } from "./fixtures/prompt";
import { UA } from "./fixtures/user-agents";

type Core = typeof import("../src/core/index");
let core: Core;
let restoreMedia = () => {};

beforeEach(async () => {
  // A phone held upright, in a browser tab.
  restoreMedia = stubMedia();
  vi.resetModules();
  localStorage.clear();
  core = await import("../src/core/index");
});
afterEach(() => restoreMedia());

function make(userAgent: string, extra: Parameters<Core["createInstallController"]>[0] = {}) {
  const events: InstallEvent[] = [];
  const controller = core.createInstallController({
    env: { userAgent, maxTouchPoints: /iPad|Macintosh/.test(userAgent) ? 5 : 0 },
    onEvent: (e) => events.push(e),
    ...extra,
  });
  return { controller, events, types: () => events.map((e) => e.type) };
}

describe("createInstallController · views", () => {
  it.each([
    [UA.iphoneSafari26, "ios-arrow", "iphone-safari-26"],
    [UA.iphoneSafari18, "guide", "iphone-safari"],
    [UA.iphoneSafari27Expected, "guide", "iphone-safari-26"],
    [UA.macLike26, "ios-arrow", "ipad-safari-26"],
    [UA.iosChrome, "guide", "ios-chrome"],
    [UA.iosChromeOld, "open-safari", "ios-open-safari"],
    [UA.androidChrome, "guide", "android-chrome"],
    [UA.instagramAndroid, "in-app", "in-app"],
    [UA.windowsChrome, "desktop", "desktop"],
    ["", "unknown", null],
  ])("%s → %s", (userAgent, view, guide) => {
    const { controller, events } = make(userAgent);
    expect(controller.getState().view).toBe(view);
    expect(controller.getState().guide).toBe(guide);
    expect(events[0]).toMatchObject({ type: "detected", guide });
  });

  it("standalone wins over everything, and is reported", () => {
    restoreMedia();
    restoreMedia = stubMedia("standalone");
    const { controller, types } = make(UA.androidChrome);
    expect(controller.getState().view).toBe("standalone");
    expect(types()).toContain("opened-standalone");
  });

  it("installed mark shows «installed» until the person asks for the guide again", () => {
    const { controller, types } = make(UA.androidChrome);
    controller.markInstalled();
    expect(controller.getState().view).toBe("installed");
    expect(types()).toContain("installed");
    controller.markInstalled(false);
    expect(controller.getState().view).toBe("guide");
  });

  it("picking another guide, and back", () => {
    const { controller, types } = make(UA.windowsChrome);
    controller.pick("android-samsung");
    expect(controller.getState()).toMatchObject({ view: "guide", guide: "android-samsung", picked: true });
    controller.pick("iphone-safari-26");
    expect(controller.getState().view).toBe("ios-arrow");
    controller.pick(null);
    expect(controller.getState()).toMatchObject({ view: "desktop", picked: false });
    expect(types().filter((t) => t === "guide-picked")).toHaveLength(3);
  });

  it("force (debug) turns implemented flows on", () => {
    expect(make(UA.iphoneSafari18).controller.getState().view).toBe("guide");
    expect(make(UA.iphoneSafari18, { force: true }).controller.getState().view).toBe("ios-arrow");
  });
});

describe("createInstallController · Android prompt", () => {
  it("no event yet: menu guide only; when it arrives: the assistant", () => {
    const { controller, types } = make(UA.androidChrome);
    expect(controller.getState().prompt).toBeNull();
    window.dispatchEvent(fakePromptEvent());
    expect(controller.getState()).toMatchObject({ prompt: "assistant", canPrompt: true, phase: "ready" });
    expect(types()).toContain("prompt-available");
  });

  it("verified browsers get the assistant; the others a plain button", () => {
    window.dispatchEvent(fakePromptEvent());
    expect(make(UA.androidChrome).controller.getState().prompt).toBe("assistant");
    expect(make(UA.samsung).controller.getState().prompt).toBe("button");
    expect(make(UA.androidFirefox).controller.getState().prompt).toBeNull();
    // Not on desktop or iOS, even if the event fires.
    expect(make(UA.windowsChrome).controller.getState().prompt).toBeNull();
  });

  it("accept → installing → appinstalled → installed, all by itself", async () => {
    const { controller, types } = make(UA.androidChrome);
    window.dispatchEvent(fakePromptEvent("accepted"));
    const seen: string[] = [];
    controller.subscribe((s) => seen.push(s.phase));
    await expect(controller.prompt()).resolves.toBe("accepted");
    expect(controller.getState()).toMatchObject({ phase: "accepted", promptFinishing: true, prompt: "assistant" });
    expect(seen).toEqual(["prompting", "prompting", "accepted"]);
    window.dispatchEvent(new Event("appinstalled"));
    expect(controller.getState()).toMatchObject({ phase: "installed", installed: true, view: "guide" });
    expect(types()).toEqual(expect.arrayContaining(["prompt", "accepted", "installed"]));
  });

  it("dismiss → back to step 1 → the browser offers it again → retry", async () => {
    const { controller, types } = make(UA.androidChrome);
    window.dispatchEvent(fakePromptEvent("dismissed"));
    await controller.prompt();
    expect(controller.getState()).toMatchObject({ phase: "dismissed", canPrompt: false, prompt: "assistant" });
    window.dispatchEvent(fakePromptEvent("accepted"));
    expect(controller.getState().canPrompt).toBe(true);
    await controller.prompt();
    expect(controller.getState().phase).toBe("accepted");
    expect(types().filter((t) => t === "prompt")).toHaveLength(2);
  });

  it("without a dialog, prompt() is unavailable and changes nothing", async () => {
    const { controller } = make(UA.androidChrome);
    await expect(controller.prompt()).resolves.toBe("unavailable");
    expect(controller.getState().phase).toBe("ready");
  });
});

describe("createInstallController · iOS arrow", () => {
  it("iPhone 26: asks the toolbar layout first, then places the arrow, remembered", () => {
    const { controller, types } = make(UA.iphoneSafari26);
    expect(controller.getState().ios).toMatchObject({ needsBar: true, bar: null, spot: null, active: false });
    controller.setSafariBar("compact");
    expect(controller.getState().ios?.spot).toEqual({ edge: "bottom", x: { fromRight: 58 }, button: "more" });
    expect(make(UA.iphoneSafari26).controller.getState().ios?.bar).toBe("compact");
    controller.setArrow(true);
    expect(controller.getState()).toMatchObject({ guideSeen: true, ios: { active: true, sheetOpen: false } });
    controller.setArrow(false);
    expect(types()).toEqual(expect.arrayContaining(["bar-chosen", "arrow-start", "arrow-stop"]));
  });

  it("iPhone in landscape: no question and no arrow, text only", () => {
    restoreMedia();
    restoreMedia = stubMedia("landscape");
    const { controller } = make(UA.iphoneSafari26);
    expect(controller.getState().ios).toMatchObject({ orientation: "landscape", needsBar: false, spot: null });
  });

  it("iPad 26: no question, arrow at the top right", () => {
    const { controller } = make(UA.macLike26);
    expect(controller.getState().ios).toMatchObject({ device: "ipad", needsBar: false });
    expect(controller.getState().ios?.spot).toEqual({ edge: "top", x: { fromRight: 120 }, button: "share" });
  });

  it("a configured sheet signal (blur) marks the sheet open; none by default", () => {
    const { controller } = make(UA.macLike26, { sheetSignal: "blur" });
    controller.setArrow(true);
    const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(false);
    window.dispatchEvent(new Event("blur"));
    expect(controller.getState().ios?.sheetOpen).toBe(true);
    hasFocus.mockReturnValue(true);
    window.dispatchEvent(new Event("focus"));
    expect(controller.getState().ios?.sheetOpen).toBe(false);
    hasFocus.mockRestore();
  });
});

describe("createInstallController · misc", () => {
  it("dismissal is remembered, with an optional expiry", () => {
    const { controller } = make(UA.androidChrome);
    expect(controller.isDismissed()).toBe(false);
    controller.dismiss();
    expect(controller.isDismissed()).toBe(true);
    expect(controller.isDismissed(7)).toBe(true);
    expect(controller.isDismissed(0)).toBe(false);
  });

  it("on() filters by type; a throwing onEvent does not break anything; destroy stops everything", () => {
    const controller = core.createInstallController({
      env: { userAgent: UA.androidChrome },
      onEvent: () => {
        throw new Error("analytics down");
      },
    });
    const picked = vi.fn();
    const all = vi.fn();
    controller.on("guide-picked", picked);
    controller.on("*", all);
    controller.pick("android-edge");
    controller.markGuideSeen();
    expect(picked).toHaveBeenCalledOnce();
    expect(all).toHaveBeenCalledOnce();
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.destroy();
    window.dispatchEvent(fakePromptEvent());
    controller.pick(null);
    expect(listener).not.toHaveBeenCalled();
  });

  it("works on a server-like input without throwing", () => {
    expect(() => core.createInstallController({ device: core.detectDevice({ userAgent: "" }) })).not.toThrow();
  });
});
