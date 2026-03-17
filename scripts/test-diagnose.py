"""Diagnose offer detail skeleton bug + fix places + retest"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:4013"
SHOTS = "C:/dev/echocity/test-screenshots/diagnose"
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    # Capture console errors
    errors = []
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}"))

    # Track API requests
    api_reqs = []
    page.on("response", lambda r: api_reqs.append(f"{r.status} {r.url}") if '/api/' in r.url else None)

    # Test offer detail page
    print("=== OFFER DETAIL ===")
    page.goto(f"{BASE}/offers/offer-bundle-coffee", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(3000)
    page.screenshot(path=f"{SHOTS}/offer-detail-3s.png", full_page=True)

    # Check for skeleton vs real content
    skeletons = page.locator('.animate-pulse').count()
    title_text = page.locator('h1').text_content() if page.locator('h1').count() > 0 else "NO H1"
    print(f"  Skeletons: {skeletons}")
    print(f"  H1: {title_text}")
    print(f"  URL: {page.url}")

    page.wait_for_timeout(5000)
    page.screenshot(path=f"{SHOTS}/offer-detail-8s.png", full_page=True)
    skeletons2 = page.locator('.animate-pulse').count()
    title_text2 = page.locator('h1').text_content() if page.locator('h1').count() > 0 else "NO H1"
    print(f"  After 8s - Skeletons: {skeletons2}, H1: {title_text2}")

    print(f"\n  API requests:")
    for r in api_reqs:
        print(f"    {r}")

    if errors:
        print(f"\n  Console ({len(errors)}):")
        for e in errors[:15]:
            print(f"    {e[:200]}")

    # Test map page
    print("\n=== MAP PAGE ===")
    api_reqs.clear()
    errors.clear()
    page.goto(f"{BASE}/map", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(5000)
    page.screenshot(path=f"{SHOTS}/map-5s.png", full_page=True)

    places_text = page.locator('text=Места').text_content() if page.locator('text=Места').count() > 0 else "NO PLACES TEXT"
    print(f"  Places header: {places_text}")

    if api_reqs:
        print(f"  API:")
        for r in api_reqs:
            print(f"    {r}")
    if errors:
        print(f"  Console:")
        for e in errors[:10]:
            print(f"    {e[:200]}")

    ctx.close()
    browser.close()
    print("\nDone!")
