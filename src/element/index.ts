import type { InstallEvent } from "../core/controller";
import {
  createInstallAssistant,
  type AssistantMode,
  type InstallAssistant,
  type InstallAssistantOptions,
} from "../ui/assistant";

export type * from "../core/controller";
export type { InstallAssistantOptions, Theme, Trigger } from "../ui/assistant";

/**
 * `<pwa-install-assistant>` custom element. Works in plain HTML, Angular,
 * Astro, Lit, Rails, WordPress…
 *
 * ```html
 * <pwa-install-assistant app-name="Acme" icon="/icon-192.png" locale="es"></pwa-install-assistant>
 * <script type="module">import "pwa-install-assistant/element";</script>
 * ```
 *
 * Attributes: `app-name`, `app-url`, `open-url`, `icon`, `locale`, `mode`
 * (`inline`/`modal`/`sheet`), `trigger` (`load`/`gesture`/`manual` or a number of ms),
 * `accent`, `scheme`, `nonce`, `debug`. Property `options` takes any other option.
 * Methods `open()` and `close()`. Every assistant event is dispatched as
 * `pwa-install` (`event.detail` is the event; it bubbles).
 *
 * Light DOM on purpose (no shadow root): the `--pia-*` variables and your CSS
 * reach it normally, and the CSP nonce works as in the rest of the page.
 */
// Importable on a server (SSR) without crashing: there is no HTMLElement there.
const Base = (typeof HTMLElement !== "undefined" ? HTMLElement : class {}) as typeof HTMLElement;

const ATTRIBUTES = [
  "app-name",
  "app-url",
  "open-url",
  "icon",
  "locale",
  "mode",
  "trigger",
  "accent",
  "scheme",
  "nonce",
  "debug",
] as const;

export class PwaInstallAssistantElement extends Base {
  static observedAttributes = [...ATTRIBUTES];

  private assistant: InstallAssistant | null = null;
  private _options: InstallAssistantOptions = {};

  /** Any option of `createInstallAssistant`; attributes win over it. */
  get options(): InstallAssistantOptions {
    return this._options;
  }
  set options(value: InstallAssistantOptions) {
    this._options = value ?? {};
    this.rebuild();
  }

  /** The vanilla instance (state, controller), once connected. */
  get instance(): InstallAssistant | null {
    return this.assistant;
  }

  open() {
    this.assistant?.open();
  }
  close() {
    this.assistant?.close();
  }

  connectedCallback() {
    if (!this.assistant) this.rebuild();
  }

  disconnectedCallback() {
    this.assistant?.destroy();
    this.assistant = null;
  }

  attributeChangedCallback() {
    if (this.assistant) this.rebuild();
  }

  private read(): InstallAssistantOptions {
    const attr = (name: string) => this.getAttribute(name) ?? undefined;
    const trigger = attr("trigger");
    const accent = attr("accent");
    const scheme = attr("scheme") as "light" | "dark" | "auto" | undefined;
    const own: InstallAssistantOptions = {
      appName: attr("app-name"),
      appUrl: attr("app-url"),
      openUrl: attr("open-url"),
      icon: attr("icon"),
      locale: attr("locale"),
      mode: attr("mode") as AssistantMode | undefined,
      trigger:
        trigger === undefined
          ? undefined
          : /^\d+$/.test(trigger)
            ? { delay: Number(trigger) }
            : (trigger as "load" | "gesture" | "manual"),
      nonce: attr("nonce"),
      debug: this.hasAttribute("debug") || undefined,
      theme:
        accent || scheme
          ? {
              ...this._options.theme,
              accent: accent ?? this._options.theme?.accent,
              scheme: scheme ?? this._options.theme?.scheme,
            }
          : undefined,
    };
    const defined = Object.fromEntries(Object.entries(own).filter(([, v]) => v !== undefined));
    return {
      ...this._options,
      ...defined,
      onEvent: (event: InstallEvent) => {
        this._options.onEvent?.(event);
        this.dispatchEvent(new CustomEvent("pwa-install", { detail: event, bubbles: true }));
      },
    };
  }

  private rebuild() {
    if (!this.isConnected) return;
    this.assistant?.destroy();
    if (!this.style.display) this.style.display = "block";
    this.assistant = createInstallAssistant(this, this.read());
  }
}

/** Register the element (done automatically on import, when possible). */
export function definePwaInstallAssistant(tag = "pwa-install-assistant") {
  if (typeof customElements === "undefined" || customElements.get(tag)) return;
  customElements.define(tag, class extends PwaInstallAssistantElement {});
}

definePwaInstallAssistant();

declare global {
  interface HTMLElementTagNameMap {
    "pwa-install-assistant": PwaInstallAssistantElement;
  }
}
