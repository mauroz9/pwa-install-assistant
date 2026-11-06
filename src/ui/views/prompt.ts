/**
 * Chromium on Android with `beforeinstallprompt`: our button opens the
 * browser's own dialog and the four steps move on by themselves with
 * `userChoice` and `appinstalled`. The instructions are always text; the
 * arrow only helps.
 */
import type { InstallState } from "../../core/controller";
import { promptStep, type PromptPhase } from "../../core/machine";
import type { Part, UiContext } from "../context";
import { h, uid } from "../dom";
import { fill, type Messages } from "../i18n";
import { icon } from "../icons";
import { button, linkButton } from "../parts";

/** Status line for each phase. */
export function promptStatus(m: Messages, app: string, phase: PromptPhase, canPrompt: boolean): string {
  const s = m.prompt.status;
  const hint = m.prompt.launcherHint;
  switch (phase) {
    case "ready":
      return fill(s.ready, { app });
    case "prompting":
      return s.prompting;
    case "accepted":
      return fill(s.accepted, { hint });
    case "dismissed":
      return canPrompt ? s.dismissed : s.dismissedNoRetry;
    case "installed":
      return fill(s.installed, { hint });
  }
}

function appIcon(ctx: UiContext): HTMLElement {
  return ctx.scene.iconUrl
    ? h("img", { class: "pia-app-icon pia-pop", src: ctx.scene.iconUrl, alt: "", width: 72, height: 72 })
    : h(
        "span",
        { class: "pia-app-icon pia-app-icon-letter pia-pop", "aria-hidden": "true" },
        ctx.app.charAt(0).toUpperCase(),
      );
}

/** The four-step assistant. */
export function promptAssistant(ctx: UiContext, initial: InstallState): Part {
  const m = ctx.m;
  const titleId = uid("pia-prompt");
  const title = h("h2", { class: "pia-h2", id: titleId });
  const status = h("p", { class: "pia-lead", role: "status", "aria-live": "polite" });
  const steps = h("ol", { class: "pia-prompt-steps" });
  const action = h("div", { class: "pia-prompt-action" });
  const el = h(
    "section",
    { class: "pia-card pia-card-accent pia-stack", "aria-labelledby": titleId, "data-phase": initial.phase },
    h("div", { class: "pia-stack-sm" }, title, status),
    h("div", { class: "pia-prompt-grid" }, steps, action),
  );
  const install = m.browser.chrome.install;
  let lastPhase: PromptPhase | null = null;
  let lastCan: boolean | null = null;

  function paint(state: InstallState) {
    const { phase, canPrompt } = state;
    if (phase === lastPhase && canPrompt === lastCan) return;
    lastPhase = phase;
    lastCan = canPrompt;
    el.setAttribute("data-phase", phase);
    const done = phase === "installed";
    const current = promptStep(phase);
    title.textContent = done ? fill(m.prompt.doneTitle, { app: ctx.app }) : m.prompt.title;
    status.textContent = promptStatus(m, ctx.app, phase, canPrompt);
    steps.replaceChildren(
      ...m.prompt.steps.map((step, i) => {
        const s = i < current || done ? "done" : i === current ? "now" : "todo";
        return h(
          "li",
          { "data-state": s, "aria-current": s === "now" ? "step" : null },
          h(
            "span",
            { class: "pia-chip pia-chip-sm", "data-state": s, "aria-hidden": "true" },
            s === "done" ? icon("check") : String(i + 1),
          ),
          h(
            "span",
            null,
            h("b", null, fill(step.title, { app: ctx.app, install })),
            h("span", { class: "pia-sr" }, s === "done" ? m.common.stepDone : s === "now" ? m.common.stepNow : ""),
            h("span", null, fill(step.text, { app: ctx.app, install })),
          ),
        );
      }),
    );
    const showButton = (phase === "ready" || phase === "dismissed") && canPrompt;
    action.replaceChildren(
      ...(showButton
        ? [
            h("span", { class: "pia-prompt-pointer", "aria-hidden": "true" }, icon("arrowDown")),
            button(
              phase === "dismissed" ? m.prompt.retry : fill(m.prompt.button, { app: ctx.app }),
              () => void ctx.controller.prompt(),
              {
                icon: "download",
                className: "pia-btn-glow",
              },
            ),
          ]
        : []),
      ...(phase === "prompting" || phase === "accepted"
        ? [
            h(
              "p",
              { class: "pia-busy" },
              h("span", { class: "pia-busy-dot", "aria-hidden": "true" }),
              phase === "prompting" ? m.prompt.waiting : m.prompt.installing,
            ),
          ]
        : []),
      ...(done
        ? [
            h(
              "div",
              { class: "pia-celebrate" },
              appIcon(ctx),
              linkButton(fill(m.common.openApp, { app: ctx.app }), ctx.openUrl),
            ),
          ]
        : []),
    );
  }

  paint(initial);
  return { el, update: paint };
}

/** Browsers whose assistant is not verified yet: a plain button over the menu guide. */
export function promptButton(ctx: UiContext): Part {
  const m = ctx.m;
  return {
    el: h(
      "div",
      { class: "pia-card pia-card-accent pia-row", "data-prompt": "button" },
      h(
        "div",
        { class: "pia-stack-sm" },
        h("h2", { class: "pia-h4" }, m.prompt.title),
        h("p", { class: "pia-p" }, m.prompt.buttonCardText),
      ),
      button(fill(m.prompt.button, { app: ctx.app }), () => void ctx.controller.prompt(), { icon: "download" }),
    ),
  };
}
