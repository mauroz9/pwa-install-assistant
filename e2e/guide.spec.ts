import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";

const install = "#install";

/** A device profile run in Chromium (the iPhone profiles ask for WebKit). */
function inChromium(name: keyof typeof devices) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { defaultBrowserType, ...rest } = devices[name];
  return rest;
}

test.describe("desktop", () => {
  test("shows the computer view and the picker", async ({ page }) => {
    await page.goto("/?lang=en");
    await expect(page.locator(install)).toContainText("Looks like you're using: a computer.");
    await expect(page.locator(`${install} select`)).toBeVisible();
  });

  test("picking a guide shows its steps, navigable from the keyboard", async ({ page }) => {
    await page.goto("/?lang=en");
    await page.locator(`${install} select`).selectOption("android-samsung");
    await expect(page.locator(`${install} h3`)).toHaveText("Tap the ≡ menu");
    await page.getByRole("button", { name: "Next" }).first().press("Enter");
    await expect(page.locator(`${install} h3`)).toBeFocused();
    await expect(page.locator(`${install} [aria-live=polite]`).first()).toHaveText("Step 2 of 5");
  });

  test("the sheet opens as a modal dialog and Escape closes it", async ({ page }) => {
    await page.goto("/?lang=en");
    await page.getByRole("button", { name: "Open as a sheet" }).click();
    const dialog = page.getByRole("dialog", { name: "Install Acme Notes" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Open as a sheet" })).toBeFocused();
  });
});

test.describe("Android phone", () => {
  test.use(inChromium("Pixel 7"));

  test("Chrome on Android: the menu guide", async ({ page }) => {
    await page.goto("/?lang=en");
    await expect(page.locator(install)).toContainText("Android with Chrome");
    await expect(page.locator(`${install} h3`)).toHaveText("Tap the ⋮ menu");
  });
});

test.describe("iPhone", () => {
  test.use(inChromium("iPhone 15"));

  test("Spanish, from the browser language", async ({ page }) => {
    await page.goto("/?lang=es");
    await expect(page.locator(install)).toContainText("Parece que usas: iPhone con Safari");
  });
});

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  for (const [name, device] of [
    ["desktop", inChromium("Desktop Chrome")],
    ["Android", inChromium("Pixel 7")],
    ["iPhone", inChromium("iPhone 15")],
  ] as const) {
    test(name, async ({ browser }) => {
      // Reduced motion: no fade-in while axe measures contrast (and that mode is checked too).
      const context = await browser.newContext({ ...device, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto("/?lang=en");
      await expect(page.locator(`${install} .pia`)).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include(install)
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      await context.close();
    });
  }
});
