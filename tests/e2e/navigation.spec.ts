import { test, expect } from '@playwright/test'

test.describe('Navigation — Desktop', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Скидки рядом с вами')
  })

  test('categories section is visible on home page', async ({ page }) => {
    await page.goto('/')
    // Categories are rendered as links with emoji + text
    await expect(page.getByRole('link', { name: /Кофе/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Еда/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Туристам/ })).toBeVisible()
  })

  test('clicking "Туристам" category navigates to /tourist', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Туристам/ }).click()
    await expect(page).toHaveURL(/\/tourist/)
  })

  test('business register page loads at /business/register', async ({ page }) => {
    await page.goto('/business/register')
    await expect(page.locator('h1')).toContainText('Регистрация бизнеса')
  })

  test('admin page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/analytics')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('Navigation — Mobile bottom nav', () => {
  test.use({ viewport: { width: 393, height: 851 } }) // Pixel 5

  test('mobile bottom nav is visible', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav.fixed.bottom-0')
    await expect(nav).toBeVisible()
  })

  test('clicking "Скидки" tab navigates to /offers', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Скидки' }).click()
    await expect(page).toHaveURL(/\/offers/)
  })

  test('clicking "Карта" tab navigates to /map', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Карта' }).click()
    await expect(page).toHaveURL(/\/map/)
  })
})
