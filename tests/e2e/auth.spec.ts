import { test, expect } from '@playwright/test'

test.describe('Auth — Login', () => {
  test('login page loads at /auth/login', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h1')).toContainText('Вход в аккаунт')
  })

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('login page has submit button', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[name="email"]').fill('nonexistent@test.com')
    await page.locator('input[name="password"]').fill('WrongPassword123!')
    await page.getByRole('button', { name: 'Войти' }).click()

    // The app uses sonner toasts for errors — look for toast or error text
    const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /неверный|ошибка/i })
    await expect(errorToast).toBeVisible({ timeout: 10000 })
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('link', { name: 'Зарегистрироваться' })).toBeVisible()
  })
})

test.describe('Auth — Register', () => {
  test('register page loads at /auth/register', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('h1')).toContainText('Регистрация')
  })

  test('register form has all required fields', async ({ page }) => {
    await page.goto('/auth/register')
    // Email, password, confirm password, firstName are required for CITIZEN
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
    await expect(page.locator('#firstName')).toBeVisible()
  })

  test('register page has account type toggle', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('button', { name: 'Пользователь' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Бизнес' })).toBeVisible()
  })

  test('register page has link to login', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible()
  })
})

test.describe('Auth — Logout redirect', () => {
  test('accessing protected page without auth redirects to login', async ({ page }) => {
    await page.goto('/business/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
