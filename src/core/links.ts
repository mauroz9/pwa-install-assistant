/** Leaving an in-app browser for the real one. */
import type { Os } from "./detect";

/** In-app browser on iOS (open in Safari) or Android (open in Chrome)? */
export function externalBrowserName(os: Os): "Safari" | "Chrome" | null {
  if (os === "ios" || os === "ipados") return "Safari";
  if (os === "android") return "Chrome";
  return null;
}

/**
 * Link that leaves an in-app browser.
 * - Android: an `intent://` opens Chrome (or asks which browser to use if it is not installed),
 *   falling back to the URL.
 * - iOS 17+: `x-safari-https://` opens Safari; if the app does not let it through nothing
 *   happens, and «Copy link» plus the menu steps remain.
 * Only http(s) URLs; anything else returns `null`.
 */
export function openInBrowserUrl(url: string, os: Os): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const scheme = parsed.protocol.slice(0, -1);
  const rest = `${parsed.host}${parsed.pathname}${parsed.search}`;
  if (os === "android") {
    return `intent://${rest}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(parsed.href)};end`;
  }
  if (os === "ios" || os === "ipados") return `x-safari-${scheme}://${rest}`;
  return null;
}
