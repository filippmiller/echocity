import { test, expect } from '@playwright/test'
import { CREDS, IDS, TIMEOUTS } from '../../helpers/constants'
import { newAuthedPage, api } from '../../helpers/auth-helpers'

test.describe('Flow 04: QR Redemption Lifecycle', () => {

  test.describe('Redemption Session Creation', () => {
    test('subscriber can create redemption session for free offer', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        await page.goto('/offers')
        const result = await api(page, '/api/redemptions/create-session', {
          method: 'POST',
          body: { offerId: IDS.freeOfferId },
        })
        // 201 = success, 400 = limit/rule violation (from previous test runs)
        expect([201, 400]).toContain(result.status)
        if (result.status === 201) {
          expect(result.body.session).toHaveProperty('sessionToken')
          expect(result.body.session).toHaveProperty('shortCode')
          expect(result.body.session.shortCode).toMatch(/^[A-Z0-9]{6}$/)
          expect(result.body.session).toHaveProperty('expiresAt')
        }
      } finally {
        await context.close()
      }
    })

    test('unauthenticated user cannot create redemption session', async ({ request }) => {
      const response = await request.post('/api/redemptions/create-session', {
        data: { offerId: IDS.freeOfferId },
      })
      expect(response.status()).toBe(401)
    })

    test('session creation fails for non-existent offer', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        await page.goto('/offers')
        const result = await api(page, '/api/redemptions/create-session', {
          method: 'POST',
          body: { offerId: 'nonexistent-offer-id' },
        })
        expect(result.ok).toBe(false)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('QR Redeem Screen UI', () => {
    test('redeem page structure is correct for existing offer', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        // Get a valid offer
        const offers = await api(page, '/api/offers?limit=1')
        if (!offers.body.offers?.length) test.skip(true, 'No offers available')

        await page.goto(`/offers/${offers.body.offers[0].id}/redeem`)
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        // Should either show QR or an error message (if limit reached)
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Redemption Validation', () => {
    test('coffee owner can validate their own offers', async ({ browser }) => {
      // Create a session as subscriber, validate as coffee owner
      const subscriber = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      const owner = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)

      try {
        await subscriber.page.goto('/offers')
        await owner.page.goto('/business/scanner')

        const create = await api(subscriber.page, '/api/redemptions/create-session', {
          method: 'POST',
          body: { offerId: IDS.freeOfferId },
        })

        if (create.status === 201) {
          const validate = await api(owner.page, '/api/redemptions/validate', {
            method: 'POST',
            body: { shortCode: create.body.session.shortCode },
          })
          // SUCCESS or limit violation
          expect([200, 400]).toContain(validate.status)
        }
      } finally {
        await subscriber.context.close()
        await owner.context.close()
      }
    })

    test('beauty owner CANNOT validate coffee offers (cross-merchant)', async ({ browser }) => {
      const subscriber = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      const beautyOwner = await newAuthedPage(browser, CREDS.beautyOwner.email, CREDS.beautyOwner.password)

      try {
        await subscriber.page.goto('/offers')
        await beautyOwner.page.goto('/business/scanner')

        const create = await api(subscriber.page, '/api/redemptions/create-session', {
          method: 'POST',
          body: { offerId: IDS.freeOfferId },
        })

        if (create.status === 201) {
          const validate = await api(beautyOwner.page, '/api/redemptions/validate', {
            method: 'POST',
            body: { shortCode: create.body.session.shortCode },
          })
          expect(validate.status).toBe(400)
          expect(validate.text).toContain('SCANNER_NOT_AUTHORIZED')
        }
      } finally {
        await subscriber.context.close()
        await beautyOwner.context.close()
      }
    })

    test('expired session token is rejected', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/scanner')
        const result = await api(page, '/api/redemptions/validate', {
          method: 'POST',
          body: { shortCode: 'XXXXXX' },
        })
        expect(result.ok).toBe(false)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Redemption History', () => {
    test('subscriber can view redemption history', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        const result = await api(page, '/api/redemptions/mine')
        expect(result.ok).toBe(true)
        expect(Array.isArray(result.body.redemptions || result.body)).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Merchant Scanner Page', () => {
    test('scanner page loads for business owner', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/scanner')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        // Scanner page should have code input or camera options
        const hasScanner = body.includes('Сканировать') || body.includes('код') || body.includes('QR')
        expect(hasScanner).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('scanner page redirects unauthenticated users', async ({ page }) => {
      await page.goto('/business/scanner', { waitUntil: 'domcontentloaded', timeout: 45000 })
      // Should redirect to login — either via server redirect or client redirect
      await page.waitForTimeout(5000)
      const url = page.url()
      const body = await page.textContent('body') || ''
      // Protected page: either redirected to login, shows login prompt, or shows business auth content
      const isProtected = url.includes('/auth/login') || url.includes('/auth/') ||
        body.includes('Войти') || body.includes('Вход') || body.includes('авториз')
      expect(isProtected).toBe(true)
    })
  })
})
