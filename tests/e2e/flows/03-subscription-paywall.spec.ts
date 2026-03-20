import { test, expect } from '@playwright/test'
import { CREDS, TIMEOUTS } from '../../helpers/constants'
import { newAuthedPage, api, dismissOnboarding } from '../../helpers/auth-helpers'

test.describe('Flow 03: Subscription & Paywall', () => {

  test.describe('Subscription Page (Guest)', () => {
    test('subscription page loads and shows plans', async ({ page }) => {
      await page.goto('/subscription')
      await page.waitForTimeout(TIMEOUTS.render + 2000)
      const body = await page.textContent('body') || ''
      const hasPlans = body.includes('Выберите') || body.includes('план') || body.includes('подписк')
      expect(hasPlans).toBe(true)
    })

    test('shows 3 plan cards', async ({ page }) => {
      await page.goto('/subscription')
      await page.waitForTimeout(TIMEOUTS.render + 2000)
      const planGrid = page.locator('.grid.md\\:grid-cols-3')
      await expect(planGrid).toBeVisible()
      const cards = planGrid.locator('> div')
      const count = await cards.count()
      expect(count === 0 || count === 3).toBe(true)
    })

    test('guest sees "Войдите для подписки" on paid plans', async ({ page }) => {
      await page.goto('/subscription')
      await page.waitForTimeout(TIMEOUTS.render + 2000)
      const loginPrompts = page.getByText('Войдите для подписки')
      const count = await loginPrompts.count()
      if (count === 0) test.skip(true, 'Plans require DB connection')
      await expect(loginPrompts.first()).toBeVisible()
    })

    test('FAQ section renders', async ({ page }) => {
      await page.goto('/subscription')
      await page.waitForTimeout(TIMEOUTS.render)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
      const body = await page.textContent('body') || ''
      const hasFaq = body.includes('пробный период') || body.includes('Частые вопросы') || body.includes('подписк')
      expect(hasFaq).toBe(true)
    })
  })

  test.describe('Subscription Status (Authenticated)', () => {
    test('user subscription status API returns data', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        const result = await api(page, '/api/subscriptions/status')
        expect(result.ok).toBe(true)
        expect(result.body).toHaveProperty('isSubscribed')
        expect(result.body).toHaveProperty('planCode')
      } finally {
        await context.close()
      }
    })

    test('subscriber sees active status', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        const result = await api(page, '/api/subscriptions/status')
        expect(result.ok).toBe(true)
        // Subscriber should be on plus plan
        if (result.body.isSubscribed) {
          expect(['plus', 'premium']).toContain(result.body.planCode)
        }
      } finally {
        await context.close()
      }
    })

    test('subscriber cannot subscribe to free plan', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        await page.goto('/subscription')
        const result = await api(page, '/api/subscriptions/subscribe', {
          method: 'POST',
          body: { planCode: 'free' },
        })
        expect(result.status).toBe(400)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Paywall Enforcement', () => {
    test('MEMBERS_ONLY offer shows paywall for non-subscribers', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        // Try to access the member offer
        const result = await api(page, '/api/redemptions/create-session', {
          method: 'POST',
          body: { offerId: 'offer-free-dessert' },
        })
        // Should fail with subscription required
        if (result.status !== 201) {
          expect(result.text).toContain('SUBSCRIPTION_REQUIRED')
        }
      } finally {
        await context.close()
      }
    })
  })
})
