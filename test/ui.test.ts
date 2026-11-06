// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InstallEvent } from "../src/core/controller";
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
  document.head.replaceChildren();
  document.body.replaceChildren();
  host = document.createElement("div");
  document.body.append(host);
  lib = await import("../src/index");
});
afterEach(() => restoreMedia());

function mount(userAgent: string, options: Parameters<Lib["createInstallAssistant"]>[1] = {}) {
  const events: InstallEvent[] = [];
  const assistant = lib.createInstallAssistant(host, {
    appName: "Acme",
    appUrl: "https://acme.example/app",
    locale: "en",
    env: { userAgent, maxTouchPoints: /iPad|Macintosh/.test(userAgent) ? 5 : 0 },
    onEvent: (e) => events.push(e),
    ...options,
  });
  return { assistant, events };
}

const text = () => host.textContent ?? "";
const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const buttonByText = (label: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll("button")).find((b) => b.textContent?.trim() === label)!;

describe("inline guide", () => {
  it("renders the detected guide with its first step, and reports it", () => {
    const { events } = mount(UA.androidFirefox);
    expect(text()).toContain("Looks like you're using: Android with Firefox.");
    expect(q(".pia-h3").textContent).toBe("Tap the ⋮ menu");
    expect(q("[aria-live=polite]").textContent).toBe("Step 1 of 4");
    expect(events.map((e) => e.type)).toEqual(["detected", "shown"]);
  });

  it("Next/Previous move through the steps, announce them and move the focus to the title", async () => {
    const { events } = mount(UA.androidFirefox);
    buttonByText("Next").click();
    expect(q("[aria-live=polite]").textContent).toBe("Step 2 of 4");
    expect(q(".pia-chip[aria-current=step]").getAttribute("aria-label")).toContain("Step 2:");
    expect(q(".pia-chip[data-state=done]").getAttribute("aria-label")).toContain("(done)");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(document.activeElement).toBe(q(".pia-h3"));
    buttonByText("Previous").click();
    expect(q("[aria-live=polite]").textContent).toBe("Step 1 of 4");
    expect(events.filter((e) => e.type === "step")).toHaveLength(2);
  });

  it("the last step offers «I've added it», which shows the installed card", () => {
    const { assistant } = mount(UA.androidFirefox);
    for (let i = 0; i < 3; i++) buttonByText("Next").click();
    expect(assistant.controller.getState().guideSeen).toBe(true);
    buttonByText("I've added it").click();
    expect(text()).toContain("Acme is on your home screen");
    expect(q<HTMLAnchorElement>("a.pia-btn").href).toBe("https://acme.example/app");
    buttonByText("Show the guide again").click();
    expect(q(".pia-h3").textContent).toBe("Tap the ⋮ menu");
  });

  it("the illustration is one image with the step's description", () => {
    mount(UA.androidChrome);
    const scene = q(".pia-scene");
    expect(scene.getAttribute("role")).toBe("img");
    expect(scene.getAttribute("aria-label")).toContain("three-dot menu");
    expect(scene.querySelector(".pia-target")).not.toBeNull();
  });

  it("the picker changes the guide; «Not right?» focuses it", () => {
    const { events } = mount(UA.windowsChrome);
    const select = q<HTMLSelectElement>("select");
    buttonByText("Not right?").click();
    expect(document.activeElement).toBe(select);
    select.value = "android-samsung";
    select.dispatchEvent(new Event("change"));
    expect(text()).toContain("You picked: Android with Samsung Internet.");
    expect(q(".pia-h3").textContent).toBe("Tap the ≡ menu");
    expect(events.some((e) => e.type === "guide-picked")).toBe(true);
  });

  it("unknown device: asks to pick", () => {
    mount("");
    expect(text()).toContain("We couldn't recognise your device");
  });

  it("standalone: «It's already installed!» and no picker", () => {
    restoreMedia();
    restoreMedia = stubMedia("standalone");
    mount(UA.androidChrome);
    expect(text()).toContain("It's already installed!");
    expect(host.querySelector("select")).toBeNull();
  });

  it("Spanish", () => {
    mount(UA.iphoneSafari18, { locale: "es", appName: "PlanABC" });
    expect(text()).toContain("Parece que usas: iPhone con Safari (iOS 18 o anterior).");
    expect(q(".pia-h3").textContent).toBe("Toca el botón Compartir");
    expect(q(".pia").getAttribute("lang")).toBe("es");
  });

  it("messages override any text", () => {
    mount(UA.androidFirefox, { messages: { common: { next: "Onwards" } } });
    expect(buttonByText("Onwards")).toBeTruthy();
  });

  it("minimal illustrations and custom ones", () => {
    mount(UA.androidChrome, { steps: { illustrations: "minimal" } });
    expect(host.querySelector(".pia-minimal")).not.toBeNull();
    expect(host.querySelector(".pia-frame")).toBeNull();
    host.replaceChildren();
    mount(UA.androidChrome, { steps: { illustrations: (step) => document.createTextNode(`custom:${step.title}`) } });
    expect(text()).toContain("custom:Tap the ⋮ menu");
  });
});

describe("CSP and DOM hygiene", () => {
  it("injects one <style> with the nonce, and no style attributes anywhere", () => {
    mount(UA.iphoneSafari26, { nonce: "abc123" });
    mount(UA.androidChrome, { nonce: "abc123" });
    const styles = document.querySelectorAll("style");
    expect(styles).toHaveLength(1);
    expect(styles[0].getAttribute("nonce")).toBe("abc123");
    expect(document.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("injectStyles: false adds no stylesheet", () => {
    mount(UA.androidChrome, { injectStyles: false });
    expect(document.querySelectorAll("style")).toHaveLength(0);
  });

  it("the CSS honours reduced motion: every animation is inside no-preference", () => {
    const outside = lib.PWA_INSTALL_CSS.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/, "");
    expect(outside).not.toMatch(/animation:/);
  });

  it("destroy removes everything it added and stops listening", () => {
    const { assistant } = mount(UA.androidChrome);
    assistant.destroy();
    expect(host.children).toHaveLength(0);
  });
});

describe("modal and sheet", () => {
  it("modal: a labelled dialog that opens and closes; closing by the person is remembered", () => {
    const { assistant, events } = mount(UA.androidChrome, { mode: "modal" });
    const dialog = q<HTMLDialogElement>("dialog.pia");
    expect(dialog.getAttribute("aria-labelledby")).toBe(q("dialog h2").id);
    expect(q("dialog h2").textContent).toBe("Install Acme");
    expect(assistant.isOpen).toBe(false);
    assistant.open();
    expect(assistant.isOpen).toBe(true);
    q<HTMLButtonElement>(".pia-dialog-head .pia-icon-btn").click();
    expect(assistant.isOpen).toBe(false);
    expect(assistant.controller.isDismissed()).toBe(true);
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(["shown", "closed", "hidden"]));
  });

  it("sheet: a bottom sheet with a grabber", () => {
    const { assistant } = mount(UA.androidChrome, { mode: "sheet" });
    assistant.open();
    expect(q("dialog").classList.contains("pia-dialog-sheet")).toBe(true);
    expect(q(".pia-grabber")).not.toBeNull();
    assistant.destroy();
    expect(document.querySelector("dialog")).toBeNull();
  });
});
