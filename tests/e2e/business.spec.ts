import { test, expect } from '@playwright/test'

test.describe('Business pages — Auth redirect', () => {
  test('/business/dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/business/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('/business/register page loads and shows Yandex Maps search', async ({ page }) => {
    await page.goto('/business/register')
    await expect(page.locator('h1')).toContainText('Регистрация бизнеса')
    // Step 0: Yandex AutoFill — search for business on Yandex Maps
    await expect(page.locator('h2')).toContainText('Найдите ваше заведение на Яндекс Картах')
  })

  test('business register has search input and skip option', async ({ page }) => {
    await page.goto('/business/register')
    // Search input for Yandex Maps
    await expect(page.locator('input[type="text"]')).toBeVisible()
    // Skip option to fill manually
    await expect(page.getByText('Или заполните вручную')).toBeVisible()
  })

  test('clicking "заполните вручную" advances to step 1 contact form', async ({ page }) => {
    await page.goto('/business/register')
    // Skip Yandex Maps search
    await page.getByText('Или заполните вручную').click()
    await page.waitForTimeout(1000)

    // Step 1 should now show contact person fields
    // Email and password fields should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="tel"]')).toBeVisible()
  })
})
