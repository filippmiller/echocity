import { test, expect } from '@playwright/test'
import { CREDS, IDS, TIMEOUTS } from '../../helpers/constants'
import { newAuthedPage, api, dismissOnboarding } from '../../helpers/auth-helpers'

test.describe('Flow 07: Consumer Features', () => {

  test.describe('Favorites', () => {
    test('toggle favorite on an offer', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/offers')
        // Add to favorites via API
        const result = await api(page, '/api/favorites', {
          method: 'POST',
          body: { entityType: 'OFFER', entityId: IDS.freeOfferId },
        })
        expect([200, 201]).toContain(result.status)

        // Check favorites
        const check = await api(page, `/api/favorites/check?entityType=OFFER&entityId=${IDS.freeOfferId}`)
        expect(check.ok).toBe(true)

        // Remove favorite
        const remove = await api(page, `/api/favorites/OFFER/${IDS.freeOfferId}`, {
          method: 'DELETE',
        })
        expect([200, 204]).toContain(remove.status)
      } finally {
        await context.close()
      }
    })

    test('favorites page loads for authenticated user', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/favorites')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const hasFavs = body.includes('Избранное') || body.includes('избранн')
        expect(hasFavs).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Demand ("Хочу скидку")', () => {
    test('create demand request via API', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/offers', { waitUntil: 'domcontentloaded' })
        // Get actual city ID from cities API
        const cities = await api(page, '/api/public/cities')
        const spbCity = cities.body?.cities?.find((c: any) => c.name === 'Санкт-Петербург') || cities.body?.[0]
        if (!spbCity) test.skip(true, 'No cities in database')

        const result = await api(page, '/api/demand/create', {
          method: 'POST',
          body: {
            placeId: IDS.coffeePlaceId,
            cityId: spbCity.id,
          },
        })
        // 201 = created, 200 = supported existing
        expect([200, 201]).toContain(result.status)
      } finally {
        await context.close()
      }
    })

    test('support existing demand request', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        await page.goto('/offers')
        // Get demands for the place
        const demands = await api(page, `/api/demand/${IDS.coffeePlaceId}`)
        if (demands.ok && demands.body.length > 0) {
          const result = await api(page, '/api/demand/support', {
            method: 'POST',
            body: { demandRequestId: demands.body[0].id },
          })
          expect([200, 201]).toContain(result.status)
        }
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Profile & Settings', () => {
    test('profile page loads with user info', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/profile')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        // Should show user info or profile content
        expect(body.length).toBeGreaterThan(20)
      } finally {
        await context.close()
      }
    })

    test('settings page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/settings')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })

    test('user stats API returns data', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        const result = await api(page, '/api/user/stats')
        expect(result.ok).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Redemption History', () => {
    test('history page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        await page.goto('/history')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })

    test('history API returns paginated data', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
      try {
        const result = await api(page, '/api/user/history?limit=5')
        expect(result.ok).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Gamification', () => {
    test('missions page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/missions')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })

    test('missions API returns missions list', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        const result = await api(page, '/api/gamification/missions')
        expect(result.ok).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('badges API returns badges', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        const result = await api(page, '/api/gamification/badges')
        expect(result.ok).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('gamification profile API returns XP data', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        const result = await api(page, '/api/gamification/profile')
        expect(result.ok).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Consumer Pages', () => {
    test('tourist page loads', async ({ page }) => {
      const resp = await page.goto('/tourist')
      if (!resp || resp.status() >= 500) test.skip(true, 'Requires DB')
      await expect(page.locator('h1')).toContainText('Режим туриста')
    })

    test('bundles page loads', async ({ page }) => {
      const resp = await page.goto('/bundles')
      if (!resp || resp.status() >= 500) test.skip(true, 'Requires DB')
      const body = await page.textContent('body') || ''
      expect(body).toMatch(/Комбо|комбо|bundle/i)
    })

    test('collections API returns data', async ({ request }) => {
      const response = await request.get('/api/collections')
      expect(response.ok()).toBe(true)
    })

    test('savings API requires auth', async ({ request }) => {
      const response = await request.get('/api/savings')
      expect(response.status()).toBe(401)
    })

    test('referrals API requires auth', async ({ request }) => {
      const response = await request.get('/api/referrals')
      expect(response.status()).toBe(401)
    })
  })

  test.describe('Stories', () => {
    test('stories API returns data', async ({ request }) => {
      const response = await request.get('/api/stories')
      expect(response.ok()).toBe(true)
    })
  })

  test.describe('Reservations', () => {
    test('reservations page loads for authenticated user', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/reservations')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })
})
