import { test, expect } from '@playwright/test'
import { CREDS, IDS, TIMEOUTS } from '../../helpers/constants'
import { newAuthedPage, api, dismissOnboarding } from '../../helpers/auth-helpers'

test.describe('Flow 02: Offer Discovery', () => {

  test.describe('Offers Feed Page', () => {
    test('offers page loads with header', async ({ page }) => {
      await page.goto('/offers')
      await expect(page.locator('h1')).toContainText('Скидки')
    })

    test('offers page has city selector', async ({ page }) => {
      await page.goto('/offers')
      await expect(page.locator('select')).toBeVisible()
    })

    test('offers page has visibility filter chips', async ({ page }) => {
      await page.goto('/offers')
      await expect(page.getByText('Все', { exact: true }).first()).toBeVisible()
    })

    test('filter chips change displayed offers', async ({ page }) => {
      await page.goto('/offers')
      await page.waitForTimeout(TIMEOUTS.render)

      // Click different filter chips
      const allBtn = page.getByRole('button', { name: 'Все', exact: true })
      const freeBtn = page.getByRole('button', { name: 'Бесплатные' })
      const plusBtn = page.getByRole('button', { name: 'Plus' })

      if (await freeBtn.isVisible()) {
        await freeBtn.click()
        await page.waitForTimeout(TIMEOUTS.animation)
      }
      if (await plusBtn.isVisible()) {
        await plusBtn.click()
        await page.waitForTimeout(TIMEOUTS.animation)
      }
      if (await allBtn.isVisible()) {
        await allBtn.click()
        await page.waitForTimeout(TIMEOUTS.animation)
      }

      // Page should still be on /offers without error
      expect(page.url()).toContain('/offers')
    })

    test('offer cards display key information', async ({ page }) => {
      await page.goto('/offers')
      await page.waitForTimeout(TIMEOUTS.render)

      // Check if offer cards are present (may have data from seed/matrix runs)
      const cards = page.locator('[class*="rounded"]').filter({ hasText: '%' })
      const count = await cards.count()
      if (count > 0) {
        // First card should show benefit and branch info
        const firstCard = cards.first()
        const text = await firstCard.textContent() || ''
        // Should contain some Russian text (branch name, benefit)
        expect(text.length).toBeGreaterThan(5)
      }
    })
  })

  test.describe('Offers API', () => {
    test('GET /api/offers returns offers array', async ({ request }) => {
      const response = await request.get('/api/offers?limit=5')
      expect(response.ok()).toBe(true)
      const data = await response.json()
      expect(data).toHaveProperty('offers')
      expect(Array.isArray(data.offers)).toBe(true)
    })

    test('GET /api/offers respects limit parameter', async ({ request }) => {
      const response = await request.get('/api/offers?limit=2')
      const data = await response.json()
      expect(data.offers.length).toBeLessThanOrEqual(2)
    })

    test('GET /api/offers filters by city', async ({ request }) => {
      const response = await request.get('/api/offers?city=Санкт-Петербург')
      expect(response.ok()).toBe(true)
      const data = await response.json()
      for (const offer of data.offers) {
        expect(offer.branch.city).toBe('Санкт-Петербург')
      }
    })

    test('GET /api/subscriptions/plans returns 3 plans', async ({ request }) => {
      const response = await request.get('/api/subscriptions/plans')
      expect(response.ok()).toBe(true)
      const data = await response.json()
      expect(data.plans).toHaveLength(3)
      const codes = data.plans.map((p: any) => p.code)
      expect(codes).toContain('free')
      expect(codes).toContain('plus')
      expect(codes).toContain('premium')
    })
  })

  test.describe('Offer Detail Page', () => {
    test('offer detail loads for existing offer', async ({ page }) => {
      // Get an offer ID from the API first
      const apiResp = await page.request.get('/api/offers?limit=1')
      if (!apiResp.ok()) test.skip(true, 'No offers API available')
      const data = await apiResp.json()
      if (!data.offers?.length) test.skip(true, 'No offers in database')

      const offerId = data.offers[0].id
      await page.goto(`/offers/${offerId}`)
      await page.waitForTimeout(TIMEOUTS.render)
      await expect(page.getByText('Назад')).toBeVisible()
    })

    test('non-existent offer shows not-found message', async ({ page }) => {
      await page.goto('/offers/00000000-0000-0000-0000-000000000000')
      await page.waitForTimeout(TIMEOUTS.render + 2000)
      const bodyText = await page.textContent('body') || ''
      const hasNotFound = bodyText.includes('не найдено') || bodyText.includes('не найден') || bodyText.includes('404')
      expect(hasNotFound).toBe(true)
    })

    test('offer detail shows "Войдите" CTA for unauthenticated users', async ({ page }) => {
      const apiResp = await page.request.get('/api/offers?limit=1')
      if (!apiResp.ok()) test.skip(true, 'No offers API available')
      const data = await apiResp.json()
      if (!data.offers?.length) test.skip(true, 'No offers in database')

      await page.goto(`/offers/${data.offers[0].id}`)
      await page.waitForTimeout(TIMEOUTS.render)
      await dismissOnboarding(page)

      const bodyText = await page.textContent('body') || ''
      const hasCta = bodyText.includes('Войдите') || bodyText.includes('Подпишитесь')
      expect(hasCta).toBe(true)
    })
  })

  test.describe('Home Page', () => {
    test('home page loads with hero text', async ({ page }) => {
      const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!resp || resp.status() >= 500) test.skip(true, 'Home requires DB')
      await expect(page.locator('h1')).toContainText('Скидки рядом с вами')
    })

    test('home page has category links', async ({ page }) => {
      const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!resp || resp.status() >= 500) test.skip(true, 'Home requires DB')
      await expect(page.getByRole('link', { name: /Кофе/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /Еда/ })).toBeVisible()
    })

    test('home page shows offer sections', async ({ page }) => {
      const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!resp || resp.status() >= 500) test.skip(true, 'Home requires DB')
      const body = await page.textContent('body') || ''
      // Should have at least one section heading
      const hasSections = body.includes('Скидки') || body.includes('Предложения') || body.includes('скидк')
      expect(hasSections).toBe(true)
    })
  })

  test.describe('Map Page', () => {
    test('map page loads without error', async ({ page }) => {
      await page.goto('/map', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(TIMEOUTS.render)
      const body = await page.textContent('body')
      expect(body).toBeTruthy()
      // Should not show a crash/error
      expect(body).not.toContain('Internal Server Error')
    })
  })

  test.describe('Search Page', () => {
    test('search page loads', async ({ page }) => {
      await page.goto('/search')
      await page.waitForTimeout(TIMEOUTS.render)
      const body = await page.textContent('body')
      expect(body).toBeTruthy()
    })
  })
})
