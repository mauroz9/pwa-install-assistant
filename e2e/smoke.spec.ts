import { expect, test } from "@playwright/test";

test("the demo loads the built package", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("home");
  await expect(page.locator("#version")).not.toBeEmpty();
});

test("the demo is an installable PWA (so the real install dialog can be tried)", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = (await cdp.send("Page.getInstallabilityErrors")) as {
    installabilityErrors: { errorId: string }[];
  };
  expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);
  const manifest = (await cdp.send("Page.getAppManifest")) as { errors: unknown[]; url: string };
  expect(manifest.errors).toEqual([]);
});
