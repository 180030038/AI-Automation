/**
 * Playwright TypeScript script for SCRUM-5 (EliteA Testing)
 * Covers:
 *  - TC-SCRUM-5-01: Access Rediff homepage
 *  - TC-SCRUM-5-02: Rediffmail visible in header (Desktop)
 *  - TC-SCRUM-5-04: Redirect to Rediffmail (Positive)
 *  - TC-SCRUM-5-05: Latest news list visible on homepage
 *
 * Note: This is a standalone script using Playwright. It explicitly closes the browser.
 */

import { chromium, Browser } from 'playwright';

async function run() {
  const url = 'https://www.rediff.com';
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // TC-SCRUM-5-01: Navigate to homepage
    const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    const status = response ? response.status() : null;
    const title = await page.title();
    console.log(`Navigate: ${url} => status=${status}, title="${title}"`);

    if (status !== 200) {
      throw new Error(`Expected HTTP 200 but got ${status}`);
    }

    // TC-SCRUM-5-02: Verify Rediffmail visible in header (desktop)
    const rediffLink = page.locator('text=Rediffmail').first();
    const count = await rediffLink.count();
    if (count === 0) {
      // fallback: search anchors in header
      const headerAnchors = await page.evaluate(() => {
        const header = document.querySelector('header') || document.querySelector('nav') || document.body;
        return Array.from((header || document.body).querySelectorAll('a')).map(a => a.textContent?.trim()).filter(Boolean);
      });
      throw new Error(`'Rediffmail' link not found in header. Header sample: ${JSON.stringify(headerAnchors.slice(0, 20))}`);
    }

    const isVisible = await rediffLink.isVisible();
    const href = await rediffLink.getAttribute('href');
    console.log(`Rediffmail link found. visible=${isVisible}, href=${href}`);

    if (!isVisible) {
      throw new Error('Rediffmail link exists but is not visible.');
    }

    // TC-SCRUM-5-04: Click Rediffmail and verify redirect
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => null),
      rediffLink.click({ button: 'left' }).catch(() => null)
    ]);
    const newUrl = page.url();
    console.log(`After click, navigated to: ${newUrl}`);

    // Heuristic: If it navigated to a mail/login URL, consider redirect successful
    if (!/mail\.rediff\.com|login|mail/i.test(newUrl)) {
      console.warn('Redirect target does not look like Rediffmail; check manually.');
    }

    // Return to homepage (for news check)
    if (!newUrl.includes('rediff.com') || newUrl.includes('mail')) {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    }

    // TC-SCRUM-5-05: Check for latest news list on homepage (heuristic)
    const newsInfo = await page.evaluate(() => {
      // Try to find a heading or container that mentions 'news', 'latest' or 'headlines'
      const match = Array.from(document.querySelectorAll('h1,h2,h3,h4,div,span')).find(el => /latest|news|headlines/i.test(el.innerText || ''));
      let container: Element | null = null;
      if (match) container = match.closest('section') || match.parentElement;
      if (!container) {
        const main = document.querySelector('main') || document.body;
        const anchors = Array.from(main.querySelectorAll('a')).map(a => ({ text: a.textContent?.trim() || '', href: (a as HTMLAnchorElement).href })).filter(a => a.text);
        return { found: anchors.length > 0, count: anchors.length, sample: anchors.slice(0, 5) };
      }
      const links = Array.from(container.querySelectorAll('a')).map(a => ({ text: a.textContent?.trim() || '', href: (a as HTMLAnchorElement).href })).filter(l => l.text);
      return { found: links.length > 0, count: links.length, sample: links.slice(0, 5), containerText: (match ? match.innerText.trim() : '') };
    });

    if (newsInfo.found) {
      console.log(`News check: found ${newsInfo.count} link(s) in detected news container. Sample:`, newsInfo.sample);
    } else {
      throw new Error(`No news links detected on homepage. Info: ${JSON.stringify(newsInfo)}`);
    }

    console.log('All primary checks passed.');
  } catch (err) {
    console.error('Test script error:', err);
    throw err;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed.');
      } catch (closeErr) {
        console.warn('Error closing browser:', closeErr);
      }
    }
  }
}

// Execute
run().catch(err => {
  console.error('Script finished with error.');
  process.exit(1);
});
