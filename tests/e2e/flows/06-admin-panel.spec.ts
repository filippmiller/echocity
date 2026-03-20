import { test, expect } from '@playwright/test'
import { CREDS, TIMEOUTS } from '../../helpers/constants'
import { newAuthedPage, api } from '../../helpers/auth-helpers'

test.describe('Flow 06: Admin Panel', () => {

  test.describe('Admin Dashboard', () => {
    test('admin dashboard loads with analytics', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const hasDashboard = body.includes('Панель') || body.includes('Админ') || body.includes('admin') || body.includes('Пользовател')
        expect(hasDashboard).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Offer Moderation', () => {
    test('moderation page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/offers')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })

    test('GET /api/admin/offers returns pending offers', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/offers')
        const result = await api(page, '/api/admin/offers?status=PENDING')
        expect(result.ok).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('non-admin cannot access moderation API', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
      try {
        await page.goto('/offers')
        const result = await api(page, '/api/admin/offers')
        expect([401, 403]).toContain(result.status)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('User Management', () => {
    test('users page loads with user list', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/users')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const hasUsers = body.includes('Пользовател') || body.includes('user') || body.includes('@')
        expect(hasUsers).toBe(true)
      } finally {
        await context.close()
      }
    })

    test('admin cannot deactivate their own account', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/users')
        const me = await api(page, '/api/auth/me')
        expect(me.ok).toBe(true)
        const userId = me.body.user?.userId || me.body.userId
        expect(userId).toBeTruthy()

        const result = await api(page, `/api/admin/users/${userId}`, {
          method: 'PATCH',
          body: { isActive: false },
        })
        expect(result.status).toBe(400)
        expect(result.text).toContain('Нельзя изменить свой собственный аккаунт')
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Business Management', () => {
    test('businesses page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/businesses')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Complaints', () => {
    test('complaints page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/complaints')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Fraud Flags', () => {
    test('fraud page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/fraud')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Admin Analytics', () => {
    test('analytics page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/analytics')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        const hasAnalytics = body.includes('Аналитика') || body.includes('аналитик') || body.includes('Статистика') || body.includes('пользовател')
        expect(hasAnalytics).toBe(true)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('City & Franchise Management', () => {
    test('cities page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/cities')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })

    test('franchises page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/franchises')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Admin Bundles', () => {
    test('bundles page loads', async ({ browser }) => {
      const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)
      try {
        await page.goto('/admin/bundles')
        await page.waitForTimeout(TIMEOUTS.render)
        const body = await page.textContent('body') || ''
        expect(body.length).toBeGreaterThan(10)
      } finally {
        await context.close()
      }
    })
  })
})
