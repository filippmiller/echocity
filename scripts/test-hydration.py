"""Test if skeletons resolve after longer wait (hydration timing)"""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:4000"
SHOTS = "C:/dev/echocity/test-screenshots/v3"
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    # Capture console for debugging
    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warn"] else None)

    # TEST OFFERS PAGE with long wait
    print("=== OFFERS PAGE ===")
    page.goto(f"{BASE}/offers", wait_until="networkidle", timeout=30000)
    page.screenshot(path=f"{SHOTS}/offers-0s.png")
    page.wait_for_timeout(3000)
    page.screenshot(path=f"{SHOTS}/offers-3s.png")
    page.wait_for_timeout(5000)
    page.screenshot(path=f"{SHOTS}/offers-8s.png")

    # Check if offer cards loaded
    cards = page.locator('a[href*="/offers/"]').count()
    print(f"  Offer card links after 8s: {cards}")

    # Check DOM for what's visible
    skeletons = page.locator('.animate-pulse').count()
    print(f"  Skeleton elements: {skeletons}")

    # TEST SUBSCRIPTION PAGE
    print("\n=== SUBSCRIPTION PAGE ===")
    page.goto(f"{BASE}/subscription", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(5000)
    page.screenshot(path=f"{SHOTS}/sub-5s.png")

    # Check for plan cards
    plan_text = page.locator('text=Plus').count()
    print(f"  'Plus' text found: {plan_text}")
    crown_text = page.locator('text=Выберите свой план').count()
    print(f"  Header text found: {crown_text}")

    if errors:
        print(f"\n  Console errors/warnings ({len(errors)}):")
        for e in errors[:10]:
            print(f"    {e[:150]}")

    ctx.close()
    browser.close()
    print("\nDone!")
