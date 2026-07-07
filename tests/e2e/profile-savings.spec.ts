import { test, expect } from '@playwright/test'
import { CREDS, TIMEOUTS } from '../helpers/constants'
import { newAuthedPage } from '../helpers/auth-helpers'

test.describe('Profile Savings', () => {
  test('loads savings page and shows totals', async ({ browser }) => {
    const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
    try {
      await page.route('/api/profile/savings', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            lifetime: { rubles: 12500, count: 42 },
            thisMonth: { rubles: 3500, count: 8 },
            prevMonth: { rubles: 2100 },
            monthOverMonth: 66,
            categories: [],
            monthlySeries: [],
          }),
        })
      })

      await page.route('/api/user/history?limit=10', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ redemptions: [], total: 0, hasMore: false }),
        })
      })

      await page.goto('/profile/savings')
      await page.waitForTimeout(TIMEOUTS.render)

      await expect(page.locator('h1')).toContainText('Моя экономия')
      const body = await page.textContent('body') || ''
      expect(body).toContain('12 500')
      expect(body).toContain('3 500')
    } finally {
      await context.close()
    }
  })

  test('shows empty state CTA when no savings', async ({ browser }) => {
    const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
    try {
      await page.route('/api/profile/savings', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            lifetime: { rubles: 0, count: 0 },
            thisMonth: { rubles: 0, count: 0 },
            prevMonth: { rubles: 0 },
            monthOverMonth: null,
            categories: [],
            monthlySeries: [],
          }),
        })
      })

      await page.route('/api/user/history?limit=10', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ redemptions: [], total: 0, hasMore: false }),
        })
      })

      await page.goto('/profile/savings')
      await page.waitForTimeout(TIMEOUTS.render)

      await expect(page.getByText('Пока нет экономии')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Найти скидки' })).toHaveAttribute('href', '/offers')
    } finally {
      await context.close()
    }
  })

  test('renders recent redemptions with saved amount', async ({ browser }) => {
    const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)
    try {
      await page.route('/api/profile/savings', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            lifetime: { rubles: 500, count: 1 },
            thisMonth: { rubles: 500, count: 1 },
            prevMonth: { rubles: 0 },
            monthOverMonth: null,
            categories: [],
            monthlySeries: [],
          }),
        })
      })

      await page.route('/api/user/history?limit=10', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            redemptions: [
              {
                id: 'red-1',
                savedAmount: 500,
                discountAmount: 450,
                redeemedAt: '2026-06-15T14:00:00.000Z',
                offer: { title: 'Кофе со скидкой' },
                branch: { title: 'Coffee Point', address: 'ул. Ленина, 1' },
              },
            ],
            total: 1,
            hasMore: false,
          }),
        })
      })

      await page.goto('/profile/savings')
      await page.waitForTimeout(TIMEOUTS.render)

      const body = await page.textContent('body') || ''
      expect(body).toContain('Кофе со скидкой')
      expect(body).toContain('Coffee Point')
      expect(body).toContain('−500 ₽')
    } finally {
      await context.close()
    }
  })
})
