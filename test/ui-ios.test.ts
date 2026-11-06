// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMedia } from "./fixtures/media";
import { UA } from "./fixtures/user-agents";

type Lib = typeof import("../src/index");
let lib: Lib;
let host: HTMLElement;
let restoreMedia = () => {};

beforeEach(async () => {
  restoreMedia = stubMedia();
  vi.resetModules();
  localStorage.clear();
  document.body.replaceChildren();
  host = document.createElement("div");
  document.body.append(host);
  lib = await import("../src/index");
});
afterEach(() => {
  restoreMedia();
  vi.useRealTimers();
});

const mount = (userAgent: string, options: Parameters<Lib["createInstallAssistant"]>[1] = {}) =>
  lib.createInstallAssistant(host, {
    appName: "Acme",
    locale: "en",
    env: { userAgent, maxTouchPoints: /iPad|Macintosh/.test(userAgent) ? 5 : 0 },
    ...options,
  });
const buttonByText = (label: string, root: ParentNode = host) =>
  Array.from(root.querySelectorAll("button")).find((b) => b.textContent?.trim() === label);
const arrow = () => document.querySelector<HTMLElement>(".pia-arrow");
const hint = () => document.querySelector<HTMLElement>(".pia-hint");

describe("iOS arrow assistant", () => {
  it("iPhone 26: asks for the bar first; Start is disabled until answered", () => {
    mount(UA.iphoneSafari26);
    expect(host.textContent).toContain("What does your Safari bar look like?");
    expect(host.querySelectorAll("input[type=radio]")).toHaveLength(3);
    expect(buttonByText("Start")!.disabled).toBe(true);
    expect(host.textContent).toContain("First tell us what your Safari bar looks like.");
  });

  it("Compact: the arrow points at «•••», 58 pt from the right, and the hint lists the three steps", () => {
    mount(UA.iphoneSafari26);
    const compact = host.querySelector<HTMLInputElement>("input[value=compact]")!;
    compact.click();
    compact.dispatchEvent(new Event("change"));
    expect(localStorage.getItem("pwa-install.safari-bar")).toBe("compact");
    buttonByText("Start")!.click();
    expect(arrow()?.dataset.button).toBe("more");
    expect(arrow()?.classList.contains("pia-arrow-bottom")).toBe(true);
    expect(arrow()?.style.getPropertyValue("--pia-right")).toBe("36px");
    const items = Array.from(hint()!.querySelectorAll("li"));
    expect(items).toHaveLength(3);
    expect(items[0].dataset.state).toBe("now");
    expect(items[0].textContent).toContain("Tap “•••”, bottom right, and then “Share”.");
    expect(items[1].textContent).toContain("“Add to Home Screen”");
    expect(items[2].textContent).toContain("Leave “Open as Web App” on");
    expect(buttonByText("Hide the arrow")).toBeTruthy();
    // No «Next» anywhere: tapping the page would close the Share sheet.
    expect(buttonByText("Next")).toBeUndefined();
  });

  it("closing the hint hides the arrow too", () => {
    localStorage.setItem("pwa-install.safari-bar", "bottom");
    mount(UA.iphoneSafari26);
    buttonByText("Start")!.click();
    expect(arrow()?.dataset.button).toBe("share");
    expect(arrow()?.style.getPropertyValue("--pia-left")).toBe("calc(50% - 22px)");
    hint()!.querySelector<HTMLButtonElement>(".pia-hint-close")!.click();
    expect(arrow()).toBeNull();
    expect(hint()).toBeNull();
  });

  it("iPad: no question, arrow at the top 120 pt from the right, hint on the left", () => {
    mount(UA.macLike26);
    expect(host.querySelector("input[type=radio]")).toBeNull();
    buttonByText("Start")!.click();
    expect(arrow()?.classList.contains("pia-arrow-top")).toBe(true);
    expect(arrow()?.style.getPropertyValue("--pia-right")).toBe("98px");
    expect(hint()?.classList.contains("pia-hint-left")).toBe(true);
    expect(hint()?.style.getPropertyValue("--pia-hint-right")).toBe("150px");
    expect(hint()?.textContent).toContain("top right, next to the address");
  });

  it("iPhone in landscape: no arrow, only the hint", () => {
    restoreMedia();
    restoreMedia = stubMedia("landscape");
    mount(UA.iphoneSafari26);
    buttonByText("Start")!.click();
    expect(arrow()).toBeNull();
    expect(hint()?.textContent).toContain("Tap Safari's Share button");
  });

  it("the preview loops through every scene; reduced motion stops it and hides «pause»", () => {
    vi.useFakeTimers();
    mount(UA.iphoneSafari26);
    const counter = () => host.querySelector(".pia-preview .pia-eyebrow")!.textContent;
    expect(counter()).toBe("Step 1 of 5");
    vi.advanceTimersByTime(lib.SCENE_MS);
    expect(counter()).toBe("Step 2 of 5");
    vi.advanceTimersByTime(lib.SCENE_MS * 4);
    expect(counter()).toBe("Step 1 of 5");
    host.querySelector<HTMLButtonElement>("[aria-label='Pause the animation']")!.click();
    vi.advanceTimersByTime(lib.SCENE_MS * 3);
    expect(counter()).toBe("Step 1 of 5");

    host.replaceChildren();
    restoreMedia();
    restoreMedia = stubMedia("reduce");
    mount(UA.iphoneSafari26);
    vi.advanceTimersByTime(lib.SCENE_MS * 3);
    expect(host.querySelector(".pia-preview .pia-eyebrow")!.textContent).toBe("Step 1 of 5");
    expect(host.querySelector("[aria-label='Pause the animation']")).toBeNull();
  });

  it("Safari 18 stays on the illustrated guide (not verified); debug turns the assistant on, with the event log", () => {
    mount(UA.iphoneSafari18);
    expect(host.querySelector(".pia-preview")).toBeNull();
    expect(host.querySelector(".pia-h3")?.textContent).toBe("Tap the Share button");
    host.replaceChildren();
    const assistant = mount(UA.iphoneSafari18, { debug: true });
    expect(host.querySelector(".pia-preview")).not.toBeNull();
    window.dispatchEvent(new Event("blur"));
    expect(host.querySelector(".pia-diag")?.textContent).toContain("blur");
    assistant.destroy();
  });

  it("in a sheet, «Start» closes it without counting as a dismissal", () => {
    localStorage.setItem("pwa-install.safari-bar", "top");
    const assistant = mount(UA.iphoneSafari26, { mode: "sheet" });
    assistant.open();
    buttonByText("Start", document)!.click();
    expect(assistant.isOpen).toBe(false);
    expect(assistant.controller.isDismissed()).toBe(false);
    expect(arrow()).not.toBeNull();
    assistant.destroy();
    expect(arrow()).toBeNull();
  });

  it("Spanish hint", () => {
    localStorage.setItem("pwa-install.safari-bar", "compact");
    mount(UA.iphoneSafari26, { locale: "es" });
    buttonByText("Empezar")!.click();
    expect(hint()?.textContent).toContain("Toca «•••», abajo a la derecha, y después «Compartir».");
    expect(hint()?.textContent).toContain("Elige «Añadir a pantalla de inicio». Si no la ves, toca «Ver más».");
  });
});
