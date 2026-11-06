// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakePromptEvent } from "./fixtures/prompt";

type Hub = typeof import("../src/core/prompt");

let hub: Hub;
beforeEach(async () => {
  vi.resetModules();
  hub = await import("../src/core/prompt");
});

describe("beforeinstallprompt hub", () => {
  it("captures the event on import, prevents the mini-infobar and offers the dialog", () => {
    expect(hub.canPrompt()).toBe(false);
    const event = fakePromptEvent();
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(hub.canPrompt()).toBe(true);
  });

  it("uses each event once and resolves with the choice", async () => {
    const event = fakePromptEvent("dismissed");
    window.dispatchEvent(event);
    await expect(hub.promptInstall()).resolves.toBe("dismissed");
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(hub.canPrompt()).toBe(false);
    await expect(hub.promptInstall()).resolves.toBe("unavailable");
  });

  it("notifies on every change and on appinstalled", () => {
    const listener = vi.fn();
    const off = hub.onPromptChange(listener);
    window.dispatchEvent(fakePromptEvent());
    window.dispatchEvent(new Event("appinstalled"));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(hub.canPrompt()).toBe(false);
    expect(hub.wasInstalledThisVisit()).toBe(true);
    off();
    window.dispatchEvent(fakePromptEvent());
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("whenInstalled resolves on appinstalled", async () => {
    let done = false;
    const promise = hub.whenInstalled().then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    window.dispatchEvent(new Event("appinstalled"));
    await promise;
    expect(done).toBe(true);
  });

  it("a prompt the browser refuses counts as unavailable", async () => {
    const event = fakePromptEvent();
    event.prompt = vi.fn(async () => {
      throw new DOMException("NotAllowedError");
    });
    window.dispatchEvent(event);
    await expect(hub.promptInstall()).resolves.toBe("unavailable");
  });
});
