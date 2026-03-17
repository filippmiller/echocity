"""Intercept network requests to debug why client fetches fail"""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:4000"
SHOTS = "C:/dev/echocity/test-screenshots/v3"
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    # Track ALL network requests
    requests_log = []
    def on_request(req):
        if '/api/' in req.url:
            requests_log.append(f"REQ: {req.method} {req.url}")

    def on_response(resp):
        if '/api/' in resp.url:
            requests_log.append(f"RESP: {resp.status} {resp.url}")

    def on_request_failed(req):
        if '/api/' in req.url:
            requests_log.append(f"FAIL: {req.url} - {req.failure}")

    page.on("request", on_request)
    page.on("response", on_response)
    page.on("requestfailed", on_request_failed)

    # Track console
    console_log = []
    page.on("console", lambda msg: console_log.append(f"[{msg.type}] {msg.text}"))

    print("=== OFFERS PAGE ===")
    page.goto(f"{BASE}/offers", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(5000)

    print("Network requests:")
    for r in requests_log:
        print(f"  {r}")

    print(f"\nConsole ({len(console_log)} messages):")
    for c in console_log[:15]:
        print(f"  {c[:150]}")

    # Check page HTML for clues
    body_text = page.inner_text("body")
    if "Нет активных" in body_text:
        print("\n  >> Page shows 'No active offers' message")
    elif "Скидки" in body_text:
        print(f"\n  >> Page contains 'Скидки', body text length: {len(body_text)}")

    # Try direct fetch from page context
    print("\n=== MANUAL FETCH FROM PAGE ===")
    result = page.evaluate("""
        async () => {
            try {
                const res = await fetch('/api/offers');
                const data = await res.json();
                return { status: res.status, count: data.offers?.length || 0, error: null };
            } catch (e) {
                return { status: null, count: 0, error: e.message };
            }
        }
    """)
    print(f"  Manual fetch result: {result}")

    ctx.close()
    browser.close()
    print("\nDone!")
