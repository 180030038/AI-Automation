import { test, expect } from '@playwright/test';

test.describe('Navigate to Rediffmail from Rediff homepage', () => {
  test('TC-SCRUM5-001: Homepage accessible and title contains Rediff', async ({ page }) => {
    const resp = await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    expect(resp).not.toBeNull();
    const status = resp ? resp.status() : null;
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    const title = await page.title();
    expect(title).toContain('Rediff');
  });

  test('TC-SCRUM5-002: Rediffmail link is visible and enabled in header (desktop)', async ({ page }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded' });
    const rediffLink = page.locator('a:has-text("Rediffmail")');
    await expect(rediffLink.first()).toBeVisible();
    // Ensure it has an href
    const href = await rediffLink.first().getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('TC-SCRUM5-003 & TC-SCRUM5-007: Clicking Rediffmail navigates to Rediffmail (and target behavior)', async ({ page, context }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded' });

    const link = await page.$('a:has-text("Rediffmail")');
    expect(link).toBeTruthy();

    const target = await link!.getAttribute('target');
    // If link opens a popup/tab, capture it; otherwise wait for navigation in same page.
    if (target === '_blank') {
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        link!.click()
      ]);
      await popup.waitForLoadState('domcontentloaded');
      expect(popup.url()).toContain('rediffmail');
      await popup.close();
    } else {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        link!.click()
      ]);
      expect(page.url()).toContain('rediffmail');
      const title = await page.title();
      expect(title.toLowerCase()).toContain('rediffmail');
      // navigate back for further tests
      await page.goBack({ waitUntil: 'domcontentloaded' });
    }
  });

  test('TC-SCRUM5-004 & TC-SCRUM5-008: News list presence and news links load', async ({ page, context }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded' });

    // Find news anchors (simple heuristic: '/news' in href)
    const newsHrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.toLowerCase().includes('/news') && (a.innerText || '').trim().length > 3)
        .map(a => a.href)
        .slice(0, 5)
    );

    expect(newsHrefs.length).toBeGreaterThanOrEqual(1);

    // Validate first few news pages load (open in new pages to avoid losing homepage)
    for (const href of newsHrefs) {
      const p = await context.newPage();
      const resp = await p.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(resp).not.toBeNull();
      const status = resp ? resp.status() : null;
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(400);
      await p.close();
    }
  });

  test('TC-SCRUM5-005: Keyboard accessibility for Rediffmail (Tab navigation)', async ({ page }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded' });

    let found = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(80);
      const activeText = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return '';
        return (a.innerText || a.textContent || a.getAttribute('aria-label') || '').trim();
      });
      if (activeText.toLowerCase().includes('rediffmail')) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('TC-SCRUM5-006: Mobile responsive check (Rediffmail presence on mobile viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded' });
    // Check presence in DOM and visibility (if in hamburger, this heuristic will still detect DOM presence)
    const hasLink = await page.locator('a:has-text("Rediffmail")').count();
    expect(hasLink).toBeGreaterThan(0);
    await page.setViewportSize({ width: 1366, height: 768 }); // restore
  });

  test('TC-SCRUM5-009: End-to-end navigation and return maintains homepage state', async ({ page }) => {
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded' });
    const link = page.locator('a:has-text("Rediffmail")').first();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      link.click()
    ]);
    // after navigating, go back
    await page.goBack({ waitUntil: 'domcontentloaded' });
    // verify news still present
    const newsCount = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).filter(a => a.href && a.href.toLowerCase().includes('/news') && (a.innerText || '').trim().length > 3 && (a.offsetParent !== null)).length
    );
    expect(newsCount).toBeGreaterThan(0);
  });
});
