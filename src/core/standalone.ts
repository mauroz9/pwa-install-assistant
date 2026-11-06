/**
 * "Already installed": is this window the installed app, launched from its icon?
 *
 * Reliable, on any page, at any time (client only):
 *   - `display-mode: standalone | minimal-ui | window-controls-overlay` (from the
 *     manifest; Android, iOS 16.4+, desktop). Never `fullscreen`: a normal browser
 *     in full screen (F11, macOS green button) matches it too.
 *   - `navigator.standalone === true` (iOS Safari "Add to Home Screen").
 *   - A `document.referrer` starting with `android-app://` (Trusted Web Activity).
 */

export interface StandaloneEnv {
  matchMedia?: (query: string) => { matches: boolean };
  navigatorStandalone?: boolean;
  referrer?: string;
}

export const STANDALONE_DISPLAY_MODES = ["standalone", "minimal-ui", "window-controls-overlay"] as const;

export function detectStandalone(env: StandaloneEnv): boolean {
  if (env.navigatorStandalone === true) return true;
  if (env.referrer?.startsWith("android-app://")) return true;
  return STANDALONE_DISPLAY_MODES.some((mode) => env.matchMedia?.(`(display-mode: ${mode})`).matches === true);
}

/** Is this window showing as an installed app? `false` on a server. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return detectStandalone({
    matchMedia: typeof window.matchMedia === "function" ? (query) => window.matchMedia(query) : undefined,
    navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
  });
}

/**
 * Chrome on Android (with a WebAPK) can say whether this PWA is installed, when the
 * manifest lists itself in `related_applications` (platform `webapp`). Elsewhere the
 * API does not exist and this resolves `false`. Never throws.
 */
export async function hasInstalledRelatedApp(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
  if (typeof nav.getInstalledRelatedApps !== "function") return false;
  try {
    return (await nav.getInstalledRelatedApps()).length > 0;
  } catch {
    return false;
  }
}
