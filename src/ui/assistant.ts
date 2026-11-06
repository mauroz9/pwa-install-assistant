/**
 * The install assistant, vanilla. It renders whatever the headless controller
 * says (`view`) and keeps the parts that did not change (step, focus, open
 * <details>) in place.
 *
 * ```ts
 * const assistant = createInstallAssistant(document.querySelector("#install"), { appName: "My app" });
 * assistant.destroy();
 * ```
 */
import {
  createInstallController,
  type ControllerOptions,
  type InstallController,
  type InstallState,
} from "../core/controller";
import type { Part, UiContext } from "./context";
import { clear, h, uid } from "./dom";
import { buildGuide, hasSteps } from "./guides";
import { fill, mergeMessages, resolveLocale, type DeepPartial, type Messages } from "./i18n";
import { icon } from "./icons";
import { detectedLine, installedCard, picker, seenNotice } from "./parts";
import type { Illustrations } from "./scene";
import { stepper } from "./stepper";
import { injectStyles } from "./styles";
import { diagnostics } from "./views/diagnostics";
import { iosAssistant } from "./views/ios";
import { desktopView, inAppView } from "./views/links";
import { promptAssistant, promptButton } from "./views/prompt";

export type AssistantMode = "inline" | "modal" | "sheet";

export interface InstallAssistantOptions extends Omit<ControllerOptions, "force"> {
  /** Shown in the texts and the drawings. Default: `document.title`. */
  appName?: string;
  /** The URL to install: for the QR code, «Copy link» and «Open in Safari/Chrome». Default: this page. */
  appUrl?: string;
  /** Where «Open the app» goes once installed. Default: `appUrl`. */
  openUrl?: string;
  /** App icon (URL), drawn in the illustrations. */
  icon?: string;
  /** Language: a code (`"es"`), a pack from `pwa-install-assistant/locales/*`, or `"auto"` (default). */
  locale?: string | Messages;
  /** Extra packs that `"auto"` and codes can choose from. */
  locales?: Messages[];
  /** Override any text. */
  messages?: DeepPartial<Messages>;
  /** `inline` (default) renders into the element; `modal` and `sheet` open a dialog. */
  mode?: AssistantMode;
  steps?: { illustrations?: Illustrations };
  /** CSP nonce for the injected `<style>`. */
  nonce?: string;
  /** `false`: do not inject CSS (import `pwa-install-assistant/style.css` yourself). */
  injectStyles?: boolean;
  /**
   * Desktop QR code: `true` (default, generated locally and loaded on demand), `false` (link only),
   * or your own `(url) => SVGElement`.
   */
  qr?: boolean | ((url: string) => SVGElement);
  /** Event panel and every implemented assisted flow on, to test on a device. */
  debug?: boolean;
}

export interface InstallAssistant {
  readonly controller: InstallController;
  readonly element: HTMLElement;
  /** Open the modal or sheet (inline: no-op). */
  open(): void;
  close(): void;
  readonly isOpen: boolean;
  /** Change options and render again. */
  update(options: Partial<InstallAssistantOptions>): void;
  destroy(): void;
}

interface Section {
  key: string;
  part: Part | null;
}

function pageUrl(): string {
  return typeof location !== "undefined" ? location.href : "";
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function createInstallAssistant(
  element: HTMLElement | null | undefined,
  initial: InstallAssistantOptions = {},
): InstallAssistant {
  if (typeof document === "undefined") throw new Error("pwa-install-assistant: createInstallAssistant needs a DOM");
  let options = { ...initial };
  const mode: AssistantMode = options.mode ?? "inline";
  const doc = element?.ownerDocument ?? document;
  if (options.injectStyles !== false) injectStyles(doc, options.nonce);

  const controller = createInstallController({ ...options, force: options.debug });

  // —— Container ——
  const content = h("div", { class: "pia-stack" });
  let root: HTMLElement;
  let dialog: HTMLDialogElement | null = null;
  const titleId = uid("pia-title");
  const dialogTitle = h("h2", { class: "pia-h4", id: titleId });
  let programmaticClose = false;
  let returnFocus: HTMLElement | null = null;

  if (mode === "inline") {
    if (!element) throw new Error("pwa-install-assistant: inline mode needs an element");
    root = h("div", { class: "pia" }, content);
    element.appendChild(root);
  } else {
    dialog = h(
      "dialog",
      { class: `pia pia-dialog${mode === "sheet" ? " pia-dialog-sheet" : ""}`, "aria-labelledby": titleId },
      mode === "sheet" ? h("span", { class: "pia-grabber", "aria-hidden": "true" }) : null,
      h(
        "div",
        { class: "pia-dialog-head" },
        dialogTitle,
        h(
          "button",
          { type: "button", class: "pia-icon-btn", "aria-label": "", onclick: () => api.close() },
          icon("close"),
        ),
      ),
      h("div", { class: "pia-dialog-body" }, content),
    );
    dialog.addEventListener("close", () => {
      if (!programmaticClose) {
        controller.dismiss();
        controller.emit({ type: "closed" });
      }
      programmaticClose = false;
      controller.emit({ type: "hidden" });
      returnFocus?.focus?.();
      returnFocus = null;
    });
    // A click on the backdrop (outside the box) closes it, as people expect.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) api.close();
    });
    (element ?? doc.body).appendChild(dialog);
    root = dialog;
  }

  // —— Rendering ——
  let ctx!: UiContext;
  let messages!: Messages;
  let pickerSelect: HTMLSelectElement | null = null;
  const sections: Record<string, Section> = {};
  const order = ["diagnostics", "notice", "detected", "prompt", "orMenu", "main", "picker"] as const;

  function buildContext() {
    messages = mergeMessages(resolveLocale(options.locale, options.locales), options.messages);
    const app = options.appName ?? (doc.title || "App");
    const url = options.appUrl ?? pageUrl();
    const ios = messages.browser.ios;
    root.setAttribute("lang", messages.locale);
    root.setAttribute("dir", messages.dir);
    dialogTitle.textContent = fill(messages.common.title, { app });
    root.querySelector(".pia-dialog-head .pia-icon-btn")?.setAttribute("aria-label", messages.common.close);
    ctx = {
      m: messages,
      app,
      url,
      openUrl: options.openUrl ?? url,
      scene: {
        app,
        host: hostOf(url),
        iconUrl: options.icon,
        labels: {
          cancel: ios.cancel,
          add: ios.add,
          title: ios.addToHomeTitle,
          webApp: ios.openAsWebApp,
          note: ios.confirmNote,
        },
      },
      illustrations: options.steps?.illustrations ?? "default",
      controller,
      focusPicker() {
        pickerSelect?.focus();
        pickerSelect?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      },
      arrow: { size: 44 },
      qr: options.qr ?? true,
      overlayHost: () => doc.body,
      hideContainer() {
        if (dialog?.open) {
          programmaticClose = true;
          dialog.close();
        }
      },
    };
  }

  function keys(state: InstallState): Record<(typeof order)[number], string> {
    const stepGuide = hasSteps(state.guide);
    const guideShown = (state.view === "guide" || state.view === "ios-arrow") && !state.promptFinishing;
    const hidePicker = state.view === "standalone" || state.view === "installed";
    return {
      diagnostics: options.debug ? "on" : "",
      notice: state.guideSeen && !state.picked && stepGuide && guideShown && !state.installed ? "on" : "",
      detected: hidePicker || !state.guide ? "" : `${state.guide}|${state.picked}`,
      prompt: state.prompt && state.view === "guide" ? state.prompt : "",
      orMenu: state.prompt && state.view === "guide" && !state.promptFinishing && hasSteps(state.guide) ? "on" : "",
      main: state.promptFinishing ? "" : `${state.view}|${state.guide}`,
      picker: hidePicker ? "" : `${state.guide ?? ""}`,
    };
  }

  function build(name: (typeof order)[number], state: InstallState): Part | null {
    switch (name) {
      case "diagnostics":
        return diagnostics(ctx);
      case "notice":
        return { el: seenNotice(ctx) };
      case "detected": {
        const el = detectedLine(ctx, state);
        return el ? { el } : null;
      }
      case "prompt":
        return state.prompt === "assistant" ? promptAssistant(ctx, state) : promptButton(ctx);
      case "orMenu":
        return { el: h("h2", { class: "pia-h4" }, messages.common.orFromMenu) };
      case "main":
        return mainView(state);
      case "picker": {
        const { el, select } = picker(ctx, state);
        pickerSelect = select;
        return { el };
      }
    }
  }

  function mainView(state: InstallState): Part | null {
    switch (state.view) {
      case "standalone":
      case "installed":
        return { el: installedCard(ctx, state) };
      case "unknown":
        return { el: h("p", { class: "pia-card pia-p" }, messages.unknown) };
      case "ios-arrow":
        return hasSteps(state.guide) ? iosAssistant(ctx, state, buildGuide(state.guide, messages, ctx.app)) : null;
      case "guide":
        return hasSteps(state.guide) ? stepper(ctx, buildGuide(state.guide, messages, ctx.app)) : null;
      case "in-app":
      case "open-safari":
        return inAppView(ctx, state);
      case "desktop":
        return desktopView(ctx);
    }
  }

  function render(state: InstallState, force = false) {
    const next = keys(state);
    const nodes: HTMLElement[] = [];
    for (const name of order) {
      const section = sections[name];
      if (force || !section || section.key !== next[name]) {
        section?.part?.destroy?.();
        sections[name] = { key: next[name], part: next[name] ? build(name, state) : null };
      } else {
        section.part?.update?.(state);
      }
      const el = sections[name].part?.el;
      if (el) nodes.push(el);
    }
    // Re-append only when the sequence changed, so focus and <details> stay put.
    const current = Array.from(content.children);
    if (current.length !== nodes.length || current.some((el, i) => el !== nodes[i])) content.replaceChildren(...nodes);
  }

  buildContext();
  render(controller.getState());
  const unsubscribe = controller.subscribe((state) => render(state));
  if (mode === "inline") controller.emit({ type: "shown" });

  const api: InstallAssistant = {
    controller,
    element: root,
    open() {
      if (!dialog || dialog.open) return;
      returnFocus = doc.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      controller.emit({ type: "shown" });
    },
    close() {
      if (!dialog?.open) return;
      if (typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        dialog.dispatchEvent(new Event("close"));
      }
    },
    get isOpen() {
      return dialog ? dialog.open : true;
    },
    update(next) {
      options = { ...options, ...next };
      buildContext();
      render(controller.getState(), true);
    },
    destroy() {
      unsubscribe();
      for (const name of order) sections[name]?.part?.destroy?.();
      if (dialog?.open) {
        programmaticClose = true;
        dialog.close();
      }
      controller.destroy();
      clear(content);
      root.remove();
    },
  };
  return api;
}
