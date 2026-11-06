import { expect, test } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { UA } from "../test/fixtures/user-agents";

test("desktop: the QR code, read from a real screenshot, opens this page", async ({ page }) => {
  await page.goto("/?lang=en");
  const qr = page.locator("#install .pia-qr");
  await expect(qr.getByRole("img", { name: "QR code that opens this page on your phone" })).toBeVisible();
  const png = PNG.sync.read(await qr.screenshot());
  const read = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  expect(read?.data).toBe(page.url());
});

test.describe("Instagram on Android", () => {
  test.use({ userAgent: UA.instagramAndroid, viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });

  test("offers to open Chrome and to copy the link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/?lang=en");
    const install = page.locator("#install");
    await expect(install.getByRole("heading", { name: "Open it in Chrome to install it" })).toBeVisible();
    await expect(install.getByRole("link", { name: "Open in Chrome" })).toHaveAttribute("href", /^intent:\/\//);
    await install.getByRole("button", { name: "Copy link" }).click();
    await expect(install.getByRole("button", { name: "Link copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  });
});
