import { test, expect } from '@playwright/test'

test.describe('Auth — Login', () => {
  test('login page loads at /auth/login', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h1')).toContainText('Вход в аккаунт')
  })

  test('login page has phone and email tabs', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: 'Телефон' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Email' })).toBeVisible()
  })

  test('phone tab shows phone input by default', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('#phone')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Получить код' })).toBeVisible()
  })

  test('email tab shows email and password fields', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: 'Email' }).click()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('email tab has submit button', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: 'Email' }).click()
    await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible()
  })

  test('login with invalid credentials shows error or stays on page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: 'Email' }).click()
    await page.locator('#email').fill('nonexistent@test.com')
    await page.locator('#password').fill('WrongPassword123!')

    const submitBtn = page.getByRole('button', { name: 'Войти', exact: true })
    await submitBtn.click()

    // Wait for response
    await page.waitForTimeout(5000)

    // After failed login, user should still be on login page
    expect(page.url()).toContain('/auth/login')
    const bodyText = await page.textContent('body') || ''
    const stayedOnLogin = bodyText.includes('Войти') || bodyText.includes('email') || bodyText.includes('Email')
    expect(stayedOnLogin).toBe(true)
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('link', { name: 'Зарегистрироваться' })).toBeVisible()
  })

  test('login page has Yandex sign-in option', async ({ page }) => {
    await page.goto('/auth/login')
    const bodyText = await page.textContent('body') || ''
    expect(bodyText).toContain('Яндекс')
  })
})

test.describe('Auth — Register', () => {
  test('register page loads at /auth/register', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('h1')).toContainText('Регистрация')
  })

  test('register page has phone and email tabs', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('button', { name: 'Телефон' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Email' })).toBeVisible()
  })

  test('register email tab has all required fields for citizen', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByRole('button', { name: 'Email' }).click()
    // Email, password, confirm password, firstName are required for CITIZEN
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
    await expect(page.locator('#firstName')).toBeVisible()
  })

  test('register email tab has account type toggle', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByRole('button', { name: 'Email' }).click()
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
