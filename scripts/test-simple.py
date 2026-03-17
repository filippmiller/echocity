"""Simple network debug - no evaluate, just intercept"""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:4000"
SHOTS = "C:/dev/echocity/test-screenshots/v3"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    reqs = []
    page.on("request", lambda r: reqs.append(f"-> {r.method} {r.url}") if '/api/' in r.url else None)
    page.on("response", lambda r: reqs.append(f"<- {r.status} {r.url}") if '/api/' in r.url else None)
    page.on("requestfailed", lambda r: reqs.append(f"!! FAIL {r.url} {r.failure}") if '/api/' in r.url else None)

    console = []
    page.on("console", lambda m: console.append(f"[{m.type}] {m.text}"))

    # Just load the page and wait, don't try evaluate
    print("Loading /offers...")
    try:
        page.goto(f"{BASE}/offers", timeout=20000)
    except:
        print("  goto timed out, checking state anyway")

    page.wait_for_timeout(3000)

    print(f"\nAPI requests ({len(reqs)}):")
    for r in reqs:
        print(f"  {r}")

    print(f"\nConsole ({len(console)} msgs):")
    for c in console[:10]:
        print(f"  {c[:150]}")

    page.screenshot(path=f"{SHOTS}/debug-offers.png")
    browser.close()
    print("Done!")
