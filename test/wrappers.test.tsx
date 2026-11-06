// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMedia } from "./fixtures/media";
import { UA } from "./fixtures/user-agents";

let restoreMedia = () => {};
let host: HTMLElement;
const base = { appName: "Acme", locale: "en", env: { userAgent: UA.androidFirefox } };

beforeEach(() => {
  restoreMedia = stubMedia();
  vi.resetModules();
  localStorage.clear();
  document.body.replaceChildren();
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => restoreMedia());

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("React", () => {
  it("mounts, follows prop changes, forwards events and unmounts cleanly", async () => {
    const { createElement, act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { InstallAssistant } = await import("../src/react/index");
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot(host);
    const events: string[] = [];
    await act(async () =>
      root.render(createElement(InstallAssistant, { ...base, onEvent: (e) => events.push(e.type) })),
    );
    expect(host.querySelector(".pia h3")?.textContent).toBe("Tap the ⋮ menu");
    expect(events).toContain("detected");
    await act(async () => root.render(createElement(InstallAssistant, { ...base, locale: "es", onEvent: () => {} })));
    expect(host.querySelector(".pia h3")?.textContent).toBe("Toca el menú ⋮");
    await act(async () => root.unmount());
    expect(host.childNodes).toHaveLength(0);
  });

  it("useInstallState: headless state that follows the controller", async () => {
    const { createElement, act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { useInstallState } = await import("../src/react/index");
    let seen: ReturnType<typeof useInstallState> = null;
    function Probe() {
      seen = useInstallState({ env: { userAgent: UA.windowsChrome } });
      return createElement("p", null, seen?.state.view ?? "server");
    }
    const root = createRoot(host);
    await act(async () => root.render(createElement(Probe)));
    expect(host.textContent).toBe("desktop");
    await act(async () => seen!.controller.pick("android-chrome"));
    expect(host.textContent).toBe("guide");
    await act(async () => root.unmount());
  });
});

describe("Vue", () => {
  it("mounts, emits events, updates props and unmounts cleanly", async () => {
    const { createApp, h, ref } = await import("vue");
    const { InstallAssistant } = await import("../src/vue/index");
    const locale = ref("en");
    const events: string[] = [];
    const app = createApp({
      render: () =>
        h(InstallAssistant, { ...base, locale: locale.value, onEvent: (e: { type: string }) => events.push(e.type) }),
    });
    app.mount(host);
    expect(host.querySelector(".pia h3")?.textContent).toBe("Tap the ⋮ menu");
    expect(events).toContain("detected");
    locale.value = "es";
    await flush();
    expect(host.querySelector(".pia h3")?.textContent).toBe("Toca el menú ⋮");
    app.unmount();
    expect(host.querySelector(".pia")).toBeNull();
  });
});

describe("Svelte action", () => {
  it("mounts, updates and destroys", async () => {
    const { installAssistant } = await import("../src/svelte/index");
    const action = installAssistant(host, base);
    expect(host.querySelector(".pia h3")?.textContent).toBe("Tap the ⋮ menu");
    action.update({ ...base, locale: "es" });
    expect(host.querySelector(".pia h3")?.textContent).toBe("Toca el menú ⋮");
    action.update({ ...base, mode: "sheet" });
    expect(document.querySelector("dialog.pia")).not.toBeNull();
    action.destroy();
    expect(document.querySelector(".pia")).toBeNull();
  });
});

describe("Solid directive", () => {
  it("mounts, reacts to the accessor and cleans up with its owner", async () => {
    const { createRoot, createSignal } = await import("solid-js");
    const { installAssistant, createInstallState } = await import("../src/solid/index");
    let dispose = () => {};
    const [locale, setLocale] = createSignal("en");
    let view = "";
    createRoot((d) => {
      dispose = d;
      installAssistant(host, () => ({ ...base, locale: locale() }));
      const { state } = createInstallState({ env: { userAgent: UA.windowsChrome } });
      view = state().view;
    });
    await flush();
    expect(view).toBe("desktop");
    expect(host.querySelector(".pia h3")?.textContent).toBe("Tap the ⋮ menu");
    setLocale("es");
    await flush();
    expect(host.querySelector(".pia h3")?.textContent).toBe("Toca el menú ⋮");
    dispose();
    expect(host.querySelector(".pia")).toBeNull();
  });
});

describe("Web Component", () => {
  it("<pwa-install-assistant>: attributes, events, open/close and removal", async () => {
    await import("../src/element/index");
    const el = document.createElement("pwa-install-assistant");
    el.setAttribute("app-name", "Acme");
    el.setAttribute("locale", "es");
    el.setAttribute("accent", "#e11d48");
    el.options = { env: { userAgent: UA.androidFirefox } };
    const events: string[] = [];
    document.addEventListener("pwa-install", (e) => events.push((e as CustomEvent).detail.type));
    document.body.append(el);
    expect(el.querySelector(".pia h3")?.textContent).toBe("Toca el menú ⋮");
    expect(el.querySelector<HTMLElement>(".pia")!.style.getPropertyValue("--pia-accent")).toBe("#e11d48");
    expect(events).toContain("detected");
    el.setAttribute("mode", "modal");
    el.open();
    expect(el.instance?.isOpen).toBe(true);
    el.close();
    el.remove();
    expect(el.querySelector(".pia")).toBeNull();
  });
});
