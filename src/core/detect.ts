/**
 * Device and browser detection, to pick the right install guide.
 *
 * Pure: it takes the User-Agent and a few capabilities and returns what to
 * show. Capabilities win over the UA, which only picks the drawings and the
 * names of the menus:
 *   - `beforeinstallprompt` (see `prompt.ts`): when it arrives, our own button.
 *   - `isStandalone()` (see `standalone.ts`): we are already inside the app.
 *   - `maxTouchPoints`: iPadOS asks for the desktop site and says it is a Mac.
 *   - `navigator.brave` and Client Hints (`navigator.userAgentData`): Brave and
 *     Edge can carry Chrome's UA on Android.
 *
 * iOS 26 freezes the OS version in the UA ("iPhone OS 18_6") and puts the real
 * one in `Version/26.x`, so the iOS version is the larger of the two.
 */

export type Os = "ios" | "ipados" | "android" | "desktop" | "unknown";

export type Browser =
  "safari" | "chrome" | "edge" | "firefox" | "opera" | "brave" | "samsung" | "duckduckgo" | "vendor" | "other";

export interface InApp {
  /** Visible name of the app ("Instagram"); `null` for an unidentified in-app browser (a WebView). */
  name: string | null;
}

export interface DeviceInfo {
  os: Os;
  browser: Browser;
  /** iOS/iPadOS version as a number (18.5, 26.0); `null` when unknown or not iOS. */
  iosVersion: number | null;
  /** In-app browser of another app (it cannot install web apps). */
  inApp: InApp | null;
}

export interface DetectEnv {
  userAgent: string;
  /** `navigator.maxTouchPoints`: > 1 on an iPad even when the UA says "Macintosh". */
  maxTouchPoints?: number;
  /** `navigator.userAgentData` (Client Hints, Chromium only). */
  uaData?: { mobile?: boolean; platform?: string; brands?: { brand: string }[] } | null;
  /** `"brave" in navigator`. */
  isBrave?: boolean;
}

/** Apps whose in-app browser carries a brand in the UA. Order matters (Messenger before Facebook). */
const IN_APP: [RegExp, string][] = [
  [/FBAN\/Messenger|FB_IAB\/MESSENGER|Orca-Android/i, "Messenger"],
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FB4A|FBIOS/, "Facebook"],
  [/musical_ly|BytedanceWebview|trill_|TikTok/i, "TikTok"],
  [/WhatsApp/i, "WhatsApp"],
  [/Telegram/i, "Telegram"],
  [/LinkedInApp/i, "LinkedIn"],
  [/\bGmail\b|GoogleMail/i, "Gmail"],
  [/\bGSA\//, "Google"],
  [/Twitter|XApp\//, "X"],
  [/Snapchat/i, "Snapchat"],
  [/Pinterest/i, "Pinterest"],
  [/MicroMessenger/i, "WeChat"],
  [/\bLine\//, "LINE"],
  [/Threads|Barcelona \d/, "Threads"],
  [/KAKAOTALK/i, "KakaoTalk"],
  [/\bDiscord\//i, "Discord"],
  [/\bReddit\//i, "Reddit"],
];

/** Vendor (or uncommon) browsers on Android: generic menu guide. */
const ANDROID_VENDOR =
  /MiuiBrowser|HuaweiBrowser|HeyTapBrowser|OppoBrowser|VivoBrowser|UCBrowser|YaBrowser|Opera Mini|PhxBrowser|Silk\//i;

function versionOf(ua: string, pattern: RegExp): number | null {
  const match = ua.match(pattern);
  if (!match) return null;
  return Number(`${match[1]}.${match[2] ?? 0}`);
}

function maxVersion(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

function isApple(os: Os): boolean {
  return os === "ios" || os === "ipados";
}

function detectInApp(ua: string, os: Os): InApp | null {
  for (const [pattern, name] of IN_APP) {
    if (pattern.test(ua)) return { name };
  }
  // Android WebView: "; wv)" in the UA.
  if (os === "android" && /;\s*wv\)/.test(ua)) return { name: null };
  // iOS WKWebView (Gmail, news apps…): no "Safari/" and no browser brand.
  if (isApple(os) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)) {
    return { name: null };
  }
  return null;
}

function detectOs(env: DetectEnv): Os {
  const ua = env.userAgent;
  const platform = env.uaData?.platform?.toLowerCase();
  if (/iPhone|iPod/.test(ua)) return "ios";
  if (/iPad/.test(ua)) return "ipados";
  // iPadOS 13+ asks for the desktop site: a Mac UA, but with a touch screen.
  if (/Macintosh/.test(ua) && (env.maxTouchPoints ?? 0) > 1) return "ipados";
  if (/Android/.test(ua) || platform === "android") return "android";
  if (/Windows NT|Macintosh|CrOS|X11|Linux/.test(ua) || (platform && env.uaData?.mobile === false)) return "desktop";
  return "unknown";
}

function detectBrowser(env: DetectEnv, os: Os): Browser {
  const ua = env.userAgent;
  const brands = (env.uaData?.brands ?? []).map((b) => b.brand);
  if (isApple(os)) {
    if (/CriOS/.test(ua)) return "chrome";
    if (/EdgiOS/.test(ua)) return "edge";
    if (/FxiOS/.test(ua)) return "firefox";
    if (/OPiOS|OPT\//.test(ua)) return "opera";
    if (/\bDdg\//.test(ua)) return "duckduckgo";
    if (/Version\/[\d.]+.*Safari\//.test(ua)) return "safari";
    return "other";
  }
  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/Firefox\/|FxiOS/.test(ua)) return "firefox";
  if (/EdgA?\/|Edge\//.test(ua) || brands.includes("Microsoft Edge")) return "edge";
  if (/OPR\/|Opera/.test(ua) && !/Opera Mini/.test(ua)) return "opera";
  if (/DuckDuckGo\/|\bDdg\//.test(ua)) return "duckduckgo";
  if (ANDROID_VENDOR.test(ua)) return "vendor";
  if (env.isBrave || brands.includes("Brave")) return "brave";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua) && os === "desktop") return "safari";
  return "other";
}

/** Reads the detection inputs from `navigator`. On a server it returns an empty UA. */
export function readEnv(): DetectEnv {
  if (typeof navigator === "undefined") return { userAgent: "" };
  const nav = navigator as Navigator & { userAgentData?: DetectEnv["uaData"]; brave?: unknown };
  return {
    userAgent: nav.userAgent ?? "",
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    uaData: nav.userAgentData ?? null,
    isBrave: "brave" in nav,
  };
}

/**
 * What device and browser this is. Without arguments it reads `navigator`
 * (and returns `os: "unknown"` on a server).
 */
export function detectDevice(env: DetectEnv = readEnv()): DeviceInfo {
  const ua = env.userAgent;
  const os = detectOs(env);
  const browser = detectBrowser(env, os);
  const iosVersion = isApple(os)
    ? maxVersion(
        // A "desktop" iPad says "Mac OS X 10_15_7": that is not the iPadOS version.
        /Macintosh/.test(ua) ? null : versionOf(ua, /OS (\d+)_(\d+)/),
        browser === "safari" ? versionOf(ua, /Version\/(\d+)\.(\d+)/) : null,
      )
    : null;
  return { os, browser, iosVersion, inApp: detectInApp(ua, os) };
}

/** Every guide. Each one has its steps and illustrations in `guides.ts`. */
export const GUIDE_KEYS = [
  "iphone-safari-26",
  "iphone-safari",
  "ipad-safari-26",
  "ipad-safari",
  "ios-chrome",
  "ios-edge",
  "ios-firefox",
  "ios-other",
  "ios-open-safari",
  "android-chrome",
  "android-samsung",
  "android-edge",
  "android-firefox",
  "android-opera",
  "android-brave",
  "android-other",
  "in-app",
  "desktop",
] as const;

export type GuideKey = (typeof GUIDE_KEYS)[number];

export function isGuideKey(value: unknown): value is GuideKey {
  return typeof value === "string" && (GUIDE_KEYS as readonly string[]).includes(value);
}

/** iOS lets browsers other than Safari add to the home screen since 16.4. */
export const IOS_OTHER_BROWSERS_MIN = 16.4;
/** Safari 26 changes the toolbar ("•••") and adds "Open as Web App". */
export const IOS_26 = 26;

/** Which guide to show. `null` when the device is not recognised: show the picker. */
export function chooseGuide(info: DeviceInfo): GuideKey | null {
  if (info.inApp) return "in-app";
  if (isApple(info.os)) {
    const v = info.iosVersion;
    if (info.browser === "safari") {
      const device = info.os === "ipados" ? "ipad" : "iphone";
      // iOS 27 and later keep the 26 guide (closest known design); the arrow
      // stays off for them until measured (see `support.ts`).
      return v !== null && v >= IOS_26 ? `${device}-safari-26` : `${device}-safari`;
    }
    if (v !== null && v < IOS_OTHER_BROWSERS_MIN) return "ios-open-safari";
    if (info.browser === "chrome") return "ios-chrome";
    if (info.browser === "edge") return "ios-edge";
    if (info.browser === "firefox") return "ios-firefox";
    return "ios-other";
  }
  if (info.os === "android") {
    switch (info.browser) {
      case "chrome":
      case "samsung":
      case "edge":
      case "firefox":
      case "opera":
      case "brave":
        return `android-${info.browser}`;
      default:
        return "android-other";
    }
  }
  if (info.os === "desktop") return "desktop";
  return null;
}

/** Can this browser show the native install dialog (`beforeinstallprompt`)? Only Chromium on Android. */
export function supportsInstallPrompt(info: DeviceInfo): boolean {
  return info.os === "android" && !info.inApp && ["chrome", "edge", "opera", "brave", "samsung"].includes(info.browser);
}
