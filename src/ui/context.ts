import type { InstallController, InstallState } from "../core/controller";
import type { Messages } from "./i18n";
import type { Illustrations, SceneContext } from "./scene";

/** What every part of the UI needs. */
export interface UiContext {
  m: Messages;
  app: string;
  /** URL to install (QR, copy link, open in browser). */
  url: string;
  /** Where "Open the app" goes. */
  openUrl: string;
  scene: SceneContext;
  illustrations: Illustrations;
  controller: InstallController;
  /** Move focus to the device picker. */
  focusPicker(): void;
  /** Arrow drawing options. */
  arrow: { size: number; color?: string; render?: (el: HTMLElement) => void };
  qr: boolean | ((url: string) => SVGElement);
  /** Fixed overlays (arrow, pinned hint) go here: `document.body`. */
  overlayHost(): HTMLElement;
  /** Modal/sheet: close it without counting as a dismissal (e.g. to show the arrow). */
  hideContainer(): void;
}

/** A piece of UI that can be updated in place, keeping its own state (step index, focus). */
export interface Part {
  el: HTMLElement;
  update?(state: InstallState): void;
  destroy?(): void;
}
