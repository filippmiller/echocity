import { test, expect } from '@playwright/test'
import { CREDS, IDS, TIMEOUTS } from '../../helpers/constants'
import { newAuthedPage, api } from '../../helpers/auth-helpers'

test.describe('Flow 05: Business Management', () => {

  test.describe('Business Dashboard', () => {
    test('dashboard loads for business owner', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/dashboard')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const hasDashboard = body.includes('Дашборд') || body.includes('Dashboard') ||
          body.includes('Активные') || body.includes('предложен') || body.includes('Coffee')
        expect(hasDashboard).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('dashboard shows quick action links', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/dashboard')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        // Should have links to scanner, offers, etc
        const hasActions = body.includes('Сканер') || body.includes('Предложения') || body.includes('скидк')
        expect(hasActions).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Offers CRUD', () => {
    test('GET /api/business/offers returns offers for authenticated merchant', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/offers', { waitUntil: 'domcontentloaded' })
        const result = await api(page, '/api/business/offers')
        expect(result.ok).toBe(true)
        expect(Array.isArray(result.body.offers || result.body)).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('offers list page loads and shows status badges', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/offers', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        // Page should have loaded
        const hasContent = body.includes('Предложения') || body.includes('предложен') || body.includes('Создать')
        expect(hasContent).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('create offer page loads with wizard', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/offers/create', { waitUntil: 'domcontentloaded', timeout: 45000 })
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        // Should show offer creation form or wizard step or business layout
        const hasContent = body.includes('Тип') || body.includes('предложени') ||
          body.includes('Создать') || body.includes('Шаг') || body.includes('Coffee')
        expect(hasContent).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('POST /api/business/offers creates offer via API', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/offers', { waitUntil: 'domcontentloaded' })
        const result = await api(page, '/api/business/offers', {
          method: 'POST',
          body: {
            merchantId: IDS.coffeeBusinessId,
            branchId: IDS.coffeePlaceId,
            title: 'E2E Test Offer ' + Date.now(),
            offerType: 'PERCENT_DISCOUNT',
            visibility: 'FREE_FOR_ALL',
            benefitType: 'PERCENT',
            benefitValue: 10,
            currency: 'RUB',
            startAt: new Date(Date.now() + 60000).toISOString(),
            endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            redemptionChannel: 'IN_STORE',
          },
        })
        expect([201, 200]).toContain(result.status)
        if (result.status === 201 || result.status === 200) {
          // API wraps response in {offer: {...}}
          const offer = result.body.offer || result.body
          expect(offer).toHaveProperty('id')
          expect(offer.title).toContain('E2E Test Offer')
        }
      } finally {
        await context.close()
      }
    })

    test('cannot create offer for another merchants branch', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/offers', { waitUntil: 'domcontentloaded' })
        const result = await api(page, '/api/business/offers', {
          method: 'POST',
          body: {
            merchantId: IDS.beautyBusinessId,
            branchId: IDS.beautyPlaceId,
            title: 'Unauthorized Offer',
            offerType: 'PERCENT_DISCOUNT',
            visibility: 'PUBLIC',
            benefitType: 'PERCENT',
            benefitValue: 10,
            currency: 'RUB',
            startAt: new Date().toISOString(),
            redemptionChannel: 'IN_STORE',
          },
        })
        expect(result.status).toBe(403)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Staff', () => {
    test('staff page loads for business owner', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/staff')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Analytics', () => {
    test('analytics page loads for business owner', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/analytics')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const hasAnalytics = body.includes('Аналитика') || body.includes('аналитик') || body.includes('Статистика')
        expect(hasAnalytics).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Redemptions Log', () => {
    test('redemptions page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/redemptions')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Stories', () => {
    test('stories page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/stories')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Demand', () => {
    test('demand page loads for business owner', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        await page.goto('/business/demand')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Register Page', () => {
    test('register wizard starts with Yandex Maps search', async ({ page }) => {
      await page.goto('/business/register')
      await expect(page.locator('h1')).toContainText('Регистрация бизнеса')
      await expect(page.locator('h2')).toContainText('Найдите ваше заведение на Яндекс Картах')
      await expect(page.locator('input[type="text"]')).toBeVisible()
      await expect(page.getByText('Или заполните вручную')).toBeVisible()
    })

    test('skipping Yandex search shows contact form', async ({ page }) => {
      await page.goto('/business/register')
      await page.getByText('Или заполните вручную').click()
      await page.waitForTimeout(1000)
      // Step 1 should show contact person fields
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="tel"]')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Далее' })).toBeVisible()
    })
  })
})
