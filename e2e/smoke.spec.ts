import { expect, test } from "@playwright/test";

test("the demo loads the built package", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("home");
  await expect(page.locator("#version")).not.toBeEmpty();
});
