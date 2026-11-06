/** In-app browsers, old iOS outside Safari, and desktop (QR code). */
import type { InstallState } from "../../core/controller";
import type { Os } from "../../core/detect";
import { externalBrowserName, openInBrowserUrl } from "../../core/links";
import type { Part, UiContext } from "../context";
import { h, uid } from "../dom";
import { fill } from "../i18n";
import { icon } from "../icons";

/** «Copy link», with a selectable field when the clipboard is blocked. */
export function copyLink(ctx: UiContext): HTMLElement {
  const m = ctx.m.inApp;
  const live = h("p", { class: "pia-sr", "aria-live": "polite" });
  const fallback = h("div");
  const label = h("span", null, m.copy);
  const el = h(
    "div",
    { class: "pia-stack-sm" },
    h(
      "button",
      {
        type: "button",
        class: "pia-btn pia-btn-secondary",
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(ctx.url);
            label.textContent = m.copied;
            live.textContent = m.copied;
            ctx.controller.emit({ type: "link-copied" });
          } catch {
            const id = uid("pia-url");
            const input = h("input", { id, class: "pia-copy-input", readonly: true, value: ctx.url });
            input.addEventListener("focus", () => input.select());
            fallback.replaceChildren(
              h("label", { class: "pia-stack-sm pia-p pia-small", for: id }, m.copyFailed, input),
            );
            input.focus();
          }
        },
      },
      icon("copy"),
      label,
    ),
    live,
    fallback,
  );
  return el;
}

/** The OS to leave to: the one picked by hand wins over the detected one. */
function osOf(state: InstallState): Os {
  const key = state.guide ?? "";
  if (key.startsWith("android")) return "android";
  if (/^(ios|iphone|ipad)-/.test(key)) return "ios";
  return state.device.os;
}

export function inAppView(ctx: UiContext, state: InstallState): Part {
  const m = ctx.m.inApp;
  const oldIos = state.view === "open-safari";
  const os = oldIos ? "ios" : osOf(state);
  const browser = externalBrowserName(os) ?? m.yourBrowser;
  const open = openInBrowserUrl(ctx.url, os);
  const name = state.picked ? null : (state.device.inApp?.name ?? null);
  const where = name ? fill(m.where, { name }) : m.whereUnknown;
  const steps = oldIos
    ? [m.stepOldCopy, m.stepOldPaste]
    : [
        fill(m.stepMenu, { menu: os === "android" ? "⋮" : "•••" }),
        fill(m.stepOpen, { browser }),
        fill(m.stepCopy, { browser }),
      ];
  return {
    el: h(
      "section",
      { class: "pia-card pia-stack", "data-view": state.view },
      h("h2", { class: "pia-h2" }, fill(m.title, { browser })),
      h("p", { class: "pia-lead" }, oldIos ? m.oldIos : fill(m.text, { app: ctx.app, where })),
      h(
        "div",
        { class: "pia-row" },
        open
          ? h(
              "a",
              {
                class: "pia-btn",
                href: open,
                onclick: () => ctx.controller.emit({ type: "open-in-browser", browser }),
              },
              icon("external"),
              fill(m.open, { browser }),
            )
          : null,
        copyLink(ctx),
      ),
      h(
        "div",
        { class: "pia-stack-sm pia-p" },
        h("p", { class: "pia-p" }, h("b", null, m.ifNothing)),
        h(
          "ol",
          { class: "pia-list" },
          [...steps, m.stepThere].map((s) => h("li", null, s)),
        ),
      ),
    ),
  };
}

export function desktopView(ctx: UiContext): Part {
  const m = ctx.m.desktop;
  const box = h("div", { class: "pia-qr" });
  let alive = true;
  if (typeof ctx.qr === "function") {
    box.append(ctx.qr(ctx.url));
  } else if (ctx.qr) {
    // Loaded on demand: only desktop visitors pay for the encoder.
    void import("../../qr/index").then(({ qrSvg }) => {
      if (alive) box.replaceChildren(qrSvg(ctx.url, { label: m.qr }));
    });
  }
  const hasQr = ctx.qr !== false;
  return {
    el: h(
      "section",
      { class: `pia-card${hasQr ? " pia-qr-grid" : " pia-stack"}`, "data-view": "desktop" },
      hasQr ? box : null,
      h(
        "div",
        { class: "pia-stack-sm" },
        h("h2", { class: "pia-h2 pia-row" }, icon("phone"), fill(m.title, { app: ctx.app })),
        h("p", { class: "pia-lead" }, hasQr ? m.text : m.textNoQr),
        h("p", { class: "pia-url-text" }, ctx.url.replace(/^https?:\/\//, "")),
        h("div", null, copyLink(ctx)),
      ),
    ),
    destroy: () => {
      alive = false;
    },
  };
}
