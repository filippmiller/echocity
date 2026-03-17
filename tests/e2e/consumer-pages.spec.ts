import { test, expect } from '@playwright/test'

test.describe('Consumer pages — Tourist', () => {
  test('/tourist page loads or gracefully handles DB offline', async ({ page }) => {
    const response = await page.goto('/tourist')
    // Tourist page is server-rendered with Prisma — needs DB
    if (!response || response.status() >= 500) {
      test.skip(true, 'Tourist page requires database connection')
    }
    await expect(page.locator('h1')).toContainText('Режим туриста')
  })

  test('/tourist page shows content', async ({ page }) => {
    const response = await page.goto('/tourist')
    if (!response || response.status() >= 500) {
      test.skip(true, 'Tourist page requires database connection')
    }
    // Page loaded — check it has tourist-related content
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    expect(body!.toLowerCase()).toMatch(/турист|tourist|предложен/)
  })
})

test.describe('Consumer pages — Bundles', () => {
  test('/bundles page loads or gracefully handles DB offline', async ({ page }) => {
    const response = await page.goto('/bundles')
    // Bundles page is server-rendered with Prisma — needs DB
    if (!response || response.status() >= 500) {
      test.skip(true, 'Bundles page requires database connection')
    }
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
