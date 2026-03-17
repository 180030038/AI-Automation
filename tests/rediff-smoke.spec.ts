import { test, expect, Page, Browser } from '@playwright/test';

test.describe('Rediff — Navigation & Smoke Checks (TC-001 to TC-007)', () => {
  test('TC-001..TC-007: Homepage, Rediffmail link, navigation, news list, mobile & keyboard checks', async ({ page, browser }) => {
    // TC-001: Access Rediff homepage (AC1)
    const resp = await page.goto('https://www.rediff.com', { waitUntil: 'load', timeout: 30000 });
    expect(resp).not.toBeNull();
    // status check (if response available)
    if (resp) {
      expect(resp.status()).toBeGreaterThanOrEqual(200);
      expect(resp.status()).toBeLessThan(400);
    }
    const title = await page.title();
    expect(title).toMatch(/Rediff/i);

    // TC-002: HTTP to HTTPS redirect (AC1)
    // Navigate to http and assert final URL is HTTPS
    const respHttp = await page.goto('http://www.rediff.com', { waitUntil: 'networkidle', timeout: 30000 });
    const finalUrl = page.url();
    expect(finalUrl.startsWith('https://')).toBeTruthy();

    // Ensure we are back on homepage for subsequent tests
    await page.goto('https://www.rediff.com', { waitUntil: 'networkidle', timeout: 30000 });

    // Helper to find Rediffmail link robustly
    const findRediffmail = async (pg: Page) => {
      // Prefer semantic role locator if available
      const byRole = pg.getByRole('link', { name: /Rediffmail/i });
      if (await byRole.count() > 0) return byRole.first();
      // fallback: anchor with text
      const byText = pg.locator('a:has-text("Rediffmail")').first();
      if (await byText.count() > 0) return byText;
      return null;
    };

    // TC-003: Visibility of "Rediffmail" option in header (AC2)
    const rediffLinkLocator = await findRediffmail(page);
    expect(rediffLinkLocator, 'Rediffmail link should be present').not.toBeNull();
    if (rediffLinkLocator) {
      const visible = await rediffLinkLocator.isVisible();
      expect(visible, '"Rediffmail" should be visible').toBeTruthy();
      // Basic keyboard accessibility: it should be focusable
      const aria = await rediffLinkLocator.getAttribute('aria-label');
      // Not mandatory to have aria-label, but link should have accessible name
      const accessibleName = aria || (await rediffLinkLocator.innerText()).trim();
      expect(accessibleName.length).toBeGreaterThan(0);
    }

    // TC-004: Navigation to Rediffmail (AC3)
    if (rediffLinkLocator) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => null),
        rediffLinkLocator.click({ timeout: 10000 }).catch(() => null)
      ]);
      const mailUrl = page.url();
      const mailTitle = await page.title();
      // We expect navigation happened and page loaded (best-effort)
      expect(mailUrl.length).toBeGreaterThan(0);
      expect(mailTitle.length).toBeGreaterThan(0);
      // Optionally assert that the page contains 'Rediffmail' in title or heading
      // This is a best-effort check; site content may vary
      // If exact expectation is required, replace with expected pattern
      // Example expectation (not strict): title or url mentions 'mail' or 'rediffmail'
      expect(/mail|rediffmail/i.test(mailUrl + ' ' + mailTitle)).toBeTruthy();
      // Navigate back to homepage
      await page.goBack({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null);
    }

    // TC-005: Latest news list present on homepage (AC4)
    // Best-effort detection: look for anchors that appear to be news links
    const newsCount = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.filter(a => {
        try {
          const text = (a.innerText || '').trim();
          const href = a.href || '';
          const likelyNews = /news|article|stories/i.test(href) || /news|headline|story|latest/i.test(text);
          return likelyNews && text.length > 3;
        } catch {
          return false;
        }
      }).length;
    });
    expect(newsCount).toBeGreaterThan(0);

    // TC-006: Mobile / responsive header behavior (AC2, AC3)
    // Emulate mobile viewport and check accessibility of Rediffmail (direct or via menu)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    let mobileLocator = await findRediffmail(page);
    let mobileVisible = mobileLocator ? await mobileLocator.isVisible().catch(() => false) : false;
    let openedMenu = false;
    if (!mobileVisible) {
      // Attempt to open a hamburger/menu button (common patterns)
      const menuCandidates = [
        'button[aria-label*="menu"]',
        'button[aria-label*="open"]',
        '.hamburger',
        '.menu-btn',
        'button[title*="Menu"]',
        'button[aria-label*="navigation"]'
      ];
      for (const sel of menuCandidates) {
        const btn = page.locator(sel).first();
        if (await btn.count() > 0) {
          await btn.click().catch(() => null);
          openedMenu = true;
          await page.waitForTimeout(500);
          mobileLocator = await findRediffmail(page);
          mobileVisible = mobileLocator ? await mobileLocator.isVisible().catch(() => false) : false;
          if (mobileVisible) break;
        }
      }
    }
    expect(mobileVisible, 'Rediffmail should be accessible on mobile (direct or via menu)').toBeTruthy();
    // Reset viewport to desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // TC-007: Keyboard accessibility of "Rediffmail" (AC2, AC3)
    // Simulate tabbing through page and ensure focus lands on an element whose accessible name is Rediffmail
    await page.goto('https://www.rediff.com', { waitUntil: 'networkidle' });
    let foundFocus = false;
    for (let i = 0; i < 40; i++) {
      const activeName = await page.evaluate(() => {
        const ae = document.activeElement;
        if (!ae) return '';
        // accessible name or textContent
        return (ae.getAttribute && (ae.getAttribute('aria-label') || ae.getAttribute('title')))
          || (ae.textContent || '').trim() || '';
      });
      if (/Rediffmail/i.test(activeName)) {
        foundFocus = true;
        break;
      }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(80);
    }
    expect(foundFocus, 'Keyboard navigation should reach Rediffmail link').toBeTruthy();

    // Always close the browser at the end of the test per requirement.
    // (Playwright test runner normally manages browser lifecycle; this explicit close is included per instructions.)
    await browser.close();
  });
});
