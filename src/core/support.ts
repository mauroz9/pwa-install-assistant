/**
 * Which assisted flow each guide gets. A flow is on only when it has been
 * verified on a simulator, an emulator or a real device (see docs/support.md);
 * everything else falls back to the illustrated guide.
 */
import type { GuideKey } from "./detect";

/**
 * - `prompt`: Chromium on Android. Our button opens the native dialog and the
 *   steps move on by themselves (`userChoice`, `appinstalled`).
 * - `ios-arrow`: Safari on iPhone/iPad. An arrow on the real Share / "•••"
 *   button and a pinned hint with the next steps.
 */
export type AssistantKind = "prompt" | "ios-arrow";

export interface SupportEntry {
  /** Use the assisted flow for this guide. */
  assistant: boolean;
  /**
   * iOS/iPadOS versions it was verified on, `[from, to)`. Outside the range the
   * guide is used. For Safari, whose toolbar changes with every major version.
   */
  ios?: readonly [number, number];
}

export type SupportTable = Partial<Record<GuideKey, boolean | SupportEntry>>;

/**
 * Verified cases (2026-11-05, see docs/support.md):
 * - Chrome on Android: Android emulator (Pixel 7, Chrome 124), real `beforeinstallprompt`.
 * - Safari 26 on iPhone (Compact, Bottom and Top toolbars) and iPad: iOS 26.3 simulator, XCUITest.
 *
 * Off until verified: Edge, Samsung Internet, Opera and Brave on Android (their
 * native button still appears whenever the browser fires `beforeinstallprompt`),
 * Safari 18 and older, and Safari 27.
 */
export const DEFAULT_SUPPORT: Readonly<Record<string, SupportEntry>> = {
  "android-chrome": { assistant: true },
  "android-edge": { assistant: false },
  "android-samsung": { assistant: false },
  "android-opera": { assistant: false },
  "android-brave": { assistant: false },
  "iphone-safari": { assistant: false },
  "ipad-safari": { assistant: false },
  "iphone-safari-26": { assistant: true, ios: [26, 27] },
  "ipad-safari-26": { assistant: true, ios: [26, 27] },
};

const PROMPT_GUIDES: readonly GuideKey[] = [
  "android-chrome",
  "android-edge",
  "android-samsung",
  "android-opera",
  "android-brave",
];

/** The assisted flow a guide would get (whether or not it is turned on). */
export function assistantKind(key: GuideKey | null): AssistantKind | null {
  if (!key) return null;
  if (/^(iphone|ipad)-safari/.test(key)) return "ios-arrow";
  if (PROMPT_GUIDES.includes(key)) return "prompt";
  return null;
}

function entryOf(table: SupportTable, key: GuideKey): SupportEntry | undefined {
  const value = key in table ? table[key] : DEFAULT_SUPPORT[key];
  if (value === undefined) return undefined;
  return typeof value === "boolean" ? { assistant: value } : value;
}

/**
 * Is the assisted flow on for this guide (and this iOS version)?
 * `force` turns every implemented flow on, for testing on a device (`debug`).
 */
export function isAssistantEnabled(
  key: GuideKey | null,
  options: { support?: SupportTable; iosVersion?: number | null; force?: boolean } = {},
): boolean {
  if (!assistantKind(key)) return false;
  if (options.force) return true;
  const entry = entryOf(options.support ?? {}, key!);
  if (!entry?.assistant) return false;
  if (entry.ios && options.iosVersion != null) {
    const [from, to] = entry.ios;
    return options.iosVersion >= from && options.iosVersion < to;
  }
  return true;
}
