import { test, expect } from '@playwright/test'

test.describe('Business pages — Auth redirect', () => {
  test('/business/dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/business/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('/business/register page loads and shows form', async ({ page }) => {
    await page.goto('/business/register')
    await expect(page.locator('h1')).toContainText('Регистрация бизнеса')
    // Should show step 1 form by default
    await expect(page.getByText('Контактное лицо')).toBeVisible()
  })

  test('registration form step 1 has required fields', async ({ page }) => {
    await page.goto('/business/register')

    // Step 1: Contact person fields
    // Email field
    await expect(page.getByLabel(/Email/)).toBeVisible()
    // Password field
    await expect(page.getByLabel(/^Пароль/)).toBeVisible()
    // First name field
    await expect(page.getByLabel(/Имя/)).toBeVisible()
    // Phone field
    await expect(page.getByLabel(/Телефон/)).toBeVisible()
  })

  test('registration form has step navigation', async ({ page }) => {
    await page.goto('/business/register')

    // Step titles visible in progress indicator
    await expect(page.getByText('Контактное лицо')).toBeVisible()
    // "Далее" button to go to next step
    await expect(page.getByRole('button', { name: 'Далее' })).toBeVisible()
  })

  test('step 2 shows business name and type fields after completing step 1', async ({ page }) => {
    await page.goto('/business/register')

    // Fill step 1 required fields
    await page.getByLabel(/Email/).fill('test-biz@example.com')
    // Password fields - fill using specific inputs
    const passwordInputs = page.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('TestPassword123!')
    await passwordInputs.nth(1).fill('TestPassword123!')
    await page.getByLabel(/Имя/).fill('Test')
    await page.getByLabel(/Телефон/).fill('+79001234567')

    // Click next
    await page.getByRole('button', { name: 'Далее' }).click()

    // Step 2 should now be visible
    await expect(page.getByLabel(/Название бизнеса/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/Тип бизнеса/)).toBeVisible()
  })
})
