import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 1000 } });

test("simulator, iPhone Safari 26: the arrow lands on the drawn «•••» button", async ({ page }) => {
  await page.goto("/?device=iphone26&bar=compact");
  const frame = page.frameLocator("#frame");
  await frame.getByRole("button", { name: "Start" }).click();
  const arrow = await frame.locator(".pia-arrow").boundingBox();
  const more = await page.locator("#phone-bottom .at-58").boundingBox();
  expect(arrow && more).toBeTruthy();
  expect(Math.abs(arrow!.x + arrow!.width / 2 - (more!.x + more!.width / 2))).toBeLessThan(2);
  await expect(page.locator("#log")).toContainText("arrow-start");
});

test("simulator, Android Chrome: fire the event, install through the mock dialog, «installed»", async ({ page }) => {
  await page.goto("/?device=android-chrome");
  const frame = page.frameLocator("#frame");
  await expect(frame.locator("h3")).toHaveText("Tap the ⋮ menu");
  await page.getByRole("button", { name: "Fire beforeinstallprompt" }).click();
  await frame.getByRole("button", { name: "Install Acme Notes" }).click();
  await frame.getByRole("button", { name: "Install", exact: true }).click();
  await expect(frame.getByRole("heading", { name: "Acme Notes is on your phone!" })).toBeVisible();
  await expect(page.locator("#log")).toContainText("installed");
});

test("simulator, language and in-app browser", async ({ page }) => {
  await page.goto("/?device=instagram&lang=fr");
  await expect(
    page.frameLocator("#frame").getByRole("heading", { name: "Ouvrez-la dans Safari pour l’installer" }),
  ).toBeVisible();
});
