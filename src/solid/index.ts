import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

import { createInstallController, type ControllerOptions } from "../core/controller";
import { createInstallAssistant, type InstallAssistant, type InstallAssistantOptions } from "../ui/assistant";

export type * from "../core/controller";
export type { InstallAssistant, InstallAssistantOptions, Theme, Trigger } from "../ui/assistant";

/**
 * Solid directive (directives only run in the browser, so it is SSR-safe).
 *
 * ```tsx
 * import { installAssistant } from "pwa-install-assistant/solid";
 * false && installAssistant; // keep the import (TypeScript)
 *
 * <div use:installAssistant={{ appName: "Acme", ref: (a) => (assistant = a) }} />
 * ```
 */
export function installAssistant(
  el: HTMLElement,
  options: Accessor<InstallAssistantOptions & { ref?: (assistant: InstallAssistant) => void }>,
): void {
  let assistant: InstallAssistant | null = null;
  let mode: string | undefined;
  createEffect(() => {
    const { ref, ...next } = options() ?? {};
    if (!assistant || next.mode !== mode) {
      assistant?.destroy();
      assistant = createInstallAssistant(el, next);
      mode = next.mode;
      ref?.(assistant);
    } else assistant.update(next);
  });
  onCleanup(() => {
    assistant?.destroy();
    assistant = null;
  });
}

/** Headless: the install state as a signal, plus the controller. Call it inside a component. */
export function createInstallState(options: ControllerOptions = {}) {
  const controller = createInstallController(options);
  const [state, setState] = createSignal(controller.getState(), { equals: false });
  const off = controller.subscribe(setState);
  onCleanup(() => {
    off();
    controller.destroy();
  });
  return { state, controller };
}

declare module "solid-js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      installAssistant: InstallAssistantOptions & { ref?: (assistant: InstallAssistant) => void };
    }
  }
}
