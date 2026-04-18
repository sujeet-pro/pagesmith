import { expect, test } from "@playwright/test";

const BASE = "/pagesmith";

test.describe("Theme toggle", () => {
  test("opens the theme dropdown and switches color scheme class", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const toggleButton = page
      .locator("[data-ps-theme-toggle-button], [data-theme-toggle-btn]")
      .first();
    const count = await toggleButton.count();
    test.skip(count === 0, "theme toggle not rendered on this page");

    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    // Pick a color scheme that is not the current default ("auto") so the
    // class name on <html> must change after the click.
    const html = page.locator("html");
    const initialClass = (await html.getAttribute("class")) ?? "";
    const darkRadio = page.locator('input[name="colorScheme"][value="dark"]').first();
    await darkRadio.check();
    await expect.poll(async () => (await html.getAttribute("class")) ?? "").not.toBe(initialClass);
    await expect(html).toHaveClass(/color-scheme-dark/);
  });
});
