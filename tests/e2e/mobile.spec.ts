import { test, expect, devices } from '@playwright/test'

test.describe('Mobile — Bottom navigation', () => {
  test.use({ ...devices['Pixel 5'] })

  test('bottom navigation bar is visible', async ({ page }) => {
    await page.goto('/')
    // The MobileBottomNav renders a <nav> with fixed bottom position, md:hidden
    const nav = page.locator('nav').filter({ has: page.getByText('Главная') })
    await expect(nav).toBeVisible()
  })

  test('5 nav tabs are present', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav').filter({ has: page.getByText('Главная') })
    // TABS: Главная, Скидки, Карта, Избранное, Профиль
    await expect(nav.getByText('Главная')).toBeVisible()
    await expect(nav.getByText('Скидки')).toBeVisible()
    await expect(nav.getByText('Карта')).toBeVisible()
    await expect(nav.getByText('Избранное')).toBeVisible()
    await expect(nav.getByText('Профиль')).toBeVisible()
  })

  test('tapping profile shows auth prompt for guests', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav').filter({ has: page.getByText('Главная') })

    // Click "Профиль" tab — should show AuthPrompt for unauthenticated users
    await nav.getByText('Профиль').click()

    // AuthPrompt should appear with a message about signing in
    const authPrompt = page.getByText(/Войдите.*профиль|Войдите.*истори/i)
    await expect(authPrompt).toBeVisible({ timeout: 5000 })
  })

  test('tapping "Избранное" shows auth prompt for guests', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav').filter({ has: page.getByText('Главная') })

    await nav.getByText('Избранное').click()

    // AuthPrompt should appear
    const authPrompt = page.getByText(/Войдите.*избранн/i)
    await expect(authPrompt).toBeVisible({ timeout: 5000 })
  })

  test('categories scroll horizontally', async ({ page }) => {
    await page.goto('/')
    // Categories section has overflow-x-auto
    const categoriesContainer = page.locator('.overflow-x-auto.hide-scrollbar').first()
    await expect(categoriesContainer).toBeVisible()
    // Verify multiple category links exist
    const categoryLinks = categoriesContainer.getByRole('link')
    const count = await categoryLinks.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})

test.describe('Mobile — Stories bar', () => {
  test.use({ ...devices['Pixel 5'] })

  test('stories bar section exists on home page', async ({ page }) => {
    await page.goto('/')
    // HomeStoriesBar component is rendered — it may or may not have content
    // The component renders regardless, so the page should load fine
    const body = await page.textContent('body')
    expect(body).toContain('Скидки рядом с вами')
  })
})

test.describe('Mobile — Navigation flows', () => {
  test.use({ ...devices['Pixel 5'] })

  test('bottom nav hides on auth pages', async ({ page }) => {
    await page.goto('/auth/login')
    // MobileBottomNav returns null for auth pages
    const nav = page.locator('nav').filter({ has: page.getByText('Главная') })
    await expect(nav).not.toBeVisible()
  })

  test('bottom nav hides on business pages', async ({ page }) => {
    await page.goto('/business/register')
    const nav = page.locator('nav').filter({ has: page.getByText('Главная') })
    await expect(nav).not.toBeVisible()
  })
})
