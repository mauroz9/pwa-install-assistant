/**
 * Illustration of a step, in DOM + CSS: the browser, the menu or the home
 * screen, with an animated arrow on what to tap. Decorative for screen readers:
 * the step's `alt` describes it whole (the wrapper has `role="img"`).
 */
import { h, type Child } from "./dom";
import type { BarIcon, BarItem, Device, Scene, SceneOs, Step } from "./guides";
import { icon, type IconName } from "./icons";

export interface SceneContext {
  app: string;
  host: string;
  /** App icon URL; without one, a tile with the app's initial. */
  iconUrl?: string;
  /** Texts of the iOS confirm screen. */
  labels: { cancel: string; add: string; title: string; webApp: string; note: string };
}

/** `default` = the full browser drawings, `minimal` = only what to tap; or draw it yourself. */
export type Illustrations = "default" | "minimal" | ((step: Step, ctx: SceneContext) => Node | null);

const BAR_ICONS: Record<BarIcon, IconName> = {
  share: "share",
  more: "more",
  kebab: "kebab",
  menu: "menu",
  back: "back",
  forward: "forward",
  tabs: "tabs",
  book: "book",
  plus: "plus",
  home: "home",
  sidebar: "sidebar",
};

export function renderScene(step: Step, ctx: SceneContext, style: Illustrations = "default"): HTMLElement {
  let body: Node | null;
  if (typeof style === "function") body = style(step, ctx);
  else body = style === "minimal" ? minimal(step.scene, ctx) : full(step.scene, ctx);
  // The drawing is decorative: the wrapper's label describes it whole.
  const art = h("div", { class: "pia-scene-art", "aria-hidden": "true" }, body);
  return h("div", { class: "pia-scene", role: "img", "aria-label": step.alt }, art);
}

/**
 * What has to be tapped: an accent ring with a pulse, and an arrow pushing at it.
 * `up` = the arrow is below and points up; `down`, above; `left`, to the right.
 */
function target(pointer: "up" | "down" | "left", className: string, ...children: Child[]): HTMLElement {
  const arrow = pointer === "up" ? "arrowUp" : pointer === "down" ? "arrowDown" : "arrowLeft";
  return h(
    "span",
    { class: `pia-target ${className}` },
    h("span", { class: "pia-target-pulse", "aria-hidden": "true" }),
    ...children,
    h("span", { class: `pia-target-arrow pia-target-arrow-${pointer}`, "aria-hidden": "true" }, icon(arrow)),
  );
}

function appIcon(ctx: SceneContext, className = ""): HTMLElement {
  if (ctx.iconUrl) {
    return h("img", {
      class: `pia-app-icon ${className}`,
      src: ctx.iconUrl,
      alt: "",
      width: 64,
      height: 64,
      draggable: "false",
    });
  }
  return h(
    "span",
    { class: `pia-app-icon pia-app-icon-letter ${className}`, "aria-hidden": "true" },
    ctx.app.trim().charAt(0).toUpperCase() || "•",
  );
}

function frame(device: Device, os: SceneOs, ...children: Child[]): HTMLElement {
  return h(
    "div",
    { class: `pia-frame pia-frame-${device} pia-frame-${os}` },
    h(
      "div",
      { class: "pia-status", "aria-hidden": "true" },
      h("span", null, "9:41"),
      os === "ios" && device === "phone" ? h("span", { class: "pia-island" }) : null,
      h("span", { class: "pia-signal" }, "●●●"),
    ),
    ...children,
  );
}

function bar(items: BarItem[], targetIndex: number, side: "top" | "bottom", ctx: SceneContext): HTMLElement {
  return h(
    "div",
    { class: `pia-bar pia-bar-${side}` },
    items.map((item, index) => {
      if (item === "url") {
        return h(
          "span",
          { class: "pia-url" },
          icon("lock", "pia-icon pia-icon-xs"),
          h("span", { class: "pia-url-host" }, ctx.host),
        );
      }
      const glyph = icon(BAR_ICONS[item]);
      if (index === targetIndex)
        return target(side === "bottom" ? "down" : "up", "pia-bar-button pia-bar-button-on", glyph);
      return h("span", { class: "pia-bar-button" }, glyph);
    }),
  );
}

/** A miniature page of the app, inside the browser. */
function pageMock(ctx: SceneContext, dimmed = false): HTMLElement {
  return h(
    "div",
    { class: "pia-page" },
    appIcon(ctx, "pia-page-icon"),
    h("span", { class: "pia-line pia-line-strong" }),
    h("span", { class: "pia-line" }),
    h("span", { class: "pia-line pia-line-short" }),
    h("span", { class: "pia-page-button" }),
    dimmed ? h("span", { class: "pia-dim" }) : null,
  );
}

function sheet(scene: Extract<Scene, { kind: "sheet" }>, ctx: SceneContext): HTMLElement {
  return h(
    "div",
    { class: `pia-sheet-panel pia-anchor-${scene.anchor}` },
    scene.header
      ? h(
          "div",
          { class: "pia-sheet-header" },
          appIcon(ctx, "pia-icon-sm"),
          h("span", { class: "pia-sheet-app" }, h("b", null, ctx.app), h("span", null, ctx.host)),
        )
      : null,
    scene.title ? h("p", { class: "pia-sheet-title" }, scene.title) : null,
    h(
      "ul",
      { class: "pia-sheet-items" },
      scene.items.map((item, index) =>
        index === scene.highlight
          ? h("li", { class: "pia-sheet-item-on" }, target("left", "pia-sheet-target", item))
          : h("li", { class: "pia-sheet-item" }, item),
      ),
    ),
  );
}

function full(scene: Scene, ctx: SceneContext): HTMLElement {
  switch (scene.kind) {
    case "browser":
      return frame(
        scene.device,
        scene.os,
        scene.top ? bar(scene.top, scene.target.bar === "top" ? scene.target.index : -1, "top", ctx) : null,
        pageMock(ctx),
        scene.bottom ? bar(scene.bottom, scene.target.bar === "bottom" ? scene.target.index : -1, "bottom", ctx) : null,
      );
    case "sheet":
      return frame(scene.device, scene.os, pageMock(ctx, true), sheet(scene, ctx));
    case "ios-confirm":
      return frame(
        scene.device,
        "ios",
        h(
          "div",
          { class: "pia-confirm-bar" },
          h("span", { class: "pia-link" }, ctx.labels.cancel),
          h("b", null, ctx.labels.title),
          target("up", "pia-confirm-add", ctx.labels.add),
        ),
        h(
          "div",
          { class: "pia-confirm-body" },
          h(
            "div",
            { class: "pia-card-mini" },
            appIcon(ctx, "pia-icon-md"),
            h("span", { class: "pia-confirm-name" }, h("b", null, ctx.app), h("span", null, ctx.host)),
          ),
          scene.webApp
            ? h(
                "div",
                { class: "pia-card-mini pia-toggle-row" },
                h("span", null, ctx.labels.webApp),
                h("span", { class: "pia-toggle", "aria-hidden": "true" }, h("span", null)),
              )
            : null,
          h("p", { class: "pia-confirm-note" }, ctx.labels.note),
        ),
      );
    case "android-dialog":
      return frame(
        "phone",
        "android",
        pageMock(ctx, true),
        h(
          "div",
          { class: "pia-android-dialog" },
          h("p", { class: "pia-android-dialog-title" }, scene.title),
          h(
            "div",
            { class: "pia-android-dialog-app" },
            appIcon(ctx, "pia-icon-md"),
            h("span", { class: "pia-confirm-name" }, h("b", null, ctx.app), h("span", null, ctx.host)),
          ),
          h(
            "div",
            { class: "pia-android-dialog-actions" },
            h("span", null, scene.cancel),
            target("down", "pia-android-dialog-action", scene.action),
          ),
        ),
      );
    case "home":
      return home(scene.device, scene.os, ctx);
  }
}

function home(device: Device, os: SceneOs, ctx: SceneContext): HTMLElement {
  const count = device === "tablet" ? 14 : 11;
  return frame(
    device,
    os,
    h(
      "div",
      { class: "pia-home" },
      h(
        "div",
        { class: `pia-home-grid pia-home-grid-${device}` },
        Array.from({ length: count }, () =>
          h(
            "span",
            { class: "pia-home-app" },
            h("span", { class: "pia-home-tile" }),
            h("span", { class: "pia-home-name" }),
          ),
        ),
        h(
          "span",
          { class: "pia-home-app" },
          target("down", "pia-home-target", appIcon(ctx, "pia-home-icon")),
          h("b", { class: "pia-home-label" }, ctx.app),
        ),
      ),
      os === "ios" ? h("span", { class: "pia-dock" }) : null,
    ),
  );
}

/** Only what has to be tapped, big. */
function minimal(scene: Scene, ctx: SceneContext): HTMLElement {
  let what: Child;
  switch (scene.kind) {
    case "browser": {
      const item = (scene.target.bar === "top" ? scene.top : scene.bottom)?.[scene.target.index];
      what = item && item !== "url" ? icon(BAR_ICONS[item], "pia-icon pia-icon-xl") : "";
      break;
    }
    case "sheet":
      what = scene.items[scene.highlight];
      break;
    case "ios-confirm":
      what = ctx.labels.add;
      break;
    case "android-dialog":
      what = scene.action;
      break;
    case "home":
      what = appIcon(ctx, "pia-icon-lg");
      break;
  }
  return h("div", { class: "pia-minimal" }, target("down", "pia-minimal-target", what));
}
