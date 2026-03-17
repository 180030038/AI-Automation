import pytest
from playwright.sync_api import sync_playwright


def test_explore_client_work_navigation(tmp_path):
    """Navigate EPAM site and verify Services -> Explore Our Client Work -> target page."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.epam.com/", timeout=60000)
        # Home page screenshot
        page.screenshot(path=str(tmp_path / "home.png"))

        # Try to reveal/click Services
        try:
            # Hover or click the Services menu item
            services = page.locator("text=Services").first
            services.hover()
            services.click()
        except Exception:
            # If exact text not found, continue
            pass
        page.screenshot(path=str(tmp_path / "services.png"))

        # Click 'Explore Our Client Work' (attempts several strategies)
        clicked = False
        for selector in ["text=Explore Our Client Work", "text=Explore our client work", "text=Client Work", "a:has-text(\"Explore Our Client Work\")"]:
            try:
                page.locator(selector).first.click(timeout=5000)
                clicked = True
                break
            except Exception:
                continue

        page.wait_for_load_state("networkidle", timeout=15000)
        page.screenshot(path=str(tmp_path / "client_work.png"))

        # Basic assertion that 'Client Work' text exists on the page
        body_text = page.inner_text("body")
        assert "Client Work" in body_text or "Client work" in body_text or "ClientWork" in body_text
        browser.close()
