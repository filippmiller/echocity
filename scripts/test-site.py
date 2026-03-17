"""
Live headful site testing for EchoCity (ГдеСейчас)
Tests all major pages and flows on port 3023
"""
from playwright.sync_api import sync_playwright
import os, json, time

BASE = "http://localhost:3023"
SHOTS = "C:/dev/echocity/test-screenshots"
os.makedirs(SHOTS, exist_ok=True)

def screenshot(page, name, full_page=True):
    path = f"{SHOTS}/{name}.png"
    page.screenshot(path=path, full_page=full_page)
    print(f"  [screenshot] {name}.png")

def test_public_pages(browser):
    """Test all public-facing pages at desktop + mobile viewports"""
    print("\n=== PUBLIC PAGES ===")

    # Desktop viewport
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    pages_to_test = [
        ("/", "home"),
        ("/offers", "offers"),
        ("/map", "map"),
        ("/search", "search"),
        ("/subscription", "subscription"),
        ("/auth/login", "login"),
        ("/auth/register", "register"),
    ]

    errors = []
    for path, name in pages_to_test:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            status = resp.status if resp else "no response"
            print(f"  {path} -> {status}")
            screenshot(page, f"desktop-{name}")
            if resp and resp.status >= 500:
                errors.append((path, status))
        except Exception as e:
            print(f"  {path} -> ERROR: {e}")
            errors.append((path, str(e)))

    ctx.close()

    # Mobile viewport (375px iPhone SE)
    print("\n=== MOBILE PAGES (375px) ===")
    ctx = browser.new_context(viewport={"width": 375, "height": 667}, is_mobile=True)
    page = ctx.new_page()

    for path, name in pages_to_test:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            status = resp.status if resp else "no response"
            print(f"  {path} -> {status}")
            screenshot(page, f"mobile-{name}")
        except Exception as e:
            print(f"  {path} -> ERROR: {e}")

    ctx.close()
    return errors

def test_auth_flow(browser):
    """Test login flow with test account"""
    print("\n=== AUTH FLOW ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    page.goto(f"{BASE}/auth/login", wait_until="networkidle", timeout=15000)
    screenshot(page, "auth-login-page")

    # Check for login form elements
    email_input = page.locator('input[type="email"], input[name="email"]')
    password_input = page.locator('input[type="password"], input[name="password"]')

    email_count = email_input.count()
    pass_count = password_input.count()
    print(f"  Email inputs found: {email_count}")
    print(f"  Password inputs found: {pass_count}")

    if email_count > 0 and pass_count > 0:
        # Try logging in as citizen
        email_input.first.fill("user@echocity.ru")
        password_input.first.fill("Test1234!")
        screenshot(page, "auth-login-filled")

        # Find and click submit
        submit = page.locator('button[type="submit"]')
        if submit.count() > 0:
            submit.first.click()
            page.wait_for_timeout(3000)
            screenshot(page, "auth-login-result")
            print(f"  After login URL: {page.url}")
        else:
            print("  No submit button found")
    else:
        print("  Login form not found - checking page content")
        # Check what's actually on the page
        buttons = page.locator('button').all_text_contents()
        print(f"  Buttons found: {buttons[:5]}")
        links = page.locator('a').all_text_contents()
        print(f"  Links found: {links[:10]}")

    ctx.close()

def test_offer_detail(browser):
    """Test offer detail page"""
    print("\n=== OFFER DETAIL ===")
    ctx = browser.new_context(viewport={"width": 375, "height": 667}, is_mobile=True)
    page = ctx.new_page()

    # First go to offers list to find an offer
    page.goto(f"{BASE}/offers", wait_until="networkidle", timeout=15000)
    screenshot(page, "offers-list")

    # Find offer cards/links
    offer_links = page.locator('a[href*="/offers/"]')
    count = offer_links.count()
    print(f"  Offer links found: {count}")

    if count > 0:
        href = offer_links.first.get_attribute("href")
        print(f"  Clicking first offer: {href}")
        offer_links.first.click()
        page.wait_for_load_state("networkidle")
        screenshot(page, "offer-detail")
        print(f"  Offer detail URL: {page.url}")

    ctx.close()

def test_business_pages(browser):
    """Test business dashboard pages (requires auth)"""
    print("\n=== BUSINESS PAGES (no auth) ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    biz_pages = [
        ("/business", "business-dashboard"),
        ("/business/offers", "business-offers"),
        ("/business/offers/new", "business-offer-wizard"),
        ("/business/staff", "business-staff"),
        ("/business/scanner", "business-scanner"),
    ]

    for path, name in biz_pages:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            status = resp.status if resp else "no response"
            print(f"  {path} -> {status}")
            screenshot(page, name)
        except Exception as e:
            print(f"  {path} -> ERROR: {e}")

    ctx.close()

def test_admin_pages(browser):
    """Test admin pages"""
    print("\n=== ADMIN PAGES ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    admin_pages = [
        ("/admin", "admin-dashboard"),
        ("/admin/offers", "admin-offers"),
        ("/admin/users", "admin-users"),
        ("/admin/businesses", "admin-businesses"),
    ]

    for path, name in admin_pages:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            status = resp.status if resp else "no response"
            print(f"  {path} -> {status}")
            screenshot(page, name)
        except Exception as e:
            print(f"  {path} -> ERROR: {e}")

    ctx.close()

def check_console_errors(browser):
    """Check for JS console errors on key pages"""
    print("\n=== CONSOLE ERRORS CHECK ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    console_errors = []
    page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    key_pages = ["/", "/offers", "/subscription", "/map"]
    for path in key_pages:
        console_errors.clear()
        try:
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(2000)
            if console_errors:
                print(f"  {path} - {len(console_errors)} errors:")
                for err in console_errors[:3]:
                    print(f"    {err[:120]}")
            else:
                print(f"  {path} - clean")
        except Exception as e:
            print(f"  {path} -> {e}")

    ctx.close()

if __name__ == "__main__":
    print("Starting EchoCity live site test...")
    print(f"Target: {BASE}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        public_errors = test_public_pages(browser)
        test_auth_flow(browser)
        test_offer_detail(browser)
        test_business_pages(browser)
        test_admin_pages(browser)
        check_console_errors(browser)

        browser.close()

    print("\n=== SUMMARY ===")
    print(f"Screenshots saved to: {SHOTS}/")
    if public_errors:
        print(f"Pages with errors: {public_errors}")
    else:
        print("All public pages loaded successfully")
    print("Done!")
