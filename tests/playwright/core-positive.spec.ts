import { test, expect } from '@playwright/test';

test.describe('Core positive flow - Rediff home to Rediffmail', () => {
  test('should open homepage and navigate to Rediffmail and verify news', async ({ page }) => {
    // Open Rediff homepage
    await page.goto('https://www.rediff.com/');

    // Ensure the Rediffmail link is visible
    const rediffmailLink = page.locator('a:has-text("Rediffmail")');
    await expect(rediffmailLink).toBeVisible({ timeout: 10000 });

    // Click the Rediffmail link and wait for navigation
    await Promise.all([
      page.waitForLoadState('networkidle'),
      rediffmailLink.click(),
    ]);

    // Basic URL check to ensure we reached a mail-related page
    await expect(page).toHaveURL(/mail|rediffmail/);

    // Verify presence of a news section or link on the page
    const newsLocator = page.locator('text=News');
    await expect(newsLocator.first()).toBeVisible({ timeout: 10000 });
  });
});
