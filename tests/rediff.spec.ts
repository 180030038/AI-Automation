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

  // TESTS_PLACEHOLDER
});
