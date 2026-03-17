"""Final comprehensive site test with working DB on port 4013"""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:4013"
SHOTS = "C:/dev/echocity/test-screenshots/final"
os.makedirs(SHOTS, exist_ok=True)

def shot(page, name):
    page.screenshot(path=f"{SHOTS}/{name}.png", full_page=True)
    print(f"  [shot] {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # === DESKTOP ===
    print("=== DESKTOP ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    # Home
    page.goto(f"{BASE}/", timeout=30000)
    page.wait_for_timeout(5000)
    shot(page, "d-home")

    # Offers - wait for cards to load
    page.goto(f"{BASE}/offers", timeout=30000)
    page.wait_for_timeout(8000)
    cards = page.locator('a[href*="/offers/"]').count()
    print(f"  /offers -> cards: {cards}")
    shot(page, "d-offers")

    # Click first offer
    if cards > 0:
        page.locator('a[href*="/offers/"]').first.click()
        page.wait_for_timeout(5000)
        shot(page, "d-offer-detail")
        print(f"  Offer detail URL: {page.url}")
        page.go_back()

    # Subscription
    page.goto(f"{BASE}/subscription", timeout=30000)
    page.wait_for_timeout(8000)
    has_plans = page.locator('text=Plus').count()
    print(f"  /subscription -> Plus text: {has_plans}")
    shot(page, "d-subscription")

    # Login
    page.goto(f"{BASE}/auth/login", timeout=30000)
    page.wait_for_timeout(3000)
    shot(page, "d-login")

    # Map
    page.goto(f"{BASE}/map", timeout=30000)
    page.wait_for_timeout(5000)
    shot(page, "d-map")

    ctx.close()

    # === MOBILE ===
    print("\n=== MOBILE (375px) ===")
    ctx = browser.new_context(viewport={"width": 375, "height": 667}, is_mobile=True)
    page = ctx.new_page()

    page.goto(f"{BASE}/", timeout=30000)
    page.wait_for_timeout(5000)
    shot(page, "m-home")

    page.goto(f"{BASE}/offers", timeout=30000)
    page.wait_for_timeout(8000)
    cards = page.locator('a[href*="/offers/"]').count()
    print(f"  /offers mobile -> cards: {cards}")
    shot(page, "m-offers")

    page.goto(f"{BASE}/subscription", timeout=30000)
    page.wait_for_timeout(8000)
    shot(page, "m-subscription")

    ctx.close()

    # === BUSINESS PAGES ===
    print("\n=== BUSINESS ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    for path, name in [("/business/offers", "biz-offers"), ("/business/offers/new", "biz-wizard"),
                        ("/admin", "admin"), ("/admin/offers", "admin-offers")]:
        page.goto(f"{BASE}{path}", timeout=30000)
        page.wait_for_timeout(5000)
        shot(page, name)

    ctx.close()
    browser.close()
    print("\nDone!")
