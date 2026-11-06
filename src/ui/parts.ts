import type { GuideKey } from "../core/detect";
import type { InstallState } from "../core/controller";
import type { UiContext } from "./context";
import { h, uid, type Child } from "./dom";
import { buildGuide, hasSteps, PICKER_GROUPS } from "./guides";
import { fill } from "./i18n";
import { icon, type IconName } from "./icons";

export function button(
  label: Child,
  onClick: () => void,
  options: {
    variant?: "primary" | "secondary";
    icon?: IconName;
    size?: "sm";
    className?: string;
    disabled?: boolean;
  } = {},
): HTMLButtonElement {
  const cls = [
    "pia-btn",
    options.variant === "secondary" ? "pia-btn-secondary" : "",
    options.size === "sm" ? "pia-btn-sm" : "",
    options.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return h(
    "button",
    { type: "button", class: cls, onclick: onClick, disabled: options.disabled },
    options.icon ? icon(options.icon) : null,
    label,
  );
}

export function linkButton(label: Child, href: string, options: { icon?: IconName; variant?: "secondary" } = {}) {
  return h(
    "a",
    { class: `pia-btn${options.variant === "secondary" ? " pia-btn-secondary" : ""}`, href },
    options.icon ? icon(options.icon) : null,
    label,
  );
}

/** «I can't see this option»: the guide's tips and a link to the picker. */
export function helpDetails(ctx: UiContext, tips: string[]): HTMLDetailsElement {
  return h(
    "details",
    { class: "pia-details" },
    h("summary", null, icon("help"), ctx.m.common.notSeeing),
    h(
      "div",
      { class: "pia-details-body" },
      tips.length
        ? h(
            "ul",
            { class: "pia-list" },
            tips.map((tip) => h("li", null, tip)),
          )
        : null,
      h("button", { type: "button", class: "pia-link", onclick: () => ctx.focusPicker() }, ctx.m.common.pickOther),
    ),
  );
}

/** «See every step as text». */
export function allStepsDetails(ctx: UiContext, steps: { title: string; text: string }[]): HTMLDetailsElement {
  return h(
    "details",
    { class: "pia-details" },
    h("summary", null, ctx.m.common.allSteps),
    h(
      "div",
      { class: "pia-details-body" },
      h(
        "ol",
        { class: "pia-list" },
        steps.map((s) => h("li", null, h("b", null, `${s.title}.`), " ", s.text)),
      ),
    ),
  );
}

/** Label of a guide in the «Looks like you're using …» line. */
export function guideLabel(ctx: UiContext, key: GuideKey, appName: string | null): string {
  const d = ctx.m.detected;
  if (key === "in-app") return appName ? fill(d.inApp, { name: appName }) : d.inAppUnknown;
  if (key === "desktop") return d.desktop;
  if (key === "ios-open-safari") return d.openSafari;
  return hasSteps(key) ? buildGuide(key, ctx.m, ctx.app).label : key;
}

export function detectedLine(ctx: UiContext, state: InstallState): HTMLElement | null {
  if (!state.guide) return null;
  const d = ctx.m.detected;
  return h(
    "p",
    { class: "pia-p" },
    `${state.picked ? d.picked : d.looksLike}: `,
    h("b", null, guideLabel(ctx, state.guide, state.picked ? null : (state.device.inApp?.name ?? null))),
    ". ",
    h("button", { type: "button", class: "pia-link", onclick: () => ctx.focusPicker() }, d.notRight),
  );
}

/** «Already added it?» notice, once the guide has been seen. */
export function seenNotice(ctx: UiContext): HTMLElement {
  return h(
    "div",
    { class: "pia-notice", role: "note" },
    h("p", null, fill(ctx.m.common.addedQuestion, { app: ctx.app })),
    button(ctx.m.common.haveIt, () => ctx.controller.markInstalled(), { variant: "secondary", size: "sm" }),
  );
}

export function installedCard(ctx: UiContext, state: InstallState): HTMLElement {
  const i = ctx.m.installed;
  const standalone = state.view === "standalone";
  return h(
    "div",
    { class: "pia-card pia-stack-sm", role: "status" },
    h("h2", { class: "pia-h2" }, standalone ? i.standaloneTitle : fill(i.title, { app: ctx.app })),
    h("p", { class: "pia-lead" }, standalone ? i.standaloneText : i.text),
    h(
      "div",
      { class: "pia-row" },
      standalone ? null : linkButton(fill(ctx.m.common.openApp, { app: ctx.app }), ctx.openUrl),
      standalone
        ? null
        : button(ctx.m.common.seeGuideAgain, () => ctx.controller.markInstalled(false), { variant: "secondary" }),
    ),
  );
}

/** «Using another device or browser?» */
export function picker(ctx: UiContext, state: InstallState): { el: HTMLElement; select: HTMLSelectElement } {
  const p = ctx.m.picker;
  const id = uid("pia-picker");
  const select = h(
    "select",
    {
      id,
      class: "pia-select",
      onchange: (event: Event) => {
        const value = (event.target as HTMLSelectElement).value as GuideKey;
        if (value) ctx.controller.pick(value);
      },
    },
    h("option", { value: "", disabled: true }, p.placeholder),
    PICKER_GROUPS.map(({ group, keys }) =>
      h(
        "optgroup",
        { label: p.groups[group] },
        keys.map((key) =>
          h(
            "option",
            { value: key },
            group === "other"
              ? p.options[key as keyof typeof p.options]
              : fill(p.with, { group: p.groups[group], browser: p.options[key as keyof typeof p.options] }),
          ),
        ),
      ),
    ),
  );
  const current = state.guide && state.guide !== "ios-open-safari" ? state.guide : "";
  select.value = current;
  const el = h(
    "div",
    { class: `pia-card pia-stack-sm${state.guide ? "" : " pia-card-accent"}` },
    h("label", { class: "pia-label", for: id }, p.label),
    h("p", { class: "pia-p" }, p.help),
    select,
  );
  return { el, select };
}
