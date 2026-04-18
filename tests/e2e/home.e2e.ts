import { expect, test } from "@playwright/test";

const BASE = "/pagesmith";

test.describe("Pagesmith docs site", () => {
  test("loads the home page and shows the site title", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/Pagesmith/i);
    await expect(page.locator("body")).toContainText("Pagesmith");
  });

  test("navigates from home to a guide page", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const guideLink = page.locator('a[href*="/guide/"]').first();
    await expect(guideLink).toBeVisible();
    await guideLink.click();
    await expect(page).toHaveURL(/\/guide\//);
    await expect(page.locator("main, article").first()).toBeVisible();
  });

  test("serves llms.txt as a passthrough asset", async ({ request }) => {
    const response = await request.get(`${BASE}/llms.txt`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const body = await response.text();
    expect(body).toContain("Pagesmith");
  });

  test("404 page resolves for a missing path", async ({ request }) => {
    const response = await request.get(`${BASE}/definitely-missing-page-xyz`);
    expect([200, 404]).toContain(response.status());
    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });
});
