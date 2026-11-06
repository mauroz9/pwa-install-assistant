// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMedia } from "./fixtures/media";
import { fakePromptEvent } from "./fixtures/prompt";
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
afterEach(() => restoreMedia());

const mount = (userAgent: string, locale = "en") =>
  lib.createInstallAssistant(host, { appName: "Acme", appUrl: "https://acme.example/", locale, env: { userAgent } });
const text = () => host.textContent ?? "";
const section = () => host.querySelector<HTMLElement>("[data-phase]");
const buttonByText = (label: string) =>
  Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.trim() === label);
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("Android prompt assistant", () => {
  it("before the event: only the menu guide; when it arrives: the assistant on top of it", () => {
    mount(UA.androidChrome);
    expect(section()).toBeNull();
    expect(text()).not.toContain("Or do it from the menu");
    window.dispatchEvent(fakePromptEvent());
    expect(section()?.dataset.phase).toBe("ready");
    expect(text()).toContain("Install it with one tap");
    expect(text()).toContain("Tap “Install Acme” to start.");
    expect(text()).toContain("Or do it from the menu");
    expect(host.querySelector(".pia-h3")?.textContent).toBe("Tap the ⋮ menu");
  });

  it("accept → installing (launcher hint, guide hidden) → appinstalled → installed with «Open Acme»", async () => {
    mount(UA.androidChrome);
    window.dispatchEvent(fakePromptEvent("accepted"));
    buttonByText("Install Acme")!.click();
    expect(section()?.dataset.phase).toBe("prompting");
    expect(text()).toContain("Waiting for your answer…");
    await flush();
    expect(section()?.dataset.phase).toBe("accepted");
    expect(host.querySelector("[role=status]")?.textContent).toContain("If your phone asks");
    expect(host.querySelector(".pia-h3")).toBeNull();
    window.dispatchEvent(new Event("appinstalled"));
    expect(section()?.dataset.phase).toBe("installed");
    expect(text()).toContain("Acme is on your phone!");
    expect(host.querySelector<HTMLAnchorElement>("a.pia-btn")?.href).toBe("https://acme.example/");
    expect(host.querySelectorAll("[data-state=done]").length).toBeGreaterThanOrEqual(4);
  });

  it("dismiss → «Try again» once the browser offers it again; without it, points to the menu", async () => {
    mount(UA.androidChrome, "es");
    window.dispatchEvent(fakePromptEvent("dismissed"));
    buttonByText("Instalar Acme")!.click();
    await flush();
    expect(section()?.dataset.phase).toBe("dismissed");
    expect(host.querySelector("[role=status]")?.textContent).toMatch(/menú del navegador/);
    expect(buttonByText("Intentarlo otra vez")).toBeUndefined();
    window.dispatchEvent(fakePromptEvent("accepted"));
    expect(host.querySelector("[role=status]")?.textContent).toMatch(/volver a intentarlo/);
    buttonByText("Intentarlo otra vez")!.click();
    await flush();
    expect(section()?.dataset.phase).toBe("accepted");
  });

  it("installing from the browser menu also jumps to «installed»", () => {
    mount(UA.androidChrome);
    window.dispatchEvent(fakePromptEvent());
    window.dispatchEvent(new Event("appinstalled"));
    expect(section()?.dataset.phase).toBe("installed");
  });

  it("browsers not verified yet get a plain install button over the guide", async () => {
    const assistant = mount(UA.samsung);
    window.dispatchEvent(fakePromptEvent("accepted"));
    expect(host.querySelector("[data-prompt=button]")).not.toBeNull();
    expect(section()).toBeNull();
    buttonByText("Install Acme")!.click();
    await flush();
    expect(assistant.controller.getState().installed).toBe(true);
  });
});

describe("promptStatus", () => {
  it("mentions the launcher only after accepting", () => {
    const hint = lib.en.prompt.launcherHint;
    expect(lib.promptStatus(lib.en, "A", "ready", true)).not.toContain(hint);
    expect(lib.promptStatus(lib.en, "A", "prompting", true)).not.toContain(hint);
    expect(lib.promptStatus(lib.en, "A", "accepted", false)).toContain(hint);
    expect(lib.promptStatus(lib.es, "A", "installed", false)).toMatch(/^¡Ya está instalada!/);
  });
});
