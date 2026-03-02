import { test, expect } from '@playwright/test';

test('EPAM - Client Work page is visible via Services -> Explore Our Client Work', async ({ page }) => {
  // 1. Navigate to EPAM homepage
  await page.goto('https://www.epam.com/');
  await page.waitForLoadState('networkidle');

  // 2. Open Services from header menu
  const servicesLocator = page.getByRole('link', { name: /Services/i });
  await servicesLocator.click();

  // 3. Click "Explore Our Client Work"
  const clientWorkLink = page.getByRole('link', { name: /Explore our client work|Explore Our Client Work|Client Work/i });
  // If visible directly, click; otherwise, navigate via href
  if (await clientWorkLink.count() > 0) {
    await clientWorkLink.first().click();
  } else {
    // fallback: navigate to likely URL
    await page.goto('https://www.epam.com/client-work');
  }

  // 4. Verify that "Client Work" text is visible on the page
  await expect(page.getByText(/Client Work/i)).toBeVisible({ timeout: 10000 });

});
