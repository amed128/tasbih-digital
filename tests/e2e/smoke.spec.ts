import { expect, test } from "@playwright/test";

const routes = ["/", "/listes", "/stats", "/reglages", "/about", "/privacy"];

for (const route of routes) {
  test(`smoke: route ${route} loads`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "load" });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response?.ok(), `non-success status for ${route}`).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
  });
}
