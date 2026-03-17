import { test, expect } from '@playwright/test'

test.describe('Subscription page', () => {
  test('subscription page loads at /subscription', async ({ page }) => {
    await page.goto('/subscription')
    await expect(page.locator('h1')).toContainText('Выберите свой план')
  })

  test('shows 3 plan cards after loading', async ({ page }) => {
    await page.goto('/subscription')
    // Wait for plans to load from API
    await page.waitForTimeout(3000)

    // Plan cards should contain Free, Plus, Premium plan names
    // The API returns plans with codes: free, plus, premium
    const planCards = page.locator('.grid.md\\:grid-cols-3 > div')
    await expect(planCards).toHaveCount(3)
  })

  test('feature matrix is visible', async ({ page }) => {
    await page.goto('/subscription')
    await page.waitForTimeout(3000)

    // Feature matrix items from FEATURE_MATRIX constant
    await expect(page.getByText('Бесплатные скидки')).toBeVisible()
    await expect(page.getByText('Скидки для подписчиков')).toBeVisible()
    await expect(page.getByText('Flash-скидки')).toBeVisible()
  })

  test('FAQ section is visible', async ({ page }) => {
    await page.goto('/subscription')
    await expect(page.getByText('Частые вопросы')).toBeVisible()
    await expect(page.getByText('Что входит в пробный период?')).toBeVisible()
    await expect(page.getByText('Как работают скидки?')).toBeVisible()
  })

  test('"Войдите для подписки" shown when not logged in', async ({ page }) => {
    await page.goto('/subscription')
    await page.waitForTimeout(3000)

    // For unauthenticated users, paid plan buttons should show "Войдите для подписки"
    const loginPrompts = page.getByText('Войдите для подписки')
    // Should appear for both Plus and Premium plans
    await expect(loginPrompts.first()).toBeVisible()
  })
})
