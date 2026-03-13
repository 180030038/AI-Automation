// tests/rediff.spec.ts
import { test, expect } from '@playwright/test';

// Test suite for Rediff basic navigation and news checks
test.describe('Rediff basic navigation and news checks', () => {
  // TC_Rediff_001 - Homepage accessible (HTTP 200 & title)
  test('TC_Rediff_001 - Homepage accessible (HTTP 200 & title)', async ({ page }) => {
    const response = await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Rediff\.com/i);
    // main header presence
    await expect(page.locator('header, nav')).toBeVisible();
  });

  // TC_Rediff_002 - "Rediffmail" visible in header (desktop)
  test('TC_Rediff_002 - "Rediffmail" visible in header (desktop)', async ({ page }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
    const rediffmail = page.locator('text=Rediffmail');
    await expect(rediffmail.first()).toBeVisible();
    await expect(rediffmail.first()).toHaveText(/Rediffmail/);
  });

  // TC_Rediff_003 - Clicking "Rediffmail" redirects to Rediffmail section
  test('TC_Rediff_003 - Clicking "Rediffmail" redirects to Rediffmail section', async ({ page }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
    const rediffmail = page.locator('text=Rediffmail').first();
    await expect(rediffmail).toBeVisible();
    // Click and wait for navigation
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
      rediffmail.click()
    ]);
    expect(response?.status()).toBe(200);
    // Validate URL or title indicates Rediffmail
    expect(page.url()).toMatch(/mail\.rediff\.com|rediffmail/i);
    await expect(page).toHaveTitle(/Rediffmail/i);
  });

  // TESTS_PLACEHOLDER
});
