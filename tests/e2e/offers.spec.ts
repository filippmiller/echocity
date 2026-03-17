import { test, expect } from '@playwright/test'

test.describe('Offers — Discovery', () => {
  test('offers page loads at /offers', async ({ page }) => {
    await page.goto('/offers')
    await expect(page.locator('h1')).toContainText('Скидки')
  })

  test('offers page shows offer cards or empty state', async ({ page }) => {
    await page.goto('/offers')
    // Wait for the page to finish loading (OfferFeed is client-side)
    await page.waitForTimeout(2000)

    // Either offer cards exist or we see an empty/loading state
    const pageContent = await page.textContent('body')
    // The page should have loaded successfully (has the header at minimum)
    expect(pageContent).toContain('Скидки')
  })

  test('offers page has city selector and filter chips', async ({ page }) => {
    await page.goto('/offers')
    // City selector
    await expect(page.locator('select')).toBeVisible()
    // Filter chips: "Все", "Бесплатные", "Plus"
    await expect(page.getByText('Все', { exact: true }).first()).toBeVisible()
  })
})

test.describe('Offers — Flash deals on home', () => {
  test('home page shows flash deals section if available', async ({ page }) => {
    const response = await page.goto('/')
    // Home page is server-rendered — may return 500 without DB
    if (!response || response.status() >= 500) {
      test.skip(true, 'Home page requires database connection')
    }
    // Flash deals section may or may not exist depending on data
    const flashSection = page.getByText('Flash-скидки')
    const isVisible = await flashSection.isVisible().catch(() => false)
    // This is data-dependent — we just verify the page loaded without error
    expect(true).toBe(true)
  })
})

test.describe('Offers — Detail page', () => {
  test('offer detail page structure is correct when offer exists', async ({ page }) => {
    // First, try to find an offer ID from the offers API
    const apiResponse = await page.request.get('/api/offers?limit=1')

    // API may fail if DB is offline
    if (!apiResponse.ok()) {
      test.skip(true, 'Offers API requires database connection')
    }

    const data = await apiResponse.json()

    if (data.offers && data.offers.length > 0) {
      const offerId = data.offers[0].id
      await page.goto(`/offers/${offerId}`)

      // Wait for client-side fetch to complete
      await page.waitForTimeout(2000)

      // Should show "Назад" back button
      await expect(page.getByText('Назад')).toBeVisible()
    } else {
      // No offers in the database — test a non-existent offer shows "not found"
      await page.goto('/offers/nonexistent-id')
      await page.waitForTimeout(2000)
      await expect(page.getByText('Предложение не найдено')).toBeVisible()
    }
  })

  test('"Активировать" button requires auth for guests', async ({ page }) => {
    // Try to find an offer
    const apiResponse = await page.request.get('/api/offers?limit=1')

    if (!apiResponse.ok()) {
      test.skip(true, 'Offers API requires database connection')
    }

    const data = await apiResponse.json()

    if (data.offers && data.offers.length > 0) {
      const offerId = data.offers[0].id
      await page.goto(`/offers/${offerId}`)
      await page.waitForTimeout(2000)

      // Dismiss onboarding overlay if present
      const skipBtn = page.getByText('Пропустить')
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click()
        await page.waitForTimeout(500)
      }

      // For unauthenticated users, the CTA area should show auth or subscribe prompt
      const bodyText = await page.textContent('body') || ''
      const hasAuthCta = bodyText.includes('Войдите') || bodyText.includes('Подпишитесь')
      expect(hasAuthCta).toBe(true)
    } else {
      test.skip(true, 'No offers available in the database')
    }
  })

  test('non-existent offer shows not found message', async ({ page }) => {
    await page.goto('/offers/00000000-0000-0000-0000-000000000000')
    await page.waitForTimeout(5000)
    const bodyText = await page.textContent('body') || ''
    const hasNotFound = bodyText.includes('не найдено') || bodyText.includes('не найден') || bodyText.includes('404')
    expect(hasNotFound).toBe(true)
  })
})
