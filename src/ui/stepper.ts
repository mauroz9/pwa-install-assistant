import type { InstallState } from "../core/controller";
import type { UiContext, Part } from "./context";
import { h } from "./dom";
import type { Guide } from "./guides";
import { fill } from "./i18n";
import { icon } from "./icons";
import { allStepsDetails, button, helpDetails } from "./parts";
import { renderScene } from "./scene";

/**
 * Step-by-step guide: numbered chips (done, now, to do), the illustration
 * with its arrow and the full text of every step. Moving to a step moves the
 * focus to its title and announces «Step n of N».
 */
export function stepper(ctx: UiContext, guide: Guide): Part {
  let index = 0;
  const total = guide.steps.length;
  const chips = h("ol", { class: "pia-chips", "aria-label": ctx.m.common.steps });
  const counter = h("p", { class: "pia-eyebrow", "aria-live": "polite" });
  const title = h("h3", { class: "pia-h3", tabindex: "-1" });
  const text = h("p", { class: "pia-p" });
  const figure = h("div", { class: "pia-step-figure" });
  const nav = h("div", { class: "pia-row" });

  function go(next: number, focus = true) {
    index = Math.max(0, Math.min(total - 1, next));
    paint();
    ctx.controller.emit({ type: "step", index, total });
    if (index === total - 1) ctx.controller.markGuideSeen();
    if (focus) requestAnimationFrame(() => title.focus());
  }

  function paint() {
    const step = guide.steps[index];
    chips.replaceChildren(
      ...guide.steps.map((s, i) => {
        const state = i < index ? "done" : i === index ? "now" : "todo";
        return h(
          "li",
          null,
          h(
            "button",
            {
              type: "button",
              class: "pia-chip",
              "data-state": state,
              "aria-current": i === index ? "step" : null,
              "aria-label":
                fill(ctx.m.common.stepLabel, { n: i + 1, title: s.title }) +
                (state === "done" ? ctx.m.common.stepDone : ""),
              onclick: () => go(i),
            },
            state === "done" ? icon("check") : String(i + 1),
          ),
        );
      }),
    );
    counter.textContent = fill(ctx.m.common.stepOf, { n: index + 1, total });
    title.textContent = step.title;
    text.textContent = step.text;
    const scene = renderScene(step, ctx.scene, ctx.illustrations);
    scene.classList.add("pia-scene-in");
    figure.replaceChildren(scene);
    nav.replaceChildren(
      index > 0 ? button(ctx.m.common.previous, () => go(index - 1), { variant: "secondary" }) : "",
      index === total - 1
        ? button(ctx.m.common.done, () => ctx.controller.markInstalled(), { icon: "check" })
        : button(ctx.m.common.next, () => go(index + 1)),
    );
  }

  paint();
  const el = h(
    "section",
    { class: "pia-stack", "data-guide": guide.key },
    chips,
    h(
      "div",
      { class: "pia-step" },
      h("div", { class: "pia-step-text" }, counter, title, text),
      figure,
      h("div", { class: "pia-step-controls" }, nav, helpDetails(ctx, guide.help)),
    ),
    allStepsDetails(ctx, guide.steps),
  );
  return {
    el,
    update(_state: InstallState) {
      /* the guide itself does not depend on the state */
    },
  };
}
