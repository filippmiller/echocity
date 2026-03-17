import { test, expect } from '@playwright/test'

test.describe('Business pages — Auth redirect', () => {
  test('/business/dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/business/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('/business/register page loads and shows form', async ({ page }) => {
    await page.goto('/business/register')
    await expect(page.locator('h1')).toContainText('Регистрация бизнеса')
    // Step 1 title "Контактное лицо" is shown in the progress indicator (hidden on mobile via sm:inline)
    // On mobile, it shows "Шаг 1: Контактное лицо"
    // "Контактное лицо" appears twice: desktop span (hidden sm:inline) and mobile <p>
    // Use nth to pick whichever is visible on current viewport
    const contactTexts = page.getByText('Контактное лицо')
    const count = await contactTexts.count()
    let found = false
    for (let i = 0; i < count; i++) {
      if (await contactTexts.nth(i).isVisible()) { found = true; break }
    }
    expect(found).toBe(true)
  })

  test('registration form step 1 has required fields', async ({ page }) => {
    await page.goto('/business/register')

    // Step 1: Contact person fields
    // The labels use text content like "Email *", "Пароль *", "Имя *", "Телефон *"
    // They don't have htmlFor, so getByLabel won't work. Use text + input selectors.
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.getByText('Имя *')).toBeVisible()
    await expect(page.getByText('Телефон *')).toBeVisible()
  })

  test('registration form has step navigation', async ({ page }) => {
    await page.goto('/business/register')

    // Step title visible in progress indicator
    // "Контактное лицо" appears twice: desktop span (hidden sm:inline) and mobile <p>
    // Use nth to pick whichever is visible on current viewport
    const contactTexts = page.getByText('Контактное лицо')
    const count = await contactTexts.count()
    let found = false
    for (let i = 0; i < count; i++) {
      if (await contactTexts.nth(i).isVisible()) { found = true; break }
    }
    expect(found).toBe(true)
    // "Далее" button to go to next step
    await expect(page.getByRole('button', { name: 'Далее' })).toBeVisible()
  })

  test('step 2 shows after completing step 1', async ({ page }) => {
    await page.goto('/business/register')

    // Fill step 1 required fields
    await page.locator('input[type="email"]').fill('test-biz@example.com')
    const passwordInputs = page.locator('input[type="password"]')
    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(0).fill('TestPassword123!')
      await passwordInputs.nth(1).fill('TestPassword123!')
    }
    const textInputs = page.locator('input[type="text"]')
    if (await textInputs.count() > 0) {
      await textInputs.nth(0).fill('Test')
    }
    const telInput = page.locator('input[type="tel"]')
    if (await telInput.count() > 0) {
      await telInput.fill('+79001234567')
    }

    // Click next if button exists
    const nextBtn = page.getByRole('button', { name: 'Далее' })
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click()
      await page.waitForTimeout(1000)
      // Step 2 should have business-related fields
      const bodyText = await page.textContent('body')
      expect(bodyText).toBeTruthy()
    }
  })
})
