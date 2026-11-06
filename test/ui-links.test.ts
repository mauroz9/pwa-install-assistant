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
    appUrl: "https://acme.example/start",
    locale: "en",
    env: { userAgent },
    onEvent: (e) => events.push(e),
    ...options,
  });
  return { assistant, events };
}
const link = (text: string) => Array.from(host.querySelectorAll("a")).find((a) => a.textContent?.includes(text));
const copyButton = () => Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes("Copy link"))!;
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("in-app browsers", () => {
  it("Instagram on Android: names the app, opens Chrome with an intent", () => {
    const { events } = mount(UA.instagramAndroid);
    expect(host.textContent).toContain("Open it in Chrome to install it");
    expect(host.textContent).toContain("You're viewing Acme inside Instagram.");
    const open = link("Open in Chrome")!;
    expect(open.getAttribute("href")).toMatch(/^intent:\/\/acme\.example\/start#Intent;/);
    open.addEventListener("click", (e) => e.preventDefault());
    open.click();
    expect(events.some((e) => e.type === "open-in-browser")).toBe(true);
  });

  it("Gmail on iOS (unnamed WebView): Safari scheme and the menu steps", () => {
    mount(UA.gmailIos);
    expect(link("Open in Safari")!.getAttribute("href")).toBe("x-safari-https://acme.example/start");
    expect(host.textContent).toContain("inside another app");
    expect(host.textContent).toContain("Tap the app's menu (•••");
  });

  it("old iOS outside Safari: only Safari can add it", () => {
    mount(UA.iosChromeOld, { locale: "es" });
    expect(host.textContent).toContain("solo se pueden añadir webs a la pantalla de inicio desde Safari");
    expect(host.textContent).toContain("Pegar y abrir");
  });

  it("copy link: copies and announces; if the clipboard is blocked, shows a selectable field", async () => {
    const write = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
    const { events } = mount(UA.whatsappAndroid);
    copyButton().click();
    await flush();
    expect(write).toHaveBeenCalledWith("https://acme.example/start");
    expect(host.querySelector("[aria-live=polite].pia-sr")?.textContent).toBe("Link copied");
    expect(events.some((e) => e.type === "link-copied")).toBe(true);

    write.mockRejectedValueOnce(new Error("blocked"));
    host.replaceChildren();
    mount(UA.whatsappAndroid);
    copyButton().click();
    await flush();
    expect(host.querySelector<HTMLInputElement>("input.pia-copy-input")?.value).toBe("https://acme.example/start");
  });
});

describe("desktop", () => {
  it("QR code generated locally (loaded on demand), labelled, with the URL", async () => {
    mount(UA.windowsChrome);
    expect(host.textContent).toContain("Acme is made for your phone");
    expect(host.textContent).toContain("acme.example/start");
    await vi.waitFor(() => expect(host.querySelector(".pia-qr svg[role=img]")).not.toBeNull());
    expect(host.querySelector(".pia-qr svg")?.getAttribute("aria-label")).toBe(
      "QR code that opens this page on your phone",
    );
  });

  it("qr: false → link only; qr: function → your own", () => {
    mount(UA.windowsChrome, { qr: false });
    expect(host.querySelector(".pia-qr")).toBeNull();
    expect(host.textContent).toContain("Open this address on your phone");
    host.replaceChildren();
    mount(UA.windowsChrome, {
      qr: (url) => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("data-url", url);
        return svg;
      },
    });
    expect(host.querySelector(".pia-qr svg")?.getAttribute("data-url")).toBe("https://acme.example/start");
  });
});
