import { describe, expect, it } from "vitest";
import { externalBrowserName, openInBrowserUrl } from "../src/core/links";

describe("openInBrowserUrl", () => {
  const url = "https://planabc.quobit.es/instalar?x=1";

  it("Android: Chrome intent, falling back to the URL", () => {
    expect(openInBrowserUrl(url, "android")).toBe(
      "intent://planabc.quobit.es/instalar?x=1#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fplanabc.quobit.es%2Finstalar%3Fx%3D1;end",
    );
  });

  it("iOS and iPadOS: Safari's scheme", () => {
    expect(openInBrowserUrl(url, "ios")).toBe("x-safari-https://planabc.quobit.es/instalar?x=1");
    expect(openInBrowserUrl("http://localhost:3000/", "ipados")).toBe("x-safari-http://localhost:3000/");
  });

  it("refuses non-http(s) schemes, garbage and desktop", () => {
    expect(openInBrowserUrl("javascript:alert(1)", "android")).toBeNull();
    expect(openInBrowserUrl("not a url", "ios")).toBeNull();
    expect(openInBrowserUrl(url, "desktop")).toBeNull();
  });

  it("names the browser to go to", () => {
    expect(externalBrowserName("ios")).toBe("Safari");
    expect(externalBrowserName("ipados")).toBe("Safari");
    expect(externalBrowserName("android")).toBe("Chrome");
    expect(externalBrowserName("desktop")).toBeNull();
  });
});
