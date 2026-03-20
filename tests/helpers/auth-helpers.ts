import type { Page, BrowserContext, Browser } from '@playwright/test'
import { TIMEOUTS } from './constants'

/**
 * Login via the /auth/login page.
 * Waits for redirect away from login page (indicating success).
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), {
    timeout: TIMEOUTS.navigation,
  })
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
        origin: process.env.BASE_URL || 'https://echocity.filippmiller.com',
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
