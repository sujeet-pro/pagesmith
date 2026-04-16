import { expect, test } from '@playwright/test'

const BASE = '/pagesmith'

test.describe('Theme toggle', () => {
  test('theme toggle switches data-theme attribute when available', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const toggle = page.locator('[data-pagesmith-theme-toggle], [aria-label*="theme" i]').first()
    const count = await toggle.count()
    test.skip(count === 0, 'theme toggle not rendered on this page')

    const initial = await page.locator('html').getAttribute('data-theme')
    await toggle.click()
    await expect.poll(async () => page.locator('html').getAttribute('data-theme')).not.toBe(initial)
  })
})
