import { test, expect, type Browser, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const PASSWORD = 'Test1234!'
const prisma = new PrismaClient()

const CREDS = {
  admin: { email: 'admin@echocity.ru', password: PASSWORD },
  user: { email: 'user@echocity.ru', password: PASSWORD },
  subscriber: { email: 'maria@echocity.ru', password: PASSWORD },
  coffeeOwner: { email: 'coffee@echocity.ru', password: PASSWORD },
  beautyOwner: { email: 'beauty@echocity.ru', password: PASSWORD },
}

const IDS = {
  coffeeBusinessId: 'biz-coffee-house',
  beautyBusinessId: 'biz-beauty-studio',
  coffeePlaceId: 'place-coffee-nevsky',
  freeOfferId: 'offer-coffee-20',
  memberOfferId: 'offer-free-dessert',
}

type ApiResult<T = any> = {
  ok: boolean
  status: number
  body: T
  text: string
}

async function ensureSubscriberCanRedeem() {
  const subscriber = await prisma.user.findUnique({
    where: { email: CREDS.subscriber.email },
    select: { id: true },
  })
  const plusPlan = await prisma.subscriptionPlan.findUnique({
    where: { code: 'plus' },
    select: { id: true },
  })

  expect(subscriber?.id).toBeTruthy()
  expect(plusPlan?.id).toBeTruthy()

  await prisma.redemptionEvent.deleteMany({
    where: {
      session: {
        userId: subscriber!.id,
        offerId: IDS.memberOfferId,
      },
    },
  })
  await prisma.redemption.deleteMany({
    where: {
      userId: subscriber!.id,
      offerId: IDS.memberOfferId,
    },
  })
  await prisma.redemptionSession.deleteMany({
    where: {
      userId: subscriber!.id,
      offerId: IDS.memberOfferId,
    },
  })

  const currentSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId: subscriber!.id,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (currentSubscription) {
    await prisma.userSubscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId: plusPlan!.id,
        status: 'ACTIVE',
        canceledAt: null,
        autoRenew: true,
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })
  } else {
    await prisma.userSubscription.create({
      data: {
        userId: subscriber!.id,
        planId: plusPlan!.id,
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    })
  }
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Use API login for speed and rate-limit resilience
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await page.evaluate(
      async ({ email, password }) => {
        const r = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'same-origin',
        })
        return { status: r.status, ok: r.ok }
      },
      { email, password },
    )

    if (result.ok) {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      return
    }

    if (result.status === 429) {
      await page.waitForTimeout((attempt + 1) * 5000)
      continue
    }

    // Fallback to UI login
    await page.getByRole('button', { name: 'Email' }).click()
    await page.waitForTimeout(300)
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    await page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), { timeout: 15000 })
    return
  }
}

async function api<T = any>(
  page: Page,
  url: string,
  init?: { method?: string; body?: unknown },
): Promise<ApiResult<T>> {
  return page.evaluate(async ({ url, init }: { url: string; init?: { method?: string; body?: unknown } }) => {
    const response = await fetch(url, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    })

    const text = await response.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }

    return {
      ok: response.ok,
      status: response.status,
      body: body as T,
      text,
    }
  }, { url, init }) as Promise<ApiResult<T>>
}

async function newAuthedPage(browser: Browser, email: string, password: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await login(page, email, password)
  return { context, page }
}

test.afterAll(async () => {
  await prisma.$disconnect()
})

test.describe('Security — API hardening', () => {
  test('sensitive endpoints reject unauthenticated access', async ({ request }) => {
    const responses = await Promise.all([
      request.get('/api/admin/users'),
      request.get('/api/business/offers'),
      request.get('/api/favorites'),
      request.post('/api/complaints', {
        data: { type: 'OTHER', description: 'This should not be accepted without auth.' },
      }),
    ])

    for (const response of responses) {
      expect(response.status()).toBe(401)
    }
  })

  test('login API rejects malformed payloads', async ({ request }) => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`
    const response = await request.post('/api/auth/login', {
      headers: { 'x-forwarded-for': ip },
      data: { email: 'not-an-email', password: '' },
    })

    // Accept 400 (validation) or 429 (rate-limited from previous test runs)
    expect([400, 429]).toContain(response.status())
  })

  test('login API rate limits repeated failures and exposes backoff headers', async ({ request }) => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`
    let lastStatus = 0
    let retryAfter = ''

    for (let attempt = 0; attempt < 101; attempt += 1) {
      const response = await request.post('/api/auth/login', {
        headers: { 'x-forwarded-for': ip },
        data: {
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!',
        },
      })

      lastStatus = response.status()
      retryAfter = response.headers()['retry-after'] || ''
    }

    expect(lastStatus).toBe(429)
    expect(Number(retryAfter)).toBeGreaterThan(0)
  })

  test('authenticated user sees validation errors on malformed writes', async ({ browser }) => {
    const { context, page } = await newAuthedPage(browser, CREDS.user.email, CREDS.user.password)

    try {
      await page.goto('/offers')

      const favorite = await api(page, '/api/favorites', {
        method: 'POST',
        body: { entityType: 'INVALID', entityId: IDS.freeOfferId },
      })
      expect(favorite.status).toBe(400)

      const demand = await api(page, '/api/demand/create', {
        method: 'POST',
        body: {},
      })
      expect(demand.status).toBe(400)

      const subscribe = await api(page, '/api/subscriptions/subscribe', {
        method: 'POST',
        body: { planCode: 'free' },
      })
      expect(subscribe.status).toBe(400)
    } finally {
      await context.close()
    }
  })

  test('business owner cannot create offers for another merchant', async ({ browser }) => {
    const { context, page } = await newAuthedPage(browser, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)

    try {
      await page.goto('/business/offers')

      const response = await api(page, '/api/business/offers', {
        method: 'POST',
        body: {
          merchantId: IDS.beautyBusinessId,
          branchId: IDS.coffeePlaceId,
          title: 'Unauthorized cross-merchant offer',
          offerType: 'PERCENT_DISCOUNT',
          visibility: 'PUBLIC',
          benefitType: 'PERCENT',
          benefitValue: 10,
          currency: 'RUB',
          startAt: new Date(Date.now() + 60_000).toISOString(),
          endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          redemptionChannel: 'IN_STORE',
        },
      })

      expect(response.status).toBe(403)
      expect(response.text).toContain('not owned by you')
    } finally {
      await context.close()
    }
  })

  test('merchant from another business cannot validate a redemption code', async ({ browser }) => {
    // ensureSubscriberCanRedeem requires local DB (Prisma) — skip if unavailable
    try {
      await ensureSubscriberCanRedeem()
    } catch (e: any) {
      if (e.message?.includes("Can't reach database")) {
        test.skip(true, 'Requires local database connection for Prisma')
      }
      throw e
    }

    const user = await newAuthedPage(browser, CREDS.subscriber.email, CREDS.subscriber.password)
    const beautyOwner = await newAuthedPage(browser, CREDS.beautyOwner.email, CREDS.beautyOwner.password)

    try {
      await user.page.goto('/offers')
      await beautyOwner.page.goto('/business/offers')

      const create = await api<{ session?: { shortCode: string } }>(user.page, '/api/redemptions/create-session', {
        method: 'POST',
        body: { offerId: IDS.memberOfferId },
      })
      expect(create.status).toBe(201)

      const validate = await api(beautyOwner.page, '/api/redemptions/validate', {
        method: 'POST',
        body: { shortCode: create.body.session?.shortCode },
      })

      expect(validate.status).toBe(400)
      expect(validate.text).toContain('SCANNER_NOT_AUTHORIZED')
    } finally {
      await user.context.close()
      await beautyOwner.context.close()
    }
  })

  test('admin cannot deactivate their own account', async ({ browser }) => {
    const { context, page } = await newAuthedPage(browser, CREDS.admin.email, CREDS.admin.password)

    try {
      await page.goto('/admin/users')

      const me = await api<{ user?: { userId: string } }>(page, '/api/auth/me')
      expect(me.status).toBe(200)
      expect(me.body.user?.userId).toBeTruthy()

      const response = await api(page, `/api/admin/users/${me.body.user?.userId}`, {
        method: 'PATCH',
        body: { isActive: false },
      })

      expect(response.status).toBe(400)
      expect(response.text).toContain('Нельзя изменить свой собственный аккаунт')
    } finally {
      await context.close()
    }
  })
})
