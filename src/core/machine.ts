/**
 * The automatic flow on Chromium for Android. The install dialog is our
 * button, so we know whether it is accepted or dismissed (`userChoice`) and
 * when it is done (`appinstalled`): the steps move on by themselves.
 *
 * - `ready`: the native dialog is available (or nothing has happened yet).
 * - `prompting`: the browser's dialog is open.
 * - `accepted`: accepted; the browser is creating the icon.
 * - `dismissed`: dismissed. Retry when the browser offers the dialog again.
 * - `installed`: `appinstalled`.
 */
export type PromptPhase = "ready" | "prompting" | "accepted" | "dismissed" | "installed";
export type PromptEvent = "open" | "accepted" | "dismissed" | "appinstalled";

export function nextPhase(phase: PromptPhase, event: PromptEvent): PromptPhase {
  // Installing from the browser menu also fires appinstalled: it always wins, and is never undone.
  if (event === "appinstalled") return "installed";
  if (phase === "installed") return phase;
  switch (event) {
    case "open":
      return phase === "ready" || phase === "dismissed" ? "prompting" : phase;
    case "accepted":
      return phase === "prompting" ? "accepted" : phase;
    case "dismissed":
      return phase === "prompting" ? "dismissed" : phase;
  }
}

/** Current step (0-3) of the four of the Android assistant. */
export function promptStep(phase: PromptPhase): number {
  return { ready: 0, dismissed: 0, prompting: 1, accepted: 2, installed: 3 }[phase];
}

/**
 * Should the launcher hint be shown? Verified on the emulator (Chrome 124,
 * Android 15): when Chrome cannot mint a WebAPK it installs a shortcut and the
 * launcher asks to confirm it **after** the page receives `appinstalled`. If
 * that is cancelled no icon is left, so the assistant asks to accept it.
 */
export function needsLauncherHint(phase: PromptPhase): boolean {
  return phase === "accepted" || phase === "installed";
}
