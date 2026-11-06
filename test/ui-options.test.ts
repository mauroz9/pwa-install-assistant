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
  lib.createInstallAssistant(host, { appName: "Acme", locale: "en", env: { userAgent }, ...options });

describe("theme", () => {
  it("sets variables through CSSOM (no style attribute in the markup) and derives the accent shades", () => {
    const assistant = mount(UA.androidChrome, {
      theme: {
        accent: "#e11d48",
        success: "#16a34a",
        radius: 6,
        font: "Georgia, serif",
        scheme: "dark",
        vars: { "--pia-on-accent": "#000" },
      },
    });
    const root = assistant.element;
    expect(root.dataset.scheme).toBe("dark");
    expect(root.style.getPropertyValue("--pia-accent")).toBe("#e11d48");
    expect(root.style.getPropertyValue("--pia-accent-soft")).toContain("color-mix(in srgb, #e11d48 12%");
    expect(root.style.getPropertyValue("--pia-radius")).toBe("6px");
    expect(root.style.getPropertyValue("--pia-font")).toBe("Georgia, serif");
    expect(root.style.getPropertyValue("--pia-on-accent")).toBe("#000");
  });

  it("light by default; update() changes it", () => {
    const assistant = mount(UA.androidChrome);
    expect(assistant.element.dataset.scheme).toBe("light");
    assistant.update({ theme: { scheme: "auto", accent: "teal" } });
    expect(assistant.element.dataset.scheme).toBe("auto");
    expect(assistant.element.style.getPropertyValue("--pia-accent")).toBe("teal");
  });

  it("the arrow and the hint, outside the container, get the theme too; arrow size, colour and drawing", () => {
    localStorage.setItem("pwa-install.safari-bar", "compact");
    mount(UA.iphoneSafari26, {
      theme: { accent: "#e11d48", scheme: "dark" },
      arrow: { size: 60, color: "orange", render: (el) => el.append(document.createTextNode("👇")) },
    });
    Array.from(host.querySelectorAll("button"))
      .find((b) => b.textContent === "Start")!
      .click();
    const arrow = document.querySelector<HTMLElement>(".pia-arrow")!;
    expect(arrow.dataset.scheme).toBe("dark");
    expect(arrow.style.getPropertyValue("--pia-accent")).toBe("#e11d48");
    expect(arrow.style.getPropertyValue("--pia-arrow-size")).toBe("60px");
    expect(arrow.style.getPropertyValue("--pia-arrow-color")).toBe("orange");
    expect(arrow.style.getPropertyValue("--pia-right")).toBe("28px");
    expect(arrow.textContent).toBe("👇");
    expect(document.querySelector<HTMLElement>(".pia-hint")!.dataset.scheme).toBe("dark");
  });
});

describe("when the modal opens by itself", () => {
  it("manual by default", () => {
    vi.useFakeTimers();
    const assistant = mount(UA.androidChrome, { mode: "modal" });
    vi.advanceTimersByTime(60_000);
    expect(assistant.isOpen).toBe(false);
  });

  it("on load, and after a delay", () => {
    vi.useFakeTimers();
    const a = mount(UA.androidChrome, { mode: "modal", trigger: "load" });
    vi.advanceTimersByTime(0);
    expect(a.isOpen).toBe(true);
    a.destroy();
    const b = mount(UA.androidChrome, { mode: "sheet", trigger: { delay: 5000 } });
    vi.advanceTimersByTime(4999);
    expect(b.isOpen).toBe(false);
    vi.advanceTimersByTime(1);
    expect(b.isOpen).toBe(true);
  });

  it("after the first gesture", () => {
    vi.useFakeTimers();
    const assistant = mount(UA.androidChrome, { mode: "sheet", trigger: "gesture" });
    vi.advanceTimersByTime(1000);
    expect(assistant.isOpen).toBe(false);
    document.dispatchEvent(new Event("pointerup"));
    vi.advanceTimersByTime(0);
    expect(assistant.isOpen).toBe(true);
  });

  it("not again once closed (or until showAgainAfter days), and never when installed", () => {
    vi.useFakeTimers();
    const first = mount(UA.androidChrome, { mode: "modal", trigger: "load" });
    vi.advanceTimersByTime(0);
    first.close();
    first.destroy();
    const again = mount(UA.androidChrome, { mode: "modal", trigger: "load" });
    vi.advanceTimersByTime(0);
    expect(again.isOpen).toBe(false);
    again.destroy();
    const always = mount(UA.androidChrome, { mode: "modal", trigger: "load", showAgainAfter: 0 });
    vi.advanceTimersByTime(0);
    expect(always.isOpen).toBe(true);
    always.destroy();

    localStorage.clear();
    localStorage.setItem("pwa-install.installed", "1");
    const installed = mount(UA.androidChrome, { mode: "modal", trigger: "load" });
    vi.advanceTimersByTime(0);
    expect(installed.isOpen).toBe(false);
    installed.open();
    expect(installed.isOpen).toBe(true);
  });

  it("when: your own condition (e.g. phones only)", () => {
    vi.useFakeTimers();
    const onlyPhones = (s: { device: { os: string } }) => s.device.os !== "desktop";
    const desktop = mount(UA.windowsChrome, { mode: "modal", trigger: "load", when: onlyPhones });
    vi.advanceTimersByTime(0);
    expect(desktop.isOpen).toBe(false);
    desktop.destroy();
    const phone = mount(UA.androidChrome, { mode: "modal", trigger: "load", when: onlyPhones });
    vi.advanceTimersByTime(0);
    expect(phone.isOpen).toBe(true);
  });
});

describe("analytics hook", () => {
  it("onEvent hears everything and the library sends nothing", () => {
    const seen: string[] = [];
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    mount(UA.androidFirefox, { onEvent: (e) => seen.push(e.type) });
    Array.from(host.querySelectorAll("button"))
      .find((b) => b.textContent === "Next")!
      .click();
    expect(seen).toEqual(["detected", "shown", "step"]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
