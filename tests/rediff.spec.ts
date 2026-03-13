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

  // TC_Rediff_004 - Latest news list visible on homepage
  test('TC_Rediff_004 - Latest news list visible on homepage', async ({ page }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
    // Try to locate news containers (robust check with multiple selectors)
    const newsLocator = page.locator('div[class*="news"], div[id*="news"], ul[class*="news"], section:has-text("News"), section:has-text("Latest")');
    // There should be at least one anchor inside the news container
    const anchors = newsLocator.locator('a');
    const anchorsCount = await anchors.count();
    expect(anchorsCount).toBeGreaterThan(0);
    // Ensure at least one visible headline
    let visibleFound = false;
    for (let i = 0; i < Math.min(anchorsCount, 10); i++) {
      if (await anchors.nth(i).isVisible()) {
        visibleFound = true;
        break;
      }
    }
    expect(visibleFound).toBeTruthy();
  });

  // Explicitly close the browser after all tests (Playwright normally closes it; this ensures requirement)
  test.afterAll(async ({ browser }) => {
    try {
      await browser.close();
    } catch (e) {
      // ignore if already closed
    }
  });

  // TESTS_PLACEHOLDER
});
