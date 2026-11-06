/**
 * Safari on iPhone/iPad. The page cannot see taps on Share and tapping the
 * page closes the Share sheet, so:
 *   1. Before starting, an animation loops through the whole sequence.
 *   2. On «Start», a fixed arrow on the page edge points at the real button
 *      (Share or «•••»), from `ARROW_SPOTS`.
 *   3. A hint pinned to the top lists the steps; it can be read above the
 *      half-height Share sheet.
 * There is no «Next» on the page. If the person cancels, everything stays at
 * step 1. Success is detected when the app is opened from its icon (standalone).
 */
import type { InstallState, IosArrowState } from "../../core/controller";
import { arrowPosition, SAFARI_BARS, type ArrowSpot, type SafariBar } from "../../core/spots";
import type { Part, UiContext } from "../context";
import { h, reducedMotion, setVars, uid } from "../dom";
import type { Guide } from "../guides";
import { fill, type Messages } from "../i18n";
import { icon } from "../icons";
import { button, helpDetails } from "../parts";
import { renderScene } from "../scene";

/** Time on each scene of the preview. */
export const SCENE_MS = 2600;

/** First line of the pinned hint, for the button the arrow points at. */
export function firstTapText(m: Messages, spot: ArrowSpot | null): string {
  const vars = { share: m.browser.ios.share, collapsed: m.ios.collapsed };
  if (!spot) return m.ios.tapGeneric;
  if (spot.button === "more") return fill(m.ios.tapMore, vars);
  if (spot.edge === "top") return fill(m.ios.tapShareTop, vars);
  return fill(m.ios.tapShareBottom, vars);
}

export function hintSteps(m: Messages, ios: IosArrowState): string[] {
  const b = m.browser.ios;
  return [
    firstTapText(m, ios.spot),
    fill(m.ios.chooseAdd, { addToHome: b.addToHome, viewMore: b.viewMore }),
    fill(ios.gen === "26" ? m.ios.confirmWebApp : m.ios.confirm, { openAsWebApp: b.openAsWebApp, add: b.add }),
  ];
}

/** Looping animation of the whole sequence. With reduced motion it does not move by itself. */
function preview(ctx: UiContext, guide: Guide): Part {
  const m = ctx.m;
  const total = guide.steps.length;
  let index = 0;
  let paused = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const still = reducedMotion();
  const stage = h("div");
  const counter = h("span", { class: "pia-eyebrow" });
  const caption = h("b");
  const pause = h("button", { type: "button", class: "pia-icon-btn", onclick: () => toggle() });

  function schedule() {
    clearTimeout(timer);
    if (still || paused) return;
    timer = setTimeout(() => show(index + 1), SCENE_MS);
  }
  function show(next: number) {
    index = (next + total) % total;
    const step = guide.steps[index];
    const scene = renderScene(step, ctx.scene, ctx.illustrations);
    scene.classList.add("pia-scene-in");
    stage.replaceChildren(scene);
    counter.textContent = fill(m.common.stepOf, { n: index + 1, total });
    caption.textContent = step.title;
    schedule();
  }
  function toggle() {
    paused = !paused;
    paintPause();
    schedule();
  }
  function paintPause() {
    pause.setAttribute("aria-label", paused ? m.ios.play : m.ios.pause);
    pause.replaceChildren(icon(paused ? "play" : "pause"));
  }

  paintPause();
  show(0);
  const el = h(
    "figure",
    { class: "pia-preview", "aria-label": m.ios.animation },
    stage,
    h("figcaption", null, counter, caption),
    h(
      "div",
      { class: "pia-preview-controls" },
      h(
        "button",
        { type: "button", class: "pia-icon-btn", "aria-label": m.ios.prevStep, onclick: () => show(index - 1) },
        h("span", { "aria-hidden": "true" }, "‹"),
      ),
      still ? null : pause,
      h(
        "button",
        { type: "button", class: "pia-icon-btn", "aria-label": m.ios.nextStep, onclick: () => show(index + 1) },
        h("span", { "aria-hidden": "true" }, "›"),
      ),
    ),
  );
  return { el, destroy: () => clearTimeout(timer) };
}

/** Drawing of each layout: Compact = address and «•••» at the bottom; Bottom = address and buttons at the bottom; Top = address at the top, buttons at the bottom. */
function miniPhone(bar: SafariBar): HTMLElement {
  const url = () => h("span", { class: "pia-mini-url" });
  return h(
    "span",
    { class: "pia-mini", "aria-hidden": "true" },
    h("span", { class: "pia-mini-gap" }),
    bar === "top" ? h("span", { class: "pia-mini-url-row" }, url()) : null,
    h("span", { class: "pia-mini-body" }, h("span"), h("span")),
    bar === "compact" ? h("span", { class: "pia-mini-url-row" }, url(), h("span", { class: "pia-mini-more" })) : null,
    bar === "bottom" ? h("span", { class: "pia-mini-url-row" }, url()) : null,
    bar !== "compact" ? h("span", { class: "pia-mini-buttons" }, h("span"), h("span"), h("span")) : null,
    h("span", { class: "pia-mini-gap-b" }),
  );
}

/** «What does your Safari bar look like?», with the three layouts of Settings › Apps › Safari › Tabs. Remembered. */
function barQuestion(ctx: UiContext, value: SafariBar | null): HTMLElement {
  const name = uid("pia-bar");
  return h(
    "fieldset",
    { class: "pia-bars" },
    h("legend", null, ctx.m.ios.barQuestion),
    h("p", { class: "pia-p pia-small" }, ctx.m.ios.barHelp),
    h(
      "div",
      { class: "pia-bars-options" },
      SAFARI_BARS.map((bar) => {
        const input = h("input", {
          type: "radio",
          name,
          value: bar,
          onchange: () => ctx.controller.setSafariBar(bar),
        });
        input.checked = value === bar;
        return h("label", { class: "pia-bar-option" }, input, miniPhone(bar), ctx.m.ios.bars[bar]);
      }),
    ),
  );
}

/** Fixed arrow on the page edge, pointing at Safari's real button. */
function arrowOverlay(ctx: UiContext, spot: ArrowSpot): HTMLElement {
  const size = ctx.arrow.size;
  const el = h("span", {
    class: `pia pia-arrow pia-arrow-${spot.edge}`,
    "aria-hidden": "true",
    "data-button": spot.button,
  });
  const pos = arrowPosition(spot, size);
  setVars(el, {
    "--pia-arrow-size": `${size}px`,
    "--pia-arrow-color": ctx.arrow.color ?? null,
    "--pia-left": pos.left,
    "--pia-right": pos.right,
    "--pia-top": pos.top,
    "--pia-bottom": pos.bottom,
  });
  if (ctx.arrow.render) ctx.arrow.render(el);
  else el.append(h("span", { class: "pia-arrow-body" }, icon(spot.edge === "bottom" ? "arrowDown" : "arrowUp")));
  return el;
}

/**
 * Hint pinned to the top with the steps. With a confirmed sheet signal, steps
 * 2 and 3 light up when the sheet opens; without one (today) they all show at once.
 */
function topHint(ctx: UiContext, ios: IosArrowState): HTMLElement {
  const steps = hintSteps(ctx.m, ios);
  // With the arrow at the top (iPad) the Share sheet pops over from the button, on the right:
  // the hint goes left and narrow so the popover does not cover it (verified on iPadOS 26.3).
  const top = ios.spot?.edge === "top";
  const el = h(
    "div",
    {
      class: `pia pia-hint${top ? " pia-hint-left" : ""}`,
      role: "region",
      "aria-label": ctx.m.ios.hintRegion,
      lang: ctx.m.locale,
    },
    h(
      "div",
      { class: "pia-hint-card" },
      h(
        "ol",
        { class: "pia-hint-steps" },
        steps.map((text, i) => {
          const now = ios.sheetOpen ? i > 0 : i === 0;
          return h(
            "li",
            { "data-state": now ? "now" : "todo" },
            h(
              "span",
              { class: "pia-chip pia-chip-xs", "data-state": now ? "now" : "todo", "aria-hidden": "true" },
              String(i + 1),
            ),
            h("span", null, text),
          );
        }),
      ),
      h(
        "button",
        {
          type: "button",
          class: "pia-hint-close",
          "aria-label": ctx.m.ios.closeHint,
          onclick: () => ctx.controller.setArrow(false),
        },
        icon("close"),
      ),
    ),
  );
  if (top && ios.spot && "fromRight" in ios.spot.x)
    setVars(el, { "--pia-hint-right": `${ios.spot.x.fromRight + 30}px` });
  return el;
}

export function iosAssistant(ctx: UiContext, initial: InstallState, guide: Guide): Part {
  const m = ctx.m;
  const titleId = uid("pia-ios");
  const anim = preview(ctx, guide);
  const question = h("div");
  const actions = h("div", { class: "pia-row" });
  const pending = h("p", { class: "pia-p pia-small" }, m.ios.barFirst);
  let overlays: HTMLElement[] = [];
  let lastKey = "";

  function start() {
    ctx.controller.setArrow(true);
    ctx.hideContainer();
    // Scrolling makes Safari 26 collapse its bar to the address in small type; back at the very top it
    // expands again and the button sits under the arrow (simulator: always on iPhone, not always on iPad;
    // the hint says what to do).
    try {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    } catch {
      /* old browsers */
    }
  }

  function paint(state: InstallState) {
    const ios = state.ios;
    if (!ios) return;
    const key = JSON.stringify(ios);
    if (key === lastKey) return;
    const wasActive = lastKey ? (JSON.parse(lastKey) as IosArrowState).active : false;
    lastKey = key;

    const blocked = ios.needsBar && !ios.bar;
    question.replaceChildren(...(ios.needsBar ? [barQuestion(ctx, ios.bar)] : []));
    pending.hidden = !blocked;
    actions.replaceChildren(
      ios.active
        ? button(m.ios.hideArrow, () => ctx.controller.setArrow(false), { variant: "secondary" })
        : button(m.ios.start, start, { disabled: blocked }),
      button(m.common.done, () => ctx.controller.markInstalled(), { variant: "secondary", icon: "check" }),
    );
    if (ios.active && !wasActive) actions.querySelector("button")?.focus();

    overlays.forEach((o) => o.remove());
    overlays = [];
    if (ios.active) {
      const host = ctx.overlayHost();
      if (ios.spot) overlays.push(arrowOverlay(ctx, ios.spot));
      overlays.push(topHint(ctx, ios));
      overlays.forEach((o) => host.appendChild(o));
    }
  }

  const el = h(
    "section",
    { class: "pia-stack", "aria-labelledby": titleId, "data-guide": guide.key },
    h(
      "div",
      { class: "pia-ios-grid" },
      anim.el,
      h(
        "div",
        { class: "pia-ios-side" },
        h(
          "div",
          { class: "pia-stack-sm" },
          h("h2", { class: "pia-h3", id: titleId }, m.ios.title),
          h("p", { class: "pia-lead" }, m.ios.intro),
        ),
        question,
        actions,
        pending,
        h(
          "ol",
          { class: "pia-list" },
          guide.steps.map((s) => h("li", null, h("b", null, `${s.title}.`), " ", s.text)),
        ),
        helpDetails(ctx, guide.help),
      ),
    ),
  );
  paint(initial);
  return {
    el,
    update: paint,
    destroy() {
      anim.destroy?.();
      overlays.forEach((o) => o.remove());
      overlays = [];
      if (ctx.controller.getState().ios?.active) ctx.controller.setArrow(false);
    },
  };
}
