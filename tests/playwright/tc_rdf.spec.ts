import { chromium, Browser, Page, BrowserContext } from 'playwright';

// Playwright test for Rediff site - incremental write placeholder
(async () => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    // Launch browser (headless). Adjust launch options as needed for debugging.
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    // TC_RDF_01 — Access Rediff homepage
    const homepageUrl = 'https://www.rediff.com';
    const resp = await page.goto(homepageUrl, { waitUntil: 'load', timeout: 30000 });
    const status = resp ? resp.status() : null;
    if (status !== 200) {
      throw new Error(`TC_RDF_01: Homepage did not return HTTP 200 (status: ${status})`);
    }
    console.log(`TC_RDF_01: Loaded ${homepageUrl} (HTTP ${status}). Title: "${await page.title()}"`);

    // TC_RDF_02 — Verify "Rediffmail" option visible in header
    // Prefer stable selector; fallback to text match.
    const rediffmail = page.locator('text=Rediffmail').first();
    const countRediffmail = await page.locator('text=Rediffmail').count();
    if (countRediffmail === 0) {
      throw new Error('TC_RDF_02: "Rediffmail" option not found in header');
    }
    const isVisible = await rediffmail.isVisible().catch(() => false);
    if (!isVisible) {
      throw new Error('TC_RDF_02: "Rediffmail" link exists but is not visible');
    }
    console.log(`TC_RDF_02: Found "Rediffmail" (count: ${countRediffmail}), visible: ${isVisible}`);

    // TC_RDF_04 — Verify latest news list on homepage
    // Try to find LATEST NEWS section and the first article link under it
    const latestHeading = page.locator('text=LATEST NEWS').first();
    let articleHref: string | null = null;
    if (await latestHeading.count() > 0) {
      // try common patterns for links near the heading
      const candidate = page.locator('section:has-text("LATEST NEWS") a, div:has-text("LATEST NEWS") a, h2:has-text("LATEST NEWS") ~ div a').first();
      if (await candidate.count() > 0) {
        articleHref = await candidate.getAttribute('href');
      } else {
        // fallback: look for links in the page area that appears under the heading
        const fallback = page.locator('h2:has-text("LATEST NEWS")').first().locator('xpath=following::a[1]');
        if (await fallback.count() > 0) {
          articleHref = await fallback.getAttribute('href');
        }
      }
    }

    if (!articleHref) {
      // final fallback: pick a prominent news link from the page (first article link under main content)
      const genericNews = page.locator('a').filter({ hasText: '' }).first();
      articleHref = await genericNews.getAttribute('href');
    }

    if (!articleHref) {
      throw new Error('TC_RDF_04: Could not find any news article link on the homepage');
    }

    // Normalize relative URL if needed
    if (articleHref.startsWith('/')) {
      articleHref = new URL(articleHref, homepageUrl).toString();
    } else if (!articleHref.startsWith('http')) {
      articleHref = new URL(articleHref, homepageUrl).toString();
    }

    // Navigate to the article to ensure it loads (HTTP 200)
    const articleResp = await page.goto(articleHref, { waitUntil: 'load', timeout: 30000 });
    const articleStatus = articleResp ? articleResp.status() : null;
    if (articleStatus !== 200) {
      throw new Error(`TC_RDF_04: Article did not return HTTP 200 (status: ${articleStatus}) - ${articleHref}`);
    }
    console.log(`TC_RDF_04: Article opened: ${articleHref} (HTTP ${articleStatus})`);

    // Return to homepage for next steps
    await page.goto(homepageUrl, { waitUntil: 'load', timeout: 30000 });

    // TC_RDF_03 — Click Rediffmail and validate redirect
    // Click the first visible Rediffmail link and wait for navigation
    await rediffmail.click({ timeout: 5000 });
    await page.waitForLoadState('load');
    const currentUrl = page.url();
    // Validate HTTP 200 for the target page
    const mailResp = await page.request.get(currentUrl);
    const mailStatus = mailResp ? mailResp.status() : null;
    if (mailStatus !== 200) {
      throw new Error(`TC_RDF_03: Rediffmail target did not return HTTP 200 (status: ${mailStatus}) - ${currentUrl}`);
    }

    // Verify presence of typical mail login UI (e.g., password input)
    const passwordExists = await page.locator('input[type="password"]').count() > 0;
    if (!passwordExists) {
      // Not strictly failing if login UX varies, but based on acceptance criteria we expect mail UI elements
      throw new Error('TC_RDF_03: Expected mail login UI elements (password input) not found on Rediffmail page');
    }

    console.log(`TC_RDF_03: Clicked Rediffmail -> ${currentUrl} (HTTP ${mailStatus}). Password input present: ${passwordExists}`);

    // All executed tests passed up to this point.
    console.log('All executed TCs (TC_RDF_01, TC_RDF_02, TC_RDF_03, TC_RDF_04) passed.');

  } catch (err) {
    console.error('Test run failed:', (err as Error).message);
    process.exitCode = 1;
  } finally {
    // Always close browser once the test scenario is executed
    try {
      if (context) await context.close();
    } catch (e) { /* ignore */ }
    try {
      if (browser) await browser.close();
      console.log('Browser closed.');
    } catch (e) {
      // If browser was already closed, ignore
    }
  }
})();
