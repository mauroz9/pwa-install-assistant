import { devices, expect, test, type Browser } from "@playwright/test";
import { UA } from "../test/fixtures/user-agents";

/** An iPhone 17 / iPad (A16) sized viewport with a real iOS 26.3 Safari UA, run in Chromium. */
async function open(browser: Browser, kind: "iphone" | "ipad" | "iphone27", extra: { reducedMotion?: "reduce" } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { defaultBrowserType, ...base } = devices[kind === "ipad" ? "iPad Pro 11" : "iPhone 15"];
  const context = await browser.newContext({
    ...base,
    ...extra,
    viewport: kind === "ipad" ? { width: 820, height: 1180 } : { width: 402, height: 874 },
    userAgent:
      kind === "ipad" ? UA.ipadMobile26 : kind === "iphone27" ? UA.iphoneSafari27Expected : UA.iphoneSafari26_3,
  });
  const page = await context.newPage();
  await page.goto("/?lang=en");
  return { context, page, install: page.locator("#install") };
}

test("iPhone, Safari 26, Compact bar: the arrow sits over «•••», 58 pt from the right edge", async ({ browser }) => {
  const { context, page, install } = await open(browser, "iphone");
  await expect(install.getByRole("button", { name: "Start" })).toBeDisabled();
  await install.getByText("Compact", { exact: true }).click();
  await install.getByRole("button", { name: "Start" }).click();
  const box = (await page.locator(".pia-arrow").boundingBox())!;
  expect(Math.round(402 - (box.x + box.width / 2))).toBe(58);
  expect(Math.round(box.y + box.height)).toBeGreaterThan(874 - 12);
  await expect(page.getByRole("region", { name: "Installation steps" })).toContainText("Tap “•••”");
  await page.reload();
  // Remembered: no need to ask again.
  await expect(install.getByRole("button", { name: "Start" })).toBeEnabled();
  await context.close();
});

test("iPhone, Bottom bar: the arrow is centred over Share", async ({ browser }) => {
  const { context, page, install } = await open(browser, "iphone");
  await install.getByText("Bottom", { exact: true }).click();
  await install.getByRole("button", { name: "Start" }).click();
  const box = (await page.locator(".pia-arrow").boundingBox())!;
  expect(Math.round(box.x + box.width / 2)).toBe(201);
  await page.getByRole("button", { name: "Close the hint" }).click();
  await expect(page.locator(".pia-arrow")).toHaveCount(0);
  await context.close();
});

test("iPad, Safari 26: the arrow is at the top, 120 pt from the right, and the hint stays clear of it", async ({
  browser,
}) => {
  const { context, page, install } = await open(browser, "ipad");
  await install.getByRole("button", { name: "Start" }).click();
  const box = (await page.locator(".pia-arrow").boundingBox())!;
  expect(Math.round(820 - (box.x + box.width / 2))).toBe(120);
  expect(box.y).toBeLessThan(12);
  const hint = (await page.locator(".pia-hint-card").boundingBox())!;
  expect(hint.x + hint.width).toBeLessThan(box.x);
  await context.close();
});

test("reduced motion: the arrow does not move", async ({ browser }) => {
  const { context, page, install } = await open(browser, "ipad", { reducedMotion: "reduce" });
  await install.getByRole("button", { name: "Start" }).click();
  const animation = await page.locator(".pia-arrow-body").evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
  await context.close();
});

test("Safari 27 (not measured yet): the illustrated guide, no arrow", async ({ browser }) => {
  const { context, page, install } = await open(browser, "iphone27");
  await expect(page.locator("#install h3")).toHaveText("Tap “•••”");
  await expect(install.getByRole("button", { name: "Start" })).toHaveCount(0);
  await context.close();
});
