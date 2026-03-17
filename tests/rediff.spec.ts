import { test, expect } from '@playwright/test';

// Playwright test for Rediff - full implementation

test.describe('Rediff Smoke Tests (TC-RED)', () => {
  test('TC-RED-001/002/003/004/008 - Rediff home, Rediffmail, headlines, offline', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // TC-RED-001: Access Rediff home page
      const homeResp = await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
      const status = homeResp?.status() ?? 0;
      test.step('Verify HTTP 200 for home page', async () => {
        expect(status).toBe(200);
      });

      const title = await page.title();
      test.step('Verify page title contains Rediff', async () => {
        expect(title).toMatch(/Rediff/i);
      });

      // TC-RED-002: Verify "Rediffmail" option is visible in header
      const rediffmailLink = page.locator('a:has-text("Rediffmail")').first();
      test.step('Rediffmail link exists and is visible', async () => {
        await expect(rediffmailLink).toHaveCount(1);
        await expect(rediffmailLink).toBeVisible();
      });

      // TC-RED-003: Click "Rediffmail" and verify redirection
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }),
        rediffmailLink.click()
      ]);
      const postClickUrl = page.url();
      const postClickTitle = await page.title();
      test.step('Verify navigation to mail site', async () => {
        expect(postClickUrl).toMatch(/mail/i);
        expect(postClickTitle.length).toBeGreaterThan(0);
      });

      // TC-RED-004: Verify list of latest news articles on home page
      await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
      const headlines = await page.$$eval('h2, h3', els => els.map(e => e.textContent?.trim() || '').filter(t => t.length > 0));
      test.step('Collect headlines and ensure at least one exists', async () => {
        if (headlines.length < 1) {
          const fallback = await page.$$eval('a', els => els.map(a => a.textContent?.trim() || '').filter(t => t.length > 30));
          expect(fallback.length).toBeGreaterThan(0);
        } else {
          expect(headlines.length).toBeGreaterThan(0);
        }
      });

      // TC-RED-008: Site not reachable (Negative) - simulate offline
      await context.setOffline(true);
      let offlineError: any = null;
      try {
        await page.goto('https://www.rediff.com', { timeout: 10000 });
      } catch (e) {
        offlineError = e;
      } finally {
        await context.setOffline(false);
      }
      test.step('Verify navigation fails while offline', async () => {
        expect(offlineError).not.toBeNull();
      });

    } finally {
      await context.close();
    }
  });
});
