import { UA } from "../../test/fixtures/user-agents";

export type Bar = "compact" | "bottom" | "top";

/** What the demo can simulate. `chrome` is the browser UI drawn around the page (outside the iframe), like on the phone. */
export interface SimDevice {
  id: string;
  label: string;
  group: "iPhone" | "iPad" | "Android" | "Other";
  ua: string;
  touch: number;
  /** Page viewport in CSS px (the iframe), and the browser bars drawn around it. */
  width: number;
  height: number;
  chrome: "safari26" | "safari18" | "ipad" | "chrome-android" | "samsung" | "instagram" | "desktop";
  /** Chromium on Android: the demo can fire a simulated `beforeinstallprompt`. */
  prompt?: boolean;
}

export const DEVICES: SimDevice[] = [
  {
    id: "iphone26",
    label: "iPhone · Safari (iOS 26)",
    group: "iPhone",
    ua: UA.iphoneSafari26_3,
    touch: 5,
    width: 402,
    height: 754,
    chrome: "safari26",
  },
  {
    id: "iphone18",
    label: "iPhone · Safari (iOS 18)",
    group: "iPhone",
    ua: UA.iphoneSafari18,
    touch: 5,
    width: 393,
    height: 659,
    chrome: "safari18",
  },
  {
    id: "iphone-chrome",
    label: "iPhone · Chrome",
    group: "iPhone",
    ua: UA.iosChrome,
    touch: 5,
    width: 393,
    height: 659,
    chrome: "safari18",
  },
  {
    id: "ipad26",
    label: "iPad · Safari (iPadOS 26)",
    group: "iPad",
    ua: UA.macLike26,
    touch: 5,
    width: 820,
    height: 1106,
    chrome: "ipad",
  },
  {
    id: "android-chrome",
    label: "Android · Chrome",
    group: "Android",
    ua: UA.androidChrome,
    touch: 5,
    width: 412,
    height: 775,
    chrome: "chrome-android",
    prompt: true,
  },
  {
    id: "android-samsung",
    label: "Android · Samsung Internet",
    group: "Android",
    ua: UA.samsung,
    touch: 5,
    width: 412,
    height: 775,
    chrome: "samsung",
    prompt: true,
  },
  {
    id: "android-firefox",
    label: "Android · Firefox",
    group: "Android",
    ua: UA.androidFirefox,
    touch: 5,
    width: 412,
    height: 775,
    chrome: "chrome-android",
  },
  {
    id: "instagram",
    label: "Instagram (in-app browser)",
    group: "Other",
    ua: UA.instagramIos,
    touch: 5,
    width: 393,
    height: 700,
    chrome: "instagram",
  },
  {
    id: "desktop",
    label: "Computer",
    group: "Other",
    ua: UA.macChrome,
    touch: 0,
    width: 1024,
    height: 680,
    chrome: "desktop",
  },
];
