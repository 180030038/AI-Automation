import { test, expect, Page } from '@playwright/test';

// Playwright test covering TC-RED-01 through TC-RED-04
test.describe('Rediff smoke tests', () => {
  test('TC-RED-01 to TC-RED-04: Homepage, Rediffmail link, navigation, and news list', async ({ page }) => {
    // TC-RED-01: Open Rediff homepage
    const homepageResponse = await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = homepageResponse ? homepageResponse.status() : null;
    expect(status).toBe(200);
    const homepageTitle = await page.title();
    console.log(`Homepage loaded with status ${status}, title: "${homepageTitle}"`);

    // TC-RED-02: Rediffmail link visibility in header
    const rediffmail = page.locator('text=Rediffmail').first();
    const count = await rediffmail.count();
    expect(count).toBeGreaterThan(0);

    const isVisible = await rediffmail.isVisible();
    expect(isVisible).toBeTruthy();

    const visibleText = (await rediffmail.innerText()).trim();
    expect(visibleText).toBe('Rediffmail');

    const handle = await rediffmail.elementHandle();
    const boundingBox = handle ? await handle.boundingBox() : null;
    console.log(`Rediffmail found (count=${count}), visible=${isVisible}, text=\"${visibleText}\", box=${JSON.stringify(boundingBox)}`);

    // TC-RED-03: Navigate to Rediffmail via href (safe navigation)
    // Some header links open a new tab; extract href and navigate in the same page.
    const href = await page.evaluate((el: HTMLElement | null) => {
      if (!el) return null;
      return (el as HTMLAnchorElement).href || null;
    }, handle);
    expect(href).not.toBeNull();

    const mailResponse = await page.goto(href as string, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const mailStatus = mailResponse ? mailResponse.status() : null;
    expect(mailStatus).toBe(200);
    const mailTitle = await page.title();
    const finalMailUrl = page.url();
    console.log(`Navigated to Rediffmail: ${finalMailUrl} (status ${mailStatus}), title: "${mailTitle}"`);

    // TC-RED-04: View latest news list on homepage
    await page.goto('https://www.rediff.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const newsItems = await page.evaluate(() => {
      const sel = 'a[href*="news"], a[href*="story"], a[href*="article"], a[href*="latest"], a[href*="breaking"]';
      const nodes = Array.from(document.querySelectorAll(sel));
      return nodes.slice(0, 10).map(n => ({ text: (n.textContent || '').trim(), href: (n as HTMLAnchorElement).href }));
    });
    expect(Array.isArray(newsItems)).toBeTruthy();
    expect(newsItems.length).toBeGreaterThan(0);
    console.log(`Found ${newsItems.length} news-related items (sample):`);
    newsItems.slice(0, 5).forEach((it: any, idx: number) => console.log(`  ${idx + 1}. "${it.text}" -> ${it.href}`));
  });
});
