/**
 * Step-by-step guides: the text of every step and a description of its
 * illustration. Data only; `scene.ts` draws it.
 *
 * Every step has its full text and an `alt` that describes the illustration:
 * the animated arrow is a help, never the only way to know what to tap.
 */
import type { GuideKey } from "../core/detect";
import { fill, type Messages } from "./i18n";

export type Device = "phone" | "tablet";
export type SceneOs = "ios" | "android";
export type BarIcon =
  "share" | "more" | "kebab" | "menu" | "back" | "forward" | "tabs" | "book" | "plus" | "home" | "sidebar";
export type BarItem = BarIcon | "url";

/** The illustration of a step. */
export type Scene =
  /** The browser with its toolbar(s) and the button to tap. */
  | {
      kind: "browser";
      device: Device;
      os: SceneOs;
      top?: BarItem[];
      bottom?: BarItem[];
      target: { bar: "top" | "bottom"; index: number };
    }
  /** A menu or the Share sheet, with the option to choose. */
  | {
      kind: "sheet";
      device: Device;
      os: SceneOs;
      anchor: "bottom" | "top-right" | "bottom-right" | "bottom-center";
      title?: string;
      /** Share sheet header (app icon and host). */
      header?: boolean;
      items: string[];
      highlight: number;
    }
  /** iOS "Add to Home Screen" screen. */
  | { kind: "ios-confirm"; device: Device; webApp: boolean }
  /** Android confirmation dialog. */
  | { kind: "android-dialog"; title: string; action: string; cancel: string }
  /** The icon on the home screen. */
  | { kind: "home"; device: Device; os: SceneOs };

export interface Step {
  title: string;
  text: string;
  alt: string;
  scene: Scene;
}

export interface Guide {
  key: GuideKey;
  /** Device and browser, as in the picker. */
  label: string;
  steps: Step[];
  /** "I can't see this option" tips. */
  help: string[];
}

/** Guides with steps. `ios-open-safari`, `in-app` and `desktop` have their own screens. */
export const STEP_GUIDES = [
  "iphone-safari-26",
  "iphone-safari",
  "ipad-safari-26",
  "ipad-safari",
  "ios-chrome",
  "ios-edge",
  "ios-firefox",
  "ios-other",
  "android-chrome",
  "android-samsung",
  "android-edge",
  "android-firefox",
  "android-opera",
  "android-brave",
  "android-other",
] as const satisfies readonly GuideKey[];

export type StepGuideKey = (typeof STEP_GUIDES)[number];

export function hasSteps(key: GuideKey | null): key is StepGuideKey {
  return key !== null && (STEP_GUIDES as readonly string[]).includes(key);
}

const SAFARI_BOTTOM: BarItem[] = ["back", "forward", "share", "book", "tabs"];
const SAFARI_26_BOTTOM: BarItem[] = ["back", "url", "more"];
const IPAD_TOP: BarItem[] = ["sidebar", "back", "forward", "url", "share", "plus", "tabs"];
const ANDROID_TOP: BarItem[] = ["home", "url", "tabs", "kebab"];

/** Builds a guide in the language of `m`. `app` is the app name shown in the texts. */
export function buildGuide(key: StepGuideKey, m: Messages, app: string): Guide {
  const ios = m.browser.ios;
  const chrome = m.browser.chrome;
  const sb = m.browser.samsung;
  const s = m.guides.shared;
  const common = {
    app,
    install: chrome.install,
    installApp: chrome.installApp,
    createShortcut: chrome.createShortcut,
    openInChrome: chrome.openInChrome,
    homeScreen: sb.homeScreen,
    addPageTo: sb.addPageTo,
    targets: sb.targets.join(", "),
    share: ios.share,
    viewMore: ios.viewMore,
    openAsWebApp: ios.openAsWebApp,
    editActions: ios.editActions,
    addToHomeTitle: ios.addToHomeTitle,
  };
  // iOS texts quote iOS labels; Android texts quote the browser's own.
  const iosVars = { ...common, addToHome: ios.addToHome, add: ios.add };
  const androidVars = { ...common, addToHome: chrome.addToHome, add: m.browser.other.add };
  const f = (text: string, more: Record<string, string> = {}) => fill(text, { ...androidVars, ...more });
  const fi = (text: string, more: Record<string, string> = {}) => fill(text, { ...iosVars, ...more });

  const iosShareSheet = (device: Device, extra: "" | "more" | "short" = ""): Step => ({
    title: fi(s.shareSheetTitle),
    text:
      fi(s.shareSheetText) +
      (extra === "more" ? fi(s.shareSheetMore) : extra === "short" ? fi(s.shareSheetMoreShort) : ""),
    alt: fi(s.shareSheetAlt),
    scene: {
      kind: "sheet",
      device,
      os: "ios",
      anchor: device === "tablet" ? "top-right" : "bottom",
      header: true,
      items: ios.shareItems,
      highlight: ios.shareItems.indexOf(ios.addToHome),
    },
  });
  const iosShareInMenu = (anchor: "bottom-right" | "bottom-center", menu: string): Step => ({
    title: fi(s.shareInMenuTitle),
    text: fi(s.shareInMenuText, { menu }),
    alt: fi(s.shareInMenuAlt),
    scene: {
      kind: "sheet",
      device: "phone",
      os: "ios",
      anchor,
      items: ios.menuItems,
      highlight: ios.menuItems.indexOf(ios.share),
    },
  });
  const iosConfirm = (device: Device, webApp: boolean): Step =>
    webApp
      ? {
          title: fi(s.confirmWebAppTitle),
          text: fi(s.confirmWebAppText),
          alt: fi(s.confirmWebAppAlt),
          scene: { kind: "ios-confirm", device, webApp: true },
        }
      : {
          title: fi(s.confirmTitle),
          text: fi(s.confirmText),
          alt: fi(s.confirmAlt),
          scene: { kind: "ios-confirm", device, webApp: false },
        };
  const done = (device: Device, os: SceneOs): Step => ({
    title: f(s.doneTitle),
    text: f(s.doneText),
    alt: f(s.doneAlt),
    scene: { kind: "home", device, os },
  });
  const androidMenu = (
    anchor: "top-right" | "bottom-right" | "bottom-center",
    option: string,
    items: string[],
    text: string,
  ): Step => ({
    title: f(s.menuOptionTitle, { option }),
    text: f(text),
    alt: f(s.menuOptionAlt, { option }),
    scene: { kind: "sheet", device: "phone", os: "android", anchor, items, highlight: items.indexOf(option) },
  });
  const androidConfirm = (dialog: string, action: string, cancel = chrome.cancel): Step => ({
    title: f(s.androidConfirmTitle, { action }),
    text: f(s.androidConfirmText, { dialog, action }),
    alt: f(s.androidConfirmAlt, { dialog, action, cancel }),
    scene: { kind: "android-dialog", title: dialog, action, cancel },
  });

  const g = m.guides[key];
  const first = (scene: Scene): Step => ({
    title: fi(g.title),
    text: key.startsWith("android") ? f(g.text) : fi(g.text),
    alt: fi(g.alt),
    scene,
  });
  const helpOf = (...extra: string[]) => [
    ...g.help.map((tip) => (key.startsWith("android") ? f(tip) : fi(tip))),
    ...extra,
  ];

  switch (key) {
    case "iphone-safari":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "ios",
            top: ["url"],
            bottom: SAFARI_BOTTOM,
            target: { bar: "bottom", index: 2 },
          }),
          iosShareSheet("phone"),
          iosConfirm("phone", false),
          done("phone", "ios"),
        ],
        help: helpOf(fi(s.editActions), s.fromOtherApp),
      };
    case "iphone-safari-26":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "ios",
            bottom: SAFARI_26_BOTTOM,
            target: { bar: "bottom", index: 2 },
          }),
          iosShareInMenu("bottom-right", m.guides["iphone-safari-26"].menu),
          iosShareSheet("phone", "more"),
          iosConfirm("phone", true),
          done("phone", "ios"),
        ],
        help: helpOf(fi(s.editActions), s.fromOtherApp),
      };
    case "ipad-safari":
    case "ipad-safari-26":
      return {
        key,
        label: g.label,
        steps: [
          first({ kind: "browser", device: "tablet", os: "ios", top: IPAD_TOP, target: { bar: "top", index: 4 } }),
          iosShareSheet("tablet", key === "ipad-safari-26" ? "short" : ""),
          iosConfirm("tablet", key === "ipad-safari-26"),
          done("tablet", "ios"),
        ],
        help: helpOf(fi(s.editActions), s.fromOtherApp),
      };
    case "ios-chrome":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "ios",
            top: ["url", "share"],
            bottom: ["back", "forward", "plus", "tabs", "more"],
            target: { bar: "top", index: 1 },
          }),
          iosShareSheet("phone", "short"),
          iosConfirm("phone", false),
          done("phone", "ios"),
        ],
        help: helpOf(fi(s.webAppOn), s.openSafari),
      };
    case "ios-edge":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "ios",
            top: ["url"],
            bottom: ["back", "forward", "more", "tabs", "plus"],
            target: { bar: "bottom", index: 2 },
          }),
          iosShareInMenu("bottom-center", m.guides["ios-edge"].menu),
          iosShareSheet("phone", "short"),
          iosConfirm("phone", false),
          done("phone", "ios"),
        ],
        help: helpOf(fi(s.webAppOn), s.openSafari),
      };
    case "ios-firefox":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "ios",
            top: ["url"],
            bottom: ["back", "forward", "plus", "tabs", "menu"],
            target: { bar: "bottom", index: 4 },
          }),
          iosShareInMenu("bottom-right", m.guides["ios-firefox"].menu),
          iosShareSheet("phone", "short"),
          iosConfirm("phone", false),
          done("phone", "ios"),
        ],
        help: helpOf(fi(s.webAppOn), s.openSafari),
      };
    case "ios-other":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "ios",
            top: ["url", "share"],
            bottom: ["back", "forward", "tabs", "more"],
            target: { bar: "top", index: 1 },
          }),
          iosShareSheet("phone"),
          iosConfirm("phone", false),
          done("phone", "ios"),
        ],
        help: helpOf(),
      };
    case "android-chrome": {
      const ga = m.guides["android-chrome"];
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ANDROID_TOP,
            target: { bar: "top", index: 3 },
          }),
          androidMenu("top-right", chrome.installApp, chrome.menuItems, ga.menuText),
          androidConfirm(chrome.dialogTitle, chrome.install),
          done("phone", "android"),
        ],
        help: helpOf(),
      };
    }
    case "android-samsung": {
      const ga = m.guides["android-samsung"];
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ["url"],
            bottom: ["back", "forward", "home", "book", "tabs", "menu"],
            target: { bar: "bottom", index: 5 },
          }),
          androidMenu("bottom-right", sb.addPageTo, sb.menuItems, ga.menuText),
          {
            title: f(ga.targetTitle),
            text: f(ga.targetText),
            alt: f(ga.targetAlt),
            scene: {
              kind: "sheet",
              device: "phone",
              os: "android",
              anchor: "bottom",
              title: sb.addPageTo,
              items: sb.targets,
              highlight: sb.targets.indexOf(sb.homeScreen),
            },
          },
          androidConfirm(sb.dialogTitle, sb.add),
          done("phone", "android"),
        ],
        help: helpOf(s.openChrome),
      };
    }
    case "android-edge": {
      const eb = m.browser.edge;
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ["url"],
            bottom: ["back", "forward", "more", "tabs", "home"],
            target: { bar: "bottom", index: 2 },
          }),
          androidMenu("bottom-center", eb.addToPhone, eb.menuItems, m.guides["android-edge"].menuText),
          androidConfirm(eb.dialogTitle, eb.install),
          done("phone", "android"),
        ],
        help: helpOf(s.openChrome),
      };
    }
    case "android-firefox": {
      const fb = m.browser.firefox;
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ["home", "url", "tabs", "kebab"],
            target: { bar: "top", index: 3 },
          }),
          androidMenu("top-right", fb.addToHome, fb.menuItems, m.guides["android-firefox"].menuText),
          androidConfirm(fb.dialogTitle, fb.add),
          done("phone", "android"),
        ],
        help: helpOf(s.openChrome),
      };
    }
    case "android-opera": {
      const ob = m.browser.opera;
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ["url", "kebab"],
            bottom: ["back", "forward", "home", "tabs", "menu"],
            target: { bar: "top", index: 1 },
          }),
          androidMenu("top-right", ob.addTo, ob.menuItems, m.guides["android-opera"].menuText),
          androidConfirm(ob.dialogTitle, ob.add),
          done("phone", "android"),
        ],
        help: helpOf(s.openChrome),
      };
    }
    case "android-brave":
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ["url"],
            bottom: ["home", "book", "plus", "tabs", "kebab"],
            target: { bar: "bottom", index: 4 },
          }),
          androidMenu("bottom-right", chrome.installApp, m.browser.brave.menuItems, m.guides["android-brave"].menuText),
          androidConfirm(chrome.dialogTitle, chrome.install),
          done("phone", "android"),
        ],
        help: helpOf(s.openChrome),
      };
    case "android-other": {
      const ob = m.browser.other;
      return {
        key,
        label: g.label,
        steps: [
          first({
            kind: "browser",
            device: "phone",
            os: "android",
            top: ["home", "url", "kebab"],
            target: { bar: "top", index: 2 },
          }),
          androidMenu("top-right", ob.addToHome, ob.menuItems, m.guides["android-other"].menuText),
          androidConfirm(ob.dialogTitle, ob.add),
          done("phone", "android"),
        ],
        help: helpOf(s.openChrome),
      };
    }
  }
}

/** Picker groups: which guides, under which heading. */
export const PICKER_GROUPS: { group: keyof Messages["picker"]["groups"]; keys: GuideKey[] }[] = [
  {
    group: "iphone",
    keys: ["iphone-safari-26", "iphone-safari", "ios-chrome", "ios-edge", "ios-firefox", "ios-other"],
  },
  { group: "ipad", keys: ["ipad-safari-26", "ipad-safari"] },
  {
    group: "android",
    keys: [
      "android-chrome",
      "android-samsung",
      "android-edge",
      "android-firefox",
      "android-opera",
      "android-brave",
      "android-other",
    ],
  },
  { group: "other", keys: ["in-app", "desktop"] },
];
