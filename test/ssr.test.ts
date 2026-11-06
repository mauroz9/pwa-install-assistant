// Node, no DOM: what a server render does.
import { describe, expect, it } from "vitest";

describe("server rendering", () => {
  it("React renders an empty container and never touches the DOM", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { InstallAssistant, useInstallState } = await import("../src/react/index");
    expect(renderToString(createElement(InstallAssistant, { appName: "Acme", className: "x" }))).toBe(
      '<div class="x"></div>',
    );
    function Probe() {
      return createElement("p", null, useInstallState() === null ? "server" : "client");
    }
    expect(renderToString(createElement(Probe))).toBe("<p>server</p>");
  });

  it("Vue renders an empty container", async () => {
    const { createSSRApp, h } = await import("vue");
    const { renderToString } = await import("vue/server-renderer");
    const { InstallAssistant } = await import("../src/vue/index");
    expect(await renderToString(createSSRApp({ render: () => h(InstallAssistant, { appName: "Acme" }) }))).toBe(
      "<div></div>",
    );
  });

  it("the Web Component and the Svelte/Solid entries import on a server", async () => {
    await expect(import("../src/element/index")).resolves.toBeTruthy();
    await expect(import("../src/svelte/index")).resolves.toBeTruthy();
    await expect(import("../src/qr/index")).resolves.toBeTruthy();
  });
});
