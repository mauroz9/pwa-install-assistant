import { describe, expect, it } from "vitest";
import {
  chooseGuide,
  detectDevice,
  GUIDE_KEYS,
  isGuideKey,
  readEnv,
  supportsInstallPrompt,
  type DetectEnv,
  type GuideKey,
} from "../src/core/detect";
import { UA } from "./fixtures/user-agents";

const guide = (env: DetectEnv) => chooseGuide(detectDevice(env));
const TOUCH = { maxTouchPoints: 5 };

describe("chooseGuide · real User-Agents", () => {
  const cases: [string, DetectEnv, GuideKey | null][] = [
    ["iPhone Safari 15", { userAgent: UA.iphoneSafari15 }, "iphone-safari"],
    ["iPhone Safari 16.4", { userAgent: UA.iphoneSafari16_4 }, "iphone-safari"],
    ["iPhone Safari 17", { userAgent: UA.iphoneSafari17 }, "iphone-safari"],
    ["iPhone Safari 18", { userAgent: UA.iphoneSafari18 }, "iphone-safari"],
    ["iPhone Safari 26 (UA frozen at 18_6)", { userAgent: UA.iphoneSafari26 }, "iphone-safari-26"],
    ["iPhone Safari 26.3", { userAgent: UA.iphoneSafari26_3 }, "iphone-safari-26"],
    ["iPhone Safari 27 (expected shape)", { userAgent: UA.iphoneSafari27Expected }, "iphone-safari-26"],
    ["iPad, classic UA", { userAgent: UA.ipadClassic, ...TOUCH }, "ipad-safari"],
    ["iPad, mobile site, iPadOS 26", { userAgent: UA.ipadMobile26, ...TOUCH }, "ipad-safari-26"],
    ["iPadOS 18 posing as a Mac", { userAgent: UA.macLike18, ...TOUCH }, "ipad-safari"],
    ["iPadOS 26 posing as a Mac", { userAgent: UA.macLike26, ...TOUCH }, "ipad-safari-26"],
    ["Safari on a Mac (no touch screen)", { userAgent: UA.macLike26, maxTouchPoints: 0 }, "desktop"],
    ["Chrome iOS", { userAgent: UA.iosChrome }, "ios-chrome"],
    ["Chrome iPad", { userAgent: UA.ipadChrome, ...TOUCH }, "ios-chrome"],
    ["Chrome iPad, desktop site", { userAgent: UA.ipadChromeDesktopSite, ...TOUCH }, "ios-chrome"],
    ["Chrome iOS 16.2 (cannot add to home screen)", { userAgent: UA.iosChromeOld }, "ios-open-safari"],
    ["Edge iOS", { userAgent: UA.iosEdge }, "ios-edge"],
    ["Firefox iOS", { userAgent: UA.iosFirefox }, "ios-firefox"],
    ["Firefox iPad", { userAgent: UA.ipadFirefox, ...TOUCH }, "ios-firefox"],
    ["Opera iOS", { userAgent: UA.iosOpera }, "ios-other"],
    ["DuckDuckGo iOS", { userAgent: UA.iosDuckDuckGo }, "ios-other"],
    ["Chrome Android", { userAgent: UA.androidChrome }, "android-chrome"],
    ["Chrome 124 Android (emulator)", { userAgent: UA.androidChrome124 }, "android-chrome"],
    ["Chrome Android tablet", { userAgent: UA.androidTabletChrome }, "android-chrome"],
    [
      "Chrome Android, desktop site, Client Hints",
      { userAgent: UA.androidDesktopSite, uaData: { mobile: false, platform: "Android", brands: [] } },
      "android-chrome",
    ],
    ["Brave Android (Chrome's UA)", { userAgent: UA.androidChrome, isBrave: true }, "android-brave"],
    [
      "Brave Android by Client Hints",
      { userAgent: UA.androidChrome, uaData: { mobile: true, platform: "Android", brands: [{ brand: "Brave" }] } },
      "android-brave",
    ],
    [
      "Edge Android by Client Hints",
      {
        userAgent: UA.androidChrome,
        uaData: { mobile: true, platform: "Android", brands: [{ brand: "Microsoft Edge" }] },
      },
      "android-edge",
    ],
    ["Samsung Internet", { userAgent: UA.samsung }, "android-samsung"],
    ["Samsung Internet tablet", { userAgent: UA.samsungTablet }, "android-samsung"],
    [
      "Samsung Internet, desktop site, Client Hints",
      { userAgent: UA.samsungDesktopSite, uaData: { mobile: false, platform: "Android" } },
      "android-samsung",
    ],
    ["Firefox Android", { userAgent: UA.androidFirefox }, "android-firefox"],
    ["Firefox Android tablet", { userAgent: UA.androidFirefoxTablet }, "android-firefox"],
    ["Edge Android", { userAgent: UA.androidEdge }, "android-edge"],
    ["Opera Android", { userAgent: UA.androidOpera }, "android-opera"],
    ["DuckDuckGo Android", { userAgent: UA.androidDuckDuckGo }, "android-other"],
    ["Xiaomi browser", { userAgent: UA.xiaomi }, "android-other"],
    ["Huawei browser", { userAgent: UA.huawei }, "android-other"],
    ["Oppo / HeyTap browser", { userAgent: UA.oppo }, "android-other"],
    ["UC Browser", { userAgent: UA.ucBrowser }, "android-other"],
    ["Yandex Browser", { userAgent: UA.yandex }, "android-other"],
    ["Opera Mini", { userAgent: UA.operaMini }, "android-other"],
    ["Amazon Silk", { userAgent: UA.silk }, "android-other"],
    ["Instagram iOS", { userAgent: UA.instagramIos }, "in-app"],
    ["Instagram Android", { userAgent: UA.instagramAndroid }, "in-app"],
    ["Facebook iOS", { userAgent: UA.facebookIos }, "in-app"],
    ["Facebook Android", { userAgent: UA.facebookAndroid }, "in-app"],
    ["Messenger iOS", { userAgent: UA.messengerIos }, "in-app"],
    ["Messenger Android", { userAgent: UA.messengerAndroid }, "in-app"],
    ["TikTok iOS", { userAgent: UA.tiktokIos }, "in-app"],
    ["TikTok Android", { userAgent: UA.tiktokAndroid }, "in-app"],
    ["WhatsApp Android", { userAgent: UA.whatsappAndroid }, "in-app"],
    ["Telegram Android", { userAgent: UA.telegramAndroid }, "in-app"],
    ["Gmail iOS", { userAgent: UA.gmailIos }, "in-app"],
    ["Gmail Android", { userAgent: UA.gmailAndroid }, "in-app"],
    ["LinkedIn iOS", { userAgent: UA.linkedinIos }, "in-app"],
    ["Google app iOS", { userAgent: UA.googleAppIos }, "in-app"],
    ["Google app Android", { userAgent: UA.googleAppAndroid }, "in-app"],
    ["X iOS", { userAgent: UA.xIos }, "in-app"],
    ["Snapchat iOS", { userAgent: UA.snapchatIos }, "in-app"],
    ["Pinterest Android", { userAgent: UA.pinterestAndroid }, "in-app"],
    ["WeChat iOS", { userAgent: UA.wechatIos }, "in-app"],
    ["LINE iOS", { userAgent: UA.lineIos }, "in-app"],
    ["Threads iOS", { userAgent: UA.threadsIos }, "in-app"],
    ["KakaoTalk Android", { userAgent: UA.kakaoAndroid }, "in-app"],
    ["Chrome Windows", { userAgent: UA.windowsChrome }, "desktop"],
    ["Edge Windows", { userAgent: UA.windowsEdge }, "desktop"],
    ["Firefox Windows", { userAgent: UA.windowsFirefox }, "desktop"],
    ["Chrome Mac", { userAgent: UA.macChrome }, "desktop"],
    ["Firefox Mac", { userAgent: UA.macFirefox }, "desktop"],
    ["Firefox Linux", { userAgent: UA.linuxFirefox }, "desktop"],
    ["ChromeOS", { userAgent: UA.chromeOs }, "desktop"],
    ["Empty UA", { userAgent: "" }, null],
  ];

  it("covers at least 50 real User-Agents", () => {
    expect(Object.keys(UA).length).toBeGreaterThanOrEqual(50);
    expect(cases.length).toBeGreaterThanOrEqual(50);
  });

  it.each(cases)("%s", (_name, env, expected) => {
    expect(guide(env)).toBe(expected);
  });

  it("every fixture is classified by some case", () => {
    const used = new Set(cases.map(([, env]) => env.userAgent));
    const unused = Object.entries(UA).filter(([, ua]) => !used.has(ua));
    expect(unused.map(([name]) => name)).toEqual([]);
  });
});

describe("detectDevice", () => {
  it("reads the real iOS 26 version from Version/ even though the OS says 18_6", () => {
    expect(detectDevice({ userAgent: UA.iphoneSafari26 }).iosVersion).toBe(26);
    expect(detectDevice({ userAgent: UA.iphoneSafari26_3 }).iosVersion).toBe(26.3);
    expect(detectDevice({ userAgent: UA.iphoneSafari27Expected }).iosVersion).toBe(27);
  });

  it("does not take «Mac OS X 10_15_7» as the iPadOS version", () => {
    expect(detectDevice({ userAgent: UA.macLike18, ...TOUCH }).iosVersion).toBe(18.5);
    expect(detectDevice({ userAgent: UA.ipadChromeDesktopSite, ...TOUCH }).iosVersion).toBeNull();
  });

  it("reads the OS version for browsers that are not Safari (frozen at 18.6 on iOS 26)", () => {
    expect(detectDevice({ userAgent: UA.iosChrome }).iosVersion).toBe(18.6);
    expect(detectDevice({ userAgent: UA.iosChromeOld }).iosVersion).toBe(16.2);
  });

  it.each([
    [UA.instagramIos, "Instagram"],
    [UA.facebookAndroid, "Facebook"],
    [UA.messengerIos, "Messenger"],
    [UA.messengerAndroid, "Messenger"],
    [UA.tiktokAndroid, "TikTok"],
    [UA.whatsappAndroid, "WhatsApp"],
    [UA.telegramAndroid, "Telegram"],
    [UA.linkedinIos, "LinkedIn"],
    [UA.googleAppIos, "Google"],
    [UA.xIos, "X"],
    [UA.snapchatIos, "Snapchat"],
    [UA.pinterestAndroid, "Pinterest"],
    [UA.wechatIos, "WeChat"],
    [UA.lineIos, "LINE"],
    [UA.threadsIos, "Threads"],
    [UA.kakaoAndroid, "KakaoTalk"],
    [UA.gmailIos, null],
    [UA.gmailAndroid, null],
  ])("names the app of the in-app browser (%#)", (userAgent, name) => {
    expect(detectDevice({ userAgent }).inApp).toEqual({ name });
  });

  it("regular browsers are not in-app browsers", () => {
    for (const ua of [
      UA.iphoneSafari18,
      UA.iosChrome,
      UA.iosFirefox,
      UA.iosOpera,
      UA.iosDuckDuckGo,
      UA.androidChrome,
      UA.samsung,
      UA.androidFirefox,
      UA.androidDuckDuckGo,
    ]) {
      expect(detectDevice({ userAgent: ua }).inApp).toBeNull();
    }
  });

  it("names the browser", () => {
    expect(detectDevice({ userAgent: UA.windowsEdge }).browser).toBe("edge");
    expect(detectDevice({ userAgent: UA.macLike26 }).browser).toBe("safari");
    expect(detectDevice({ userAgent: UA.windowsFirefox }).browser).toBe("firefox");
    expect(detectDevice({ userAgent: UA.iosDuckDuckGo }).browser).toBe("duckduckgo");
  });

  it("reads navigator by default and is safe without one (SSR)", () => {
    expect(readEnv()).toEqual(
      typeof navigator === "undefined" ? { userAgent: "" } : expect.objectContaining({ userAgent: expect.any(String) }),
    );
    expect(() => detectDevice()).not.toThrow();
  });
});

describe("supportsInstallPrompt", () => {
  it.each([
    [UA.androidChrome, true],
    [UA.samsung, true],
    [UA.androidEdge, true],
    [UA.androidOpera, true],
    [UA.androidFirefox, false],
    [UA.xiaomi, false],
    [UA.iphoneSafari26, false],
    [UA.instagramAndroid, false],
    [UA.windowsChrome, false],
  ])("%s → %s", (userAgent, expected) => {
    expect(supportsInstallPrompt(detectDevice({ userAgent }))).toBe(expected);
  });
});

describe("guide keys", () => {
  it("recognises its own keys only", () => {
    for (const key of GUIDE_KEYS) expect(isGuideKey(key)).toBe(true);
    expect(isGuideKey("android-netscape")).toBe(false);
    expect(isGuideKey(42)).toBe(false);
  });
});
