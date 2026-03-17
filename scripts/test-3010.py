"""Quick CSS check on port 3010"""
from playwright.sync_api import sync_playwright
import os

SHOTS = "C:/dev/echocity/test-screenshots"
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    resp = page.goto("http://localhost:3010", wait_until="networkidle", timeout=15000)
    print(f"Home: {resp.status}")
    page.screenshot(path=f"{SHOTS}/port3010-home.png", full_page=True)

    resp = page.goto("http://localhost:3010/offers", wait_until="networkidle", timeout=15000)
    print(f"Offers: {resp.status}")
    page.screenshot(path=f"{SHOTS}/port3010-offers.png", full_page=True)

    resp = page.goto("http://localhost:3010/subscription", wait_until="networkidle", timeout=15000)
    print(f"Subscription: {resp.status}")
    page.screenshot(path=f"{SHOTS}/port3010-subscription.png", full_page=True)

    resp = page.goto("http://localhost:3010/auth/login", wait_until="networkidle", timeout=15000)
    print(f"Login: {resp.status}")
    page.screenshot(path=f"{SHOTS}/port3010-login.png", full_page=True)

    # Mobile
    page2 = browser.new_page(viewport={"width": 375, "height": 667}, is_mobile=True)
    resp = page2.goto("http://localhost:3010", wait_until="networkidle", timeout=15000)
    print(f"Mobile home: {resp.status}")
    page2.screenshot(path=f"{SHOTS}/port3010-mobile-home.png", full_page=True)

    browser.close()
    print("Done - screenshots saved")
