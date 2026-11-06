import { devices, expect, test, type Page } from "@playwright/test";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { defaultBrowserType, ...pixel } = devices["Pixel 7"];
test.use(pixel);

/**
 * Fires a `beforeinstallprompt` like Chrome's. The answer is chosen by the
 * test; `prompt()` records that it was called.
 */
async function offerInstall(page: Page, outcome: "accepted" | "dismissed") {
  await page.evaluate((outcome) => {
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & Record<string, unknown>;
    event.prompt = () => {
      (window as unknown as { __prompted: number }).__prompted =
        ((window as unknown as { __prompted?: number }).__prompted ?? 0) + 1;
      return Promise.resolve();
    };
    event.userChoice = new Promise((resolve) => setTimeout(() => resolve({ outcome, platform: "web" }), 150));
    window.dispatchEvent(event);
  }, outcome);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?lang=en");
  await expect(page.locator("#install h3")).toHaveText("Tap the ⋮ menu");
});

test("the assistant appears when the event arrives, and moves on by itself to «installed»", async ({ page }) => {
  const install = page.locator("#install");
  await offerInstall(page, "accepted");
  await expect(install.getByRole("heading", { name: "Install it with one tap" })).toBeVisible();
  await install.getByRole("button", { name: "Install Acme Notes" }).click();
  await expect(install.getByRole("status")).toContainText("If your phone asks");
  await expect(install.locator("h3")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(install.getByRole("heading", { name: "Acme Notes is on your phone!" })).toBeVisible();
  await expect(install.getByRole("link", { name: "Open Acme Notes" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);

  await page.reload();
  await expect(install).toContainText("Acme Notes is on your home screen");
});

test("dismissing goes back to step 1 and lets you try again", async ({ page }) => {
  const install = page.locator("#install");
  await offerInstall(page, "dismissed");
  await install.getByRole("button", { name: "Install Acme Notes" }).click();
  await expect(install.getByRole("status")).toContainText("from the browser menu");
  await offerInstall(page, "accepted");
  await install.getByRole("button", { name: "Try again" }).click();
  await expect(install.getByRole("status")).toContainText("Installing…");
});
