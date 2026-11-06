/**
 * The browser's own install dialog (`beforeinstallprompt`), Chromium only.
 *
 * Chrome may fire the event before the app has rendered anything (and, on a
 * first visit, only after some interaction and ~30 s on the page), so it is
 * captured as soon as this module is evaluated in a browser, and kept until
 * someone uses it. The event can only be used once; Chrome fires a new one
 * after a dismissal.
 */
import { isStandalone } from "./standalone";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt(): Promise<unknown>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
}

export type PromptOutcome = "accepted" | "dismissed" | "unavailable";

type Listener = () => void;

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let attached = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Starts listening for `beforeinstallprompt` and `appinstalled`. Idempotent and
 * safe on a server. Runs on import; call it from your entry point too if the
 * assistant is loaded late (e.g. lazily), so an early event is not lost.
 */
export function captureInstallPrompt(): void {
  if (attached || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  attached = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the mini-infobar away: the assistant offers its own button.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

captureInstallPrompt();

/** Is the native install dialog available right now? */
export function canPrompt(): boolean {
  captureInstallPrompt();
  return deferred !== null;
}

/** Has `appinstalled` fired during this visit? */
export function wasInstalledThisVisit(): boolean {
  return installed;
}

/** Called whenever `canPrompt()` or `appinstalled` changes. Returns the unsubscribe function. */
export function onPromptChange(listener: Listener): () => void {
  captureInstallPrompt();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Opens the native dialog and resolves with what the person chose, or
 * `"unavailable"` when there is no dialog to open (or the browser refused).
 * Must be called from a user gesture (a click).
 */
export async function promptInstall(): Promise<PromptOutcome> {
  const event = deferred;
  if (!event) return "unavailable";
  // One use per event.
  deferred = null;
  notify();
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  } catch {
    return "unavailable";
  }
}

/**
 * Resolves when the app gets installed (`appinstalled`), or right away if this
 * window already is the installed app. Never rejects; never resolves on a server.
 */
export function whenInstalled(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (installed || isStandalone()) return resolve();
    const off = onPromptChange(() => {
      if (!installed) return;
      off();
      resolve();
    });
  });
}
