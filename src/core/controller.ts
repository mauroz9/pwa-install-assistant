/**
 * Headless install assistant: what to show and what is happening, as one state
 * object plus events. No UI; the vanilla UI and the framework wrappers are built
 * on it, and so can yours.
 *
 * ```ts
 * const install = createInstallController({ onEvent: (e) => analytics(e.type) });
 * install.subscribe((state) => render(state));
 * button.onclick = () => install.prompt();
 * ```
 */
import {
  chooseGuide,
  detectDevice,
  readEnv,
  supportsInstallPrompt,
  type DetectEnv,
  type DeviceInfo,
  type GuideKey,
} from "./detect";
import { needsLauncherHint, nextPhase, type PromptEvent, type PromptPhase } from "./machine";
import { canPrompt, onPromptChange, promptInstall, wasInstalledThisVisit, type PromptOutcome } from "./prompt";
import {
  ARROW_SPOTS,
  arrowSpot,
  DEFAULT_SHEET_SIGNAL,
  iosCase,
  needsBarQuestion,
  type ArrowSpot,
  type IosDevice,
  type IosGen,
  type Orientation,
  type SafariBar,
  type SheetSignal,
  type SpotRow,
} from "./spots";
import { hasInstalledRelatedApp, isStandalone } from "./standalone";
import { createMarks, resolveStorage, type StorageOption } from "./storage";
import { assistantKind, isAssistantEnabled, type SupportTable } from "./support";

/**
 * What to show:
 * - `standalone`: this window is the installed app.
 * - `installed`: we know it was installed (this visit or a previous one).
 * - `ios-arrow`: Safari on iPhone/iPad with the arrow assistant.
 * - `guide`: the illustrated step-by-step guide (and, above it, the prompt flow if any).
 * - `in-app`: an in-app browser: open in Safari/Chrome or copy the link.
 * - `open-safari`: iOS older than 16.4 in a browser that is not Safari.
 * - `desktop`: a computer: QR code to open it on the phone.
 * - `unknown`: not recognised: show the device picker.
 */
export type InstallView =
  "standalone" | "installed" | "ios-arrow" | "guide" | "in-app" | "open-safari" | "desktop" | "unknown";

/** The native-dialog flow: the four-step assistant, a plain button, or nothing. */
export type PromptMode = "assistant" | "button" | null;

export interface IosArrowState {
  device: IosDevice;
  gen: IosGen;
  orientation: Orientation;
  /** Toolbar layout the person chose (remembered), if any. */
  bar: SafariBar | null;
  /** Must the toolbar question be answered before the arrow can be placed? */
  needsBar: boolean;
  /** Where the arrow goes; `null` = text only (or the question is pending). */
  spot: ArrowSpot | null;
  /** The arrow and the pinned hint are showing. */
  active: boolean;
  /** The Share sheet looks open (only with a configured `sheetSignal`; otherwise always `false`). */
  sheetOpen: boolean;
}

export interface InstallState {
  device: DeviceInfo;
  /** Guide from detection. */
  detected: GuideKey | null;
  /** Guide in use: the picked one, or the detected one. */
  guide: GuideKey | null;
  /** The guide was picked by hand (or forced with the `guide` option). */
  picked: boolean;
  view: InstallView;
  prompt: PromptMode;
  phase: PromptPhase;
  /** The native dialog can be opened right now. */
  canPrompt: boolean;
  /** Accepted or installed: the prompt flow stays on screen until the end and the guide hides. */
  promptFinishing: boolean;
  standalone: boolean;
  /** Installed mark (remembered). */
  installed: boolean;
  /** The guide has been seen to its last step (remembered). */
  guideSeen: boolean;
  ios: IosArrowState | null;
  /** When the modal/sheet was last closed by the person (epoch ms), or `null`. */
  dismissedAt: number | null;
}

export type InstallEvent =
  | { type: "detected"; device: DeviceInfo; guide: GuideKey | null }
  | { type: "prompt-available" }
  | { type: "prompt" }
  | { type: "accepted" }
  | { type: "dismissed" }
  | { type: "installed"; source: "appinstalled" | "related-apps" | "manual" }
  | { type: "opened-standalone" }
  | { type: "guide-picked"; guide: GuideKey | null }
  | { type: "bar-chosen"; bar: SafariBar | null }
  | { type: "arrow-start" }
  | { type: "arrow-stop" }
  | { type: "sheet"; open: boolean }
  // Emitted by the UI:
  | { type: "shown" }
  | { type: "hidden" }
  | { type: "closed" }
  | { type: "step"; index: number; total: number }
  | { type: "link-copied" }
  | { type: "open-in-browser"; browser: string };

export type InstallEventType = InstallEvent["type"];

export interface ControllerOptions {
  /** Override detection inputs (e.g. to simulate a device). Merged over `navigator`. */
  env?: Partial<DetectEnv>;
  /** Skip detection entirely. */
  device?: DeviceInfo;
  /** Start with this guide, as if picked. */
  guide?: GuideKey | null;
  /** Override the table of assisted flows (merged over `DEFAULT_SUPPORT`). */
  support?: SupportTable;
  /** Override the arrow positions. */
  spots?: readonly SpotRow[];
  /** Event that reveals Safari's Share sheet, once one is verified. Default `null` (none). */
  sheetSignal?: SheetSignal | null;
  storage?: StorageOption;
  /** Prefix of the storage keys. Default `pwa-install`. */
  storageKey?: string;
  /** Turn every implemented assisted flow on, to test on a device. */
  force?: boolean;
  onEvent?: (event: InstallEvent) => void;
}

export interface InstallController {
  getState(): InstallState;
  /** Called with the new state on every change. Returns the unsubscribe function. */
  subscribe(listener: (state: InstallState) => void): () => void;
  /** Opens the native dialog (from a click). */
  prompt(): Promise<PromptOutcome>;
  /** Use another guide (`null` = back to the detected one). */
  pick(guide: GuideKey | null): void;
  setSafariBar(bar: SafariBar | null): void;
  /** Show (or hide) the arrow and the pinned hint. */
  setArrow(active: boolean): void;
  /** "I have added it" (or `false`: "show me the guide again"). */
  markInstalled(value?: boolean): void;
  markGuideSeen(): void;
  /** Remember that the person closed the assistant. */
  dismiss(): void;
  /** Was it closed less than `days` ago? (`Infinity` = ever.) */
  isDismissed(days?: number): boolean;
  /** For the UI: report an event through `onEvent` and to `on()` listeners. */
  emit(event: InstallEvent): void;
  /** Listen to events (all, or one type). */
  on<T extends InstallEventType>(
    type: T | "*",
    listener: (event: Extract<InstallEvent, { type: T }>) => void,
  ): () => void;
  destroy(): void;
}

function media(query: string): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
}

export function createInstallController(options: ControllerOptions = {}): InstallController {
  const marks = createMarks(resolveStorage(options.storage), options.storageKey);
  const device = options.device ?? detectDevice({ ...readEnv(), ...options.env });
  const detected = chooseGuide(device);
  const spots = options.spots ?? ARROW_SPOTS;
  const sheetSignal = options.sheetSignal === undefined ? DEFAULT_SHEET_SIGNAL : options.sheetSignal;

  let picked: GuideKey | null = options.guide ?? null;
  let phase: PromptPhase = wasInstalledThisVisit() ? "installed" : "ready";
  let standalone = isStandalone();
  let arrowActive = false;
  let sheetOpen = false;
  let destroyed = false;
  const cleanups: (() => void)[] = [];
  const listeners = new Set<(state: InstallState) => void>();
  const eventListeners = new Set<{ type: string; fn: (event: InstallEvent) => void }>();

  const landscape = media("(orientation: landscape)");

  function compute(): InstallState {
    const guide = picked ?? detected;
    const isPicked = picked !== null;
    const native = canPrompt();
    const supports = supportsInstallPrompt(device) && (!isPicked || guide?.startsWith("android-") === true);
    const enabled = (key: GuideKey | null) =>
      isAssistantEnabled(key, {
        support: options.support,
        force: options.force,
        // A picked iOS guide on another device has no version to check.
        iosVersion: isPicked ? null : device.iosVersion,
      });
    const kind = enabled(guide) ? assistantKind(guide) : null;
    const promptFlow = kind === "prompt" && ((native && supports) || phase !== "ready");
    const prompt: PromptMode = promptFlow ? "assistant" : native && supports ? "button" : null;
    const promptFinishing = promptFlow && needsLauncherHint(phase);
    const installed = marks.flag("installed");

    let ios: IosArrowState | null = null;
    const iosKey = kind === "ios-arrow" ? iosCase(guide) : null;
    if (iosKey) {
      const orientation: Orientation = landscape?.matches ? "landscape" : "portrait";
      const bar = marks.safariBar();
      const needsBar = needsBarQuestion({ ...iosKey, orientation }, spots);
      ios = {
        ...iosKey,
        orientation,
        bar,
        needsBar,
        spot: arrowSpot({ ...iosKey, orientation, bar }, spots),
        active: arrowActive,
        sheetOpen,
      };
    }

    let view: InstallView;
    if (standalone) view = "standalone";
    else if (installed && !isPicked && !promptFinishing) view = "installed";
    else if (guide === null) view = "unknown";
    else if (guide === "in-app") view = "in-app";
    else if (guide === "ios-open-safari") view = "open-safari";
    else if (guide === "desktop") view = "desktop";
    else if (ios) view = "ios-arrow";
    else view = "guide";

    return {
      device,
      detected,
      guide,
      picked: isPicked,
      view,
      prompt,
      phase,
      canPrompt: native,
      promptFinishing,
      standalone,
      installed,
      guideSeen: marks.flag("guideSeen"),
      ios,
      dismissedAt: marks.dismissedAt(),
    };
  }

  let state = compute();

  function update() {
    if (destroyed) return;
    state = compute();
    listeners.forEach((listener) => listener(state));
  }

  function emit(event: InstallEvent) {
    if (destroyed) return;
    try {
      options.onEvent?.(event);
    } catch {
      /* a failing analytics hook must not break the assistant */
    }
    eventListeners.forEach(({ type, fn }) => {
      if (type === "*" || type === event.type) fn(event);
    });
  }

  function advance(event: PromptEvent) {
    phase = nextPhase(phase, event);
  }

  function setInstalled(source: "appinstalled" | "related-apps" | "manual") {
    const was = marks.flag("installed");
    marks.setFlag("installed", true);
    if (!was || source === "appinstalled") emit({ type: "installed", source });
  }

  // —— Browser wiring (none of it runs on a server) ——
  if (typeof window !== "undefined") {
    let couldPrompt = canPrompt();
    cleanups.push(
      onPromptChange(() => {
        const now = canPrompt();
        if (wasInstalledThisVisit() && phase !== "installed") {
          advance("appinstalled");
          setInstalled("appinstalled");
        }
        if (now && !couldPrompt) emit({ type: "prompt-available" });
        couldPrompt = now;
        update();
      }),
    );

    const onMedia = () => {
      const was = standalone;
      standalone = isStandalone();
      if (standalone && !was) emit({ type: "opened-standalone" });
      update();
    };
    for (const query of ["(display-mode: standalone)", "(display-mode: minimal-ui)", "(orientation: landscape)"]) {
      const list = media(query);
      if (list && typeof list.addEventListener === "function") {
        list.addEventListener("change", onMedia);
        cleanups.push(() => list.removeEventListener("change", onMedia));
      }
    }

    const onStorage = () => update();
    window.addEventListener("storage", onStorage);
    cleanups.push(() => window.removeEventListener("storage", onStorage));

    void hasInstalledRelatedApp().then((yes) => {
      if (yes && !destroyed) {
        setInstalled("related-apps");
        update();
      }
    });
  }

  function watchSheet(): () => void {
    if (!sheetSignal || typeof window === "undefined") return () => {};
    const read = () => {
      const open =
        sheetSignal === "blur"
          ? !document.hasFocus()
          : sheetSignal === "visibilitychange"
            ? document.visibilityState === "hidden"
            : (window.visualViewport?.height ?? window.innerHeight) < window.innerHeight * 0.8;
      if (open !== sheetOpen) {
        sheetOpen = open;
        emit({ type: "sheet", open });
        update();
      }
    };
    const target: EventTarget =
      sheetSignal === "visualViewport" ? (window.visualViewport ?? window) : sheetSignal === "blur" ? window : document;
    const names =
      sheetSignal === "blur"
        ? ["blur", "focus"]
        : sheetSignal === "visibilitychange"
          ? ["visibilitychange"]
          : ["resize"];
    names.forEach((name) => target.addEventListener(name, read));
    return () => names.forEach((name) => target.removeEventListener(name, read));
  }
  let unwatchSheet: () => void = () => {};

  const controller: InstallController = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async prompt() {
      if (!canPrompt()) return "unavailable";
      advance("open");
      emit({ type: "prompt" });
      update();
      const outcome = await promptInstall();
      if (outcome === "unavailable") {
        // The browser refused to open it: counts as dismissed (the menu guide remains).
        advance("dismissed");
        emit({ type: "dismissed" });
      } else {
        advance(outcome);
        emit({ type: outcome });
        if (outcome === "accepted") marks.setFlag("installed", true);
      }
      update();
      return outcome;
    },
    pick(guide) {
      picked = guide;
      arrowActive = false;
      unwatchSheet();
      emit({ type: "guide-picked", guide });
      update();
    },
    setSafariBar(bar) {
      marks.setSafariBar(bar);
      emit({ type: "bar-chosen", bar });
      update();
    },
    setArrow(active) {
      if (active === arrowActive) return;
      arrowActive = active;
      unwatchSheet();
      sheetOpen = false;
      if (active) {
        marks.setFlag("guideSeen", true);
        unwatchSheet = watchSheet();
      }
      emit({ type: active ? "arrow-start" : "arrow-stop" });
      update();
    },
    markInstalled(value = true) {
      if (value) setInstalled("manual");
      else {
        marks.setFlag("installed", false);
        picked = null;
      }
      update();
    },
    markGuideSeen() {
      if (marks.flag("guideSeen")) return;
      marks.setFlag("guideSeen", true);
      update();
    },
    dismiss() {
      marks.setDismissedAt(Date.now());
      update();
    },
    isDismissed(days = Infinity) {
      const at = marks.dismissedAt();
      if (at === null) return false;
      return Date.now() - at < days * 86_400_000;
    },
    emit,
    on(type, listener) {
      const entry = { type, fn: listener as (event: InstallEvent) => void };
      eventListeners.add(entry);
      return () => eventListeners.delete(entry);
    },
    destroy() {
      unwatchSheet();
      cleanups.forEach((cleanup) => cleanup());
      listeners.clear();
      eventListeners.clear();
      destroyed = true;
    },
  };

  emit({ type: "detected", device, guide: state.guide });
  if (standalone) emit({ type: "opened-standalone" });
  return controller;
}
