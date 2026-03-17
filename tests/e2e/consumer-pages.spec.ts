import { test, expect } from '@playwright/test'

test.describe('Consumer pages — Tourist', () => {
  test('/tourist page loads with "Режим туриста" heading', async ({ page }) => {
    await page.goto('/tourist')
    await expect(page.locator('h1')).toContainText('Режим туриста')
  })

  test('/tourist page shows offers or empty state', async ({ page }) => {
    await page.goto('/tourist')
    // Either shows tourist offers or empty state message
    const emptyState = page.getByText('Пока нет предложений для туристов')
    const offersExist = page.getByText('Лучшие скидки')
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    const hasOffers = await offersExist.isVisible().catch(() => false)
    expect(hasEmpty || hasOffers).toBe(true)
  })
})

test.describe('Consumer pages — Bundles', () => {
  test('/bundles page loads', async ({ page }) => {
    await page.goto('/bundles')
    // The page should load without error — it has a hero section with "Комбо" heading
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    // Page should contain bundle-related content
    expect(body).toMatch(/Комбо|комбо|bundle/i)
  })
})

test.describe('Consumer pages — Missions', () => {
  test('/missions page loads', async ({ page }) => {
    await page.goto('/missions')
    // Missions is a client-side page that fetches gamification data
    // It should at least render without crashing
    await page.waitForTimeout(2000)
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })
})

test.describe('Consumer pages — Map', () => {
  test('/map page loads', async ({ page }) => {
    await page.goto('/map')
    // Map page is client-side and loads places
    await page.waitForTimeout(2000)
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })
})
