"""Full site test on port 4000 (clean build)"""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:4000"
SHOTS = "C:/dev/echocity/test-screenshots/v2"
os.makedirs(SHOTS, exist_ok=True)

def screenshot(page, name):
    page.screenshot(path=f"{SHOTS}/{name}.png", full_page=True)
    print(f"  [shot] {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # === DESKTOP ===
    print("=== DESKTOP (1280x800) ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    for path, name in [("/", "home"), ("/offers", "offers"), ("/subscription", "subscription"),
                        ("/auth/login", "login"), ("/map", "map"), ("/search", "search")]:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
            print(f"  {path} -> {resp.status if resp else '?'}")
            screenshot(page, f"d-{name}")
        except Exception as e:
            print(f"  {path} -> TIMEOUT/ERROR: {str(e)[:80]}")
            screenshot(page, f"d-{name}-error")

    if console_errors:
        print(f"\n  Console errors: {len(console_errors)}")
        for e in console_errors[:5]:
            print(f"    {e[:120]}")
    ctx.close()

    # === MOBILE ===
    print("\n=== MOBILE (375x667) ===")
    ctx = browser.new_context(viewport={"width": 375, "height": 667}, is_mobile=True)
    page = ctx.new_page()

    for path, name in [("/", "home"), ("/offers", "offers"), ("/subscription", "sub"),
                        ("/auth/login", "login")]:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
            print(f"  {path} -> {resp.status if resp else '?'}")
            screenshot(page, f"m-{name}")
        except Exception as e:
            print(f"  {path} -> TIMEOUT/ERROR: {str(e)[:80]}")
            screenshot(page, f"m-{name}-error")
    ctx.close()

    # === BUSINESS & ADMIN ===
    print("\n=== BUSINESS/ADMIN ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    for path, name in [("/business/offers", "biz-offers"), ("/business/offers/new", "biz-wizard"),
                        ("/business/staff", "biz-staff"), ("/business/scanner", "biz-scanner"),
                        ("/admin", "admin"), ("/admin/offers", "admin-offers")]:
        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
            print(f"  {path} -> {resp.status if resp else '?'}")
            screenshot(page, name)
        except Exception as e:
            print(f"  {path} -> TIMEOUT/ERROR: {str(e)[:80]}")
            screenshot(page, f"{name}-error")
    ctx.close()

    browser.close()
    print("\nDone!")
