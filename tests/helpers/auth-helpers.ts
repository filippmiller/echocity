import type { Page, BrowserContext, Browser } from '@playwright/test'
import { TIMEOUTS } from './constants'

const BASE_URL = process.env.BASE_URL || 'https://echocity.filippmiller.com'

/**
 * Login via API call, then navigate to set the cookie in the browser context.
 * Falls back to UI login if API login fails.
 * Retries up to 3 times with backoff to handle rate limiting.
 */
export async function login(page: Page, email: string, password: string) {
  const maxRetries = 3

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try API-based login first (faster, more reliable)
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Use page.evaluate to call the login API directly (sets session cookie)
      const result = await page.evaluate(
        async ({ email, password }) => {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'same-origin',
          })
          return { status: response.status, ok: response.ok }
        },
        { email, password },
      )

      if (result.ok) {
        // Cookie is set — navigate away from login to confirm session
        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
        return
      }

      if (result.status === 429) {
        // Rate-limited — wait and retry
        const backoffMs = (attempt + 1) * 5000
        await page.waitForTimeout(backoffMs)
        continue
      }

      // Non-rate-limit failure — try UI login as fallback
      await page.getByRole('button', { name: 'Email' }).click()
      await page.waitForTimeout(300)
      await page.locator('#email').fill(email)
      await page.locator('#password').fill(password)
      await page.getByRole('button', { name: 'Войти', exact: true }).click()
      await page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), {
        timeout: TIMEOUTS.navigation,
      })
      return
    } catch (err) {
      if (attempt === maxRetries - 1) throw err
      await page.waitForTimeout((attempt + 1) * 3000)
    }
  }
}

/**
 * Create a new browser context with a logged-in session.
 * Returns { context, page } — caller must close context in afterAll.
 */
export async function newAuthedPage(browser: Browser, email: string, password: string) {
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE_URL,
        localStorage: [{ name: 'echocity_onboarded', value: '1' }],
      }],
    },
  })
  const page = await context.newPage()
  await login(page, email, password)
  return { context, page }
}

/**
 * Make an API call from within a Playwright page context (preserves cookies).
 */
export async function api<T = any>(
  page: Page,
  url: string,
  init?: { method?: string; body?: unknown },
): Promise<{ ok: boolean; status: number; body: T; text: string }> {
  return page.evaluate(
    async ({ url, init }) => {
      const response = await fetch(url, {
        method: init?.method ?? 'GET',
        headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
        credentials: 'same-origin',
      })
      const text = await response.text()
      let body: unknown = null
      try { body = text ? JSON.parse(text) : null } catch { body = text }
      return { ok: response.ok, status: response.status, body, text }
    },
    { url, init },
  ) as Promise<{ ok: boolean; status: number; body: T; text: string }>
}

/**
 * Dismiss onboarding overlay if present.
 */
export async function dismissOnboarding(page: Page) {
  const skipBtn = page.getByText('Пропустить')
  if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await skipBtn.click()
    await page.waitForTimeout(500)
  }
}
