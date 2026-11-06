import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import { createInstallController, type ControllerOptions, type InstallState } from "../core/controller";
import {
  createInstallAssistant,
  type InstallAssistant as AssistantInstance,
  type InstallAssistantOptions,
} from "../ui/assistant";

export type * from "../core/controller";
export type {
  InstallAssistant as InstallAssistantInstance,
  InstallAssistantOptions,
  Theme,
  Trigger,
} from "../ui/assistant";

export interface InstallAssistantProps extends InstallAssistantOptions {
  className?: string;
  style?: CSSProperties;
}

/** Options whose change needs a fresh assistant (they decide the container or the detection). */
const STRUCTURAL = [
  "mode",
  "env",
  "device",
  "storage",
  "storageKey",
  "support",
  "spots",
  "sheetSignal",
  "debug",
  "nonce",
  "injectStyles",
] as const;

/**
 * The install assistant for React and Next.js.
 *
 * ```tsx
 * <InstallAssistant appName="Acme" icon="/icon-192.png" />
 * <InstallAssistant mode="sheet" trigger="load" ref={ref} />   // ref.current.open()
 * ```
 *
 * SSR-safe: nothing touches the DOM until it mounts, and the entry is a client
 * component (`"use client"` is built in). Callbacks can change on every render.
 */
export const InstallAssistant = forwardRef<AssistantInstance | null, InstallAssistantProps>(function InstallAssistant(
  { className, style, ...options },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<AssistantInstance | null>(null);
  const latest = useRef(options);
  latest.current = options;

  useImperativeHandle(ref, () => instance.current as AssistantInstance, [instance.current]);

  const structuralKey = JSON.stringify(STRUCTURAL.map((k) => (typeof options[k] === "function" ? "fn" : options[k])));
  useEffect(() => {
    const assistant = createInstallAssistant(host.current, {
      ...latest.current,
      // Through a ref, so a new arrow function on every render rebuilds nothing.
      onEvent: (event) => latest.current.onEvent?.(event),
      when: latest.current.when ? (state) => latest.current.when!(state) : undefined,
    });
    instance.current = assistant;
    return () => {
      assistant.destroy();
      instance.current = null;
    };
  }, [structuralKey]);

  const { appName, appUrl, openUrl, icon, locale, locales, messages, theme, arrow, steps, qr } = options;
  const contentKey = JSON.stringify({
    appName,
    appUrl,
    openUrl,
    icon,
    locale,
    messages,
    theme,
    arrowSize: arrow?.size,
    arrowColor: arrow?.color,
  });
  useEffect(() => {
    instance.current?.update({ appName, appUrl, openUrl, icon, locale, locales, messages, theme, arrow, steps, qr });
  }, [contentKey, locales, steps, qr, arrow?.render]);

  return createElement("div", { ref: host, className, style });
});

const SERVER_STATE = null;

/**
 * Headless: the install state, to draw your own UI. `null` on the server and
 * during hydration. Pass stable options (they are read once).
 *
 * ```tsx
 * const install = useInstallState();
 * if (install?.state.prompt) return <button onClick={install.controller.prompt}>Install</button>;
 * ```
 */
export function useInstallState(options: ControllerOptions = {}) {
  const store = useRef<{
    controller: ReturnType<typeof createInstallController>;
    snapshot: { state: InstallState; controller: ReturnType<typeof createInstallController> };
  } | null>(null);
  const subscribe = (notify: () => void) => {
    store.current ??= init();
    const off = store.current.controller.subscribe((state) => {
      store.current!.snapshot = { state, controller: store.current!.controller };
      notify();
    });
    return () => {
      off();
    };
  };
  function init() {
    const controller = createInstallController(options);
    return { controller, snapshot: { state: controller.getState(), controller } };
  }
  useEffect(
    () => () => {
      store.current?.controller.destroy();
      store.current = null;
    },
    [],
  );
  return useSyncExternalStore(
    subscribe,
    () => (store.current ??= init()).snapshot,
    () => SERVER_STATE,
  );
}
