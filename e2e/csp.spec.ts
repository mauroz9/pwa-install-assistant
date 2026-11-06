import { devices, expect, test } from "@playwright/test";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { defaultBrowserType, ...pixel } = devices["Pixel 7"];
test.use(pixel);

test("under a strict CSP (no 'unsafe-inline') the assistant renders and styles itself with the nonce", async ({
  page,
}) => {
  await page.goto("/csp.html");
  const install = page.locator("#install");
  await expect(install.locator("h3")).toHaveText("Tap the ⋮ menu");
  // The injected stylesheet applied (and the theme, set through CSSOM).
  await expect(install.getByRole("button", { name: "Next" })).toHaveCSS("background-color", "rgb(225, 29, 72)");
  expect(await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations)).toEqual([]);
});

test("control: without the nonce the browser blocks the stylesheet", async ({ page }) => {
  await page.goto("/csp.html?nonce=0");
  await expect(page.locator("#install h3")).toHaveText("Tap the ⋮ menu");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __violations: string[] }).__violations.length))
    .toBeGreaterThan(0);
});
