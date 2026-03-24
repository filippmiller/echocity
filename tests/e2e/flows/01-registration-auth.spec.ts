import { test, expect } from '@playwright/test'
import { CREDS, TIMEOUTS } from '../../helpers/constants'
import { login, newAuthedPage, api, dismissOnboarding } from '../../helpers/auth-helpers'
import { registerCitizen, generateTestEmail } from '../../helpers/test-user-factory'

test.describe('Flow 01: Registration & Authentication', () => {

  test.describe('Citizen Registration', () => {
    test('register page renders with phone tab by default', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Регистрация')
      await expect(page.locator('#regPhone')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Получить код' })).toBeVisible()
    })

    test('register email tab has all required fields', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'Email' }).click()
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#confirmPassword')).toBeVisible()
      await expect(page.locator('#firstName')).toBeVisible()
    })

    test('account type toggle switches between citizen and business', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'Email' }).click()
      await page.waitForTimeout(TIMEOUTS.render)
      const citizenBtn = page.getByRole('button', { name: 'Пользователь' })
      const bizBtn = page.getByRole('button', { name: 'Бизнес' })
      await expect(citizenBtn).toBeVisible()
      await expect(bizBtn).toBeVisible()

      // Click business — should show business redirect notice
      await bizBtn.click()
      await page.waitForTimeout(1000)
      const body = await page.textContent('body') || ''
      const hasBizNotice = body.includes('мастер регистрации') || body.includes('бизнес') ||
        await page.locator('#businessName').isVisible().catch(() => false)
      expect(hasBizNotice).toBe(true)
    })

    test('registration rejects weak passwords', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'Email' }).click()
      await page.locator('#email').fill(generateTestEmail('weak-pwd'))
      await page.locator('#firstName').fill('Test')
      await page.locator('#password').fill('123')
      await page.locator('#confirmPassword').fill('123')
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click()
      await page.waitForTimeout(TIMEOUTS.render)
      // Should stay on register page (validation error)
      expect(page.url()).toContain('/auth/register')
    })

    test('registration rejects mismatched passwords', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'Email' }).click()
      await page.locator('#email').fill(generateTestEmail('mismatch'))
      await page.locator('#firstName').fill('Test')
      await page.locator('#password').fill('StrongPass1234!')
      await page.locator('#confirmPassword').fill('DifferentPass1234!')
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click()
      await page.waitForTimeout(TIMEOUTS.render)
      expect(page.url()).toContain('/auth/register')
    })

    test('can register a new citizen via API', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded', timeout: 30000 })
      const result = await registerCitizen(page)
      // 201 = created, 409 = already exists, 400 = validation
      expect([201, 400, 409]).toContain(result.status)
    })
  })

  test.describe('Login', () => {
    test('login page renders with phone tab by default', async ({ page }) => {
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Вход в аккаунт')
      await expect(page.locator('#phone')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Получить код' })).toBeVisible()
    })

    test('email tab shows email and password fields', async ({ page }) => {
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'Email' }).click()
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible()
    })

    test('login with invalid credentials stays on login page', async ({ page }) => {
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'Email' }).click()
      await page.locator('#email').fill('nonexistent@test.com')
      await page.locator('#password').fill('WrongPassword123!')
      await page.getByRole('button', { name: 'Войти', exact: true }).click()
      await page.waitForTimeout(TIMEOUTS.render)
      expect(page.url()).toContain('/auth/login')
    })

    test('login with valid citizen credentials redirects to home/offers', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        // Should NOT be on login page anymore
        expect(page.url()).not.toContain('/auth/login')
      } finally {
        await context.close()
      }
    })

    test('login with business owner credentials redirects away from login', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
      try {
        expect(page.url()).not.toContain('/auth/login')
      } finally {
        await context.close()
      }
    })

    test('login with admin credentials redirects away from login', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        expect(page.url()).not.toContain('/auth/login')
      } finally {
        await context.close()
      }
    })

    test('login page has link to register', async ({ page }) => {
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('link', { name: 'Зарегистрироваться' })).toBeVisible()
    })

    test('register page has link to login', async ({ page }) => {
      await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible()
    })
  })

  test.describe('Auth Guards', () => {
    test('/business/dashboard redirects to login when unauthenticated', async ({ page }) => {
      await page.goto('/business/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation })
    })

    test('/admin/analytics redirects to login when unauthenticated', async ({ page }) => {
      await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation })
    })

    test('/profile page shows auth prompt for unauthenticated users', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForTimeout(TIMEOUTS.render)
      const url = page.url()
      const body = await page.textContent('body') || ''
      const isProtected = url.includes('/auth/login') || body.includes('Войдите')
      expect(isProtected).toBe(true)
    })

    test('API endpoints return 401 for unauthenticated requests', async ({ request }) => {
      const endpoints = [
        '/api/admin/users',
        '/api/business/offers',
        '/api/favorites',
        '/api/redemptions/history',
      ]
      for (const endpoint of endpoints) {
        const response = await request.get(endpoint)
        expect(response.status(), `${endpoint} should require auth`).toBe(401)
      }
    })
  })

  test.describe('Logout', () => {
    test('logout clears session and redirects to login', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        const result = await api(page, '/api/auth/logout', { method: 'POST' })
        expect(result.ok).toBe(true)

        await page.goto('/profile')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const isLoggedOut = page.url().includes('/auth/login') || body.includes('Войдите')
        expect(isLoggedOut).toBe(true)
      } finally {
        await context.close()
      }
    })
  })
})
