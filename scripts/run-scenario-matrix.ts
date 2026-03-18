import { chromium, type Page } from 'playwright'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import fs from 'node:fs/promises'
import path from 'node:path'

const prisma = new PrismaClient()
const BASE_URL = process.env.BASE_URL || 'http://localhost:3013'
const PASSWORD = 'Test1234!'
const NAVIGATION_TIMEOUT_MS = 120000

const IDS = {
  citySlug: 'spb',
  coffeeBusinessId: 'biz-coffee-house',
  beautyBusinessId: 'biz-beauty-studio',
  restaurantBusinessId: 'biz-gastro-pub',
  coffeePlaceId: 'place-coffee-nevsky',
  beautyPlaceId: 'place-beauty-liteiny',
  restaurantPlaceId: 'place-gastro-rubinshteina',
  pizzaPlaceId: 'place-pizza-ligovsky-qa',
  noOffersPlaceId: 'place-no-offers-bar',
  freeOfferId: 'offer-coffee-20',
  memberOfferId: 'offer-free-dessert',
} as const

const CREDS = {
  admin: { email: 'admin@echocity.ru', password: PASSWORD },
  user: { email: 'user@echocity.ru', password: PASSWORD },
  subscriber: { email: 'maria@echocity.ru', password: PASSWORD },
  coffeeOwner: { email: 'coffee@echocity.ru', password: PASSWORD },
  beautyOwner: { email: 'beauty@echocity.ru', password: PASSWORD },
  restaurantOwner: { email: 'restaurant@echocity.ru', password: PASSWORD },
  staff: { email: 'cashier@echocity.ru', password: PASSWORD },
} as const

type Scenario = {
  id: string
  role: 'user' | 'business' | 'admin'
  title: string
  run: (ctx: Ctx) => Promise<void>
}

type Ctx = {
  pages: Record<string, Page>
  setup: {
    spbCityId: string
    qaCitizenId: string
    qaPendingBusinessId: string
    serviceTypeCoffeeId: string
  }
  state: Record<string, string>
}

type ApiResponse<T = any> = { ok: boolean; status: number; body: T; text: string }

let seq = 0
const nextId = (p: string) => `${p}-${Date.now()}-${++seq}`

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function bodyText(page: Page) {
  return (await page.textContent('body')) || ''
}

async function api<T = any>(page: Page, url: string, init?: { method?: string; body?: any }): Promise<ApiResponse<T>> {
  return page.evaluate(async ({ url, init }) => {
    const res = await fetch(url, {
      method: init?.method || 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    })
    const text = await res.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    return { ok: res.ok, status: res.status, body, text }
  }, { url, init })
}

async function gotoOk(page: Page, route: string, expected?: string | RegExp) {
  const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
  assert(response, `No response for ${route}`)
  assert(response.status() < 500, `${route} returned ${response.status()}`)
  await page.waitForLoadState('load')
  await sleep(1000)
  if (expected) {
    const text = await bodyText(page)
    if (typeof expected === 'string') assert(text.includes(expected), `${route} missing "${expected}"`)
    else assert(expected.test(text), `${route} body mismatch`)
  }
}

async function gotoRedirect(page: Page, route: string, contains: string) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
  await page.waitForLoadState('load')
  assert(page.url().includes(contains), `${route} did not redirect to ${contains}`)
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
  await page.waitForLoadState('load')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), { timeout: NAVIGATION_TIMEOUT_MS })
  const me = await api(page, '/api/auth/me')
  assert(me.ok, `Login failed for ${email}`)
}

async function prewarmRoutes() {
  const routes = [
    '/',
    '/offers',
    '/map',
    '/tourist',
    '/bundles',
    '/missions',
    '/search',
    '/subscription',
    '/offers/offer-coffee-20',
  ]

  for (const route of routes) {
    try {
      await fetch(`${BASE_URL}${route}`)
    } catch {
      // Best-effort warm-up for slow dev compilations.
    }
  }
}

async function ensureScenarioData() {
  const hash = await bcrypt.hash(PASSWORD, 10)
  const spb = await prisma.city.findUnique({ where: { slug: IDS.citySlug } })
  assert(spb, 'Run prisma seed first')
  const plusPlan = await prisma.subscriptionPlan.findUnique({ where: { code: 'plus' } })
  assert(plusPlan, 'Run subscription plan seed first')

  const qaCitizen = await prisma.user.upsert({
    where: { email: 'qa-citizen@echocity.ru' },
    update: { isActive: true, role: 'CITIZEN' },
    create: {
      email: 'qa-citizen@echocity.ru',
      passwordHash: hash,
      role: 'CITIZEN',
      firstName: 'QA',
      lastName: 'Citizen',
      city: 'Санкт-Петербург',
      isActive: true,
    },
  })

  const regularUser = await prisma.user.findUnique({ where: { email: CREDS.user.email } })
  assert(regularUser, 'Regular user seed is missing')

  await prisma.user.upsert({
    where: { email: 'admin2@echocity.ru' },
    update: { isActive: true, role: 'ADMIN' },
    create: {
      email: 'admin2@echocity.ru',
      passwordHash: hash,
      role: 'ADMIN',
      firstName: 'Second',
      lastName: 'Admin',
      city: 'Санкт-Петербург',
      isActive: true,
    },
  })

  const subscriber = await prisma.user.findUnique({ where: { email: CREDS.subscriber.email } })
  assert(subscriber, 'Subscriber seed user is missing')

  const activeSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId: subscriber.id,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (activeSubscription) {
    await prisma.userSubscription.update({
      where: { id: activeSubscription.id },
      data: {
        planId: plusPlan.id,
        status: 'ACTIVE',
        autoRenew: true,
        canceledAt: null,
        endAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      },
    })
  } else {
    await prisma.userSubscription.create({
      data: {
        userId: subscriber.id,
        planId: plusPlan.id,
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    })
  }

  await prisma.redemptionEvent.deleteMany({
    where: {
      OR: [
        {
          session: {
            userId: regularUser.id,
            offerId: IDS.freeOfferId,
          },
        },
        {
          redemption: {
            userId: regularUser.id,
            offerId: IDS.freeOfferId,
          },
        },
        {
          session: {
            userId: subscriber.id,
            offerId: IDS.memberOfferId,
          },
        },
        {
          redemption: {
            userId: subscriber.id,
            offerId: IDS.memberOfferId,
          },
        },
      ],
    },
  })

  await prisma.redemption.deleteMany({
    where: {
      OR: [
        {
          userId: regularUser.id,
          offerId: IDS.freeOfferId,
        },
        {
          userId: subscriber.id,
          offerId: IDS.memberOfferId,
        },
      ],
    },
  })

  await prisma.redemptionSession.deleteMany({
    where: {
      OR: [
        {
          userId: regularUser.id,
          offerId: IDS.freeOfferId,
        },
        {
          userId: subscriber.id,
          offerId: IDS.memberOfferId,
        },
      ],
    },
  })

  await prisma.complaint.deleteMany({
    where: {
      userId: regularUser.id,
    },
  })

  await prisma.demandRequest.update({
    where: { id: 'demand-bar-discount' },
    data: {
      status: 'OPEN',
      supportCount: 3,
    },
  })

  await prisma.demandResponse.deleteMany({
    where: {
      demandRequestId: 'demand-bar-discount',
      merchantId: { in: [IDS.restaurantBusinessId, IDS.coffeeBusinessId, IDS.beautyBusinessId] },
    },
  })

  const pendingOwner = await prisma.user.upsert({
    where: { email: 'pending-owner@echocity.ru' },
    update: { isActive: true, role: 'BUSINESS_OWNER' },
    create: {
      email: 'pending-owner@echocity.ru',
      passwordHash: hash,
      role: 'BUSINESS_OWNER',
      firstName: 'Pending',
      lastName: 'Owner',
      city: 'Санкт-Петербург',
      isActive: true,
    },
  })

  const pendingBusiness = await prisma.business.upsert({
    where: { id: 'biz-pending-qa' },
    update: { ownerId: pendingOwner.id, status: 'PENDING' },
    create: {
      id: 'biz-pending-qa',
      ownerId: pendingOwner.id,
      name: 'QA Pending Pizza',
      type: 'RESTAURANT',
      description: 'Scenario pending business',
      status: 'PENDING',
    },
  })

  await prisma.place.upsert({
    where: { id: IDS.pizzaPlaceId },
    update: { businessId: pendingBusiness.id, cityId: spb.id, isActive: true, isPublished: true, isApproved: true },
    create: {
      id: IDS.pizzaPlaceId,
      businessId: pendingBusiness.id,
      title: 'QA Pizza Place',
      city: 'Санкт-Петербург',
      cityId: spb.id,
      address: 'Лиговский проспект, 50',
      lat: 59.9272,
      lng: 30.3609,
      placeType: 'RESTAURANT',
      isActive: true,
      isPublished: true,
      isApproved: true,
      descriptionShort: 'Пицца рядом с вами',
    },
  })

  await prisma.tableConfig.upsert({
    where: { placeId_tableNumber: { placeId: IDS.coffeePlaceId, tableNumber: 'QA-1' } },
    update: { seats: 4, isActive: true },
    create: { placeId: IDS.coffeePlaceId, tableNumber: 'QA-1', seats: 4, zone: 'main', isActive: true },
  })

  await prisma.fraudFlag.upsert({
    where: { id: 'fraud-qa-open' },
    update: {},
    create: {
      id: 'fraud-qa-open',
      entityType: 'REDEMPTION',
      entityId: 'qa-entity',
      flagType: 'SUSPICIOUS_PATTERN',
      severity: 'HIGH',
      reason: 'Scenario matrix placeholder',
      status: 'OPEN',
    },
  })

  const coffeeType = await prisma.serviceType.findUnique({ where: { slug: 'coffee' } })
  assert(coffeeType, 'Missing coffee service type')

  return {
    spbCityId: spb.id,
    qaCitizenId: qaCitizen.id,
    qaPendingBusinessId: pendingBusiness.id,
    serviceTypeCoffeeId: coffeeType.id,
  }
}

async function openPages() {
  const browser = await chromium.launch({ headless: true })
  const pages: Record<string, Page> = {}
  for (const key of ['guest', 'user', 'subscriber', 'coffeeOwner', 'beautyOwner', 'restaurantOwner', 'staff', 'admin']) {
    const context = await browser.newContext({ baseURL: BASE_URL })
    await context.addInitScript(() => {
      window.localStorage.setItem('echocity_onboarded', '1')
    })
    pages[key] = await context.newPage()
  }
  await login(pages.user, CREDS.user.email, CREDS.user.password)
  await login(pages.subscriber, CREDS.subscriber.email, CREDS.subscriber.password)
  await login(pages.coffeeOwner, CREDS.coffeeOwner.email, CREDS.coffeeOwner.password)
  await login(pages.beautyOwner, CREDS.beautyOwner.email, CREDS.beautyOwner.password)
  await login(pages.restaurantOwner, CREDS.restaurantOwner.email, CREDS.restaurantOwner.password)
  await login(pages.staff, CREDS.staff.email, CREDS.staff.password)
  await login(pages.admin, CREDS.admin.email, CREDS.admin.password)
  return { browser, pages }
}

async function createOffer(page: Page, merchantId: string, branchId: string, suffix: string) {
  const response = await api<{ offer?: { id: string } }>(page, '/api/business/offers', {
    method: 'POST',
    body: {
      merchantId,
      branchId,
      title: `QA Offer ${suffix}`,
      subtitle: 'Scenario matrix offer',
      description: 'Offer created by scenario runner',
      offerType: 'PERCENT_DISCOUNT',
      visibility: 'PUBLIC',
      benefitType: 'PERCENT',
      benefitValue: 15,
      currency: 'RUB',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      redemptionChannel: 'IN_STORE',
    },
  })
  assert(response.status === 201, response.text)
  assert(response.body.offer?.id, 'Missing created offer id')
  return response.body.offer.id
}

const allScenarios: Scenario[] = []

const guestPages: Array<[string, string, string | RegExp | undefined]> = [
  ['/', 'Guest home', /Скидки рядом с вами/i],
  ['/offers', 'Guest offers', /Скидки/i],
  ['/map', 'Guest map', undefined],
  ['/tourist', 'Guest tourist', /турист|предлож/i],
  ['/bundles', 'Guest bundles', undefined],
  ['/missions', 'Guest missions', undefined],
  ['/search', 'Guest search', undefined],
  ['/auth/login', 'Guest login page', /Вход/i],
  ['/auth/register', 'Guest register page', /Регистрация/i],
  ['/subscription', 'Guest subscription', undefined],
  [`/offers/${IDS.freeOfferId}`, 'Guest free offer detail', undefined],
  ['/business/register', 'Guest business register', /Регистрация бизнеса/i],
]

guestPages.forEach(([route, title, expected], index) => {
  allScenarios.push({
    id: `user-${String(index + 1).padStart(2, '0')}`,
    role: 'user',
    title,
    run: async ({ pages }) => gotoOk(pages.guest, route, expected),
  })
})

allScenarios.push(
  { id: 'user-13', role: 'user', title: 'Guest favorites auth gate', run: async ({ pages }) => { await gotoOk(pages.guest, '/favorites'); const text = await bodyText(pages.guest); assert(text.includes('Войти') || text.includes('Регистрация') || pages.guest.url().includes('/auth/login'), 'favorites did not show auth gate') } },
  { id: 'user-14', role: 'user', title: 'Guest settings auth gate', run: async ({ pages }) => { await gotoOk(pages.guest, '/settings'); const text = await bodyText(pages.guest); assert(text.includes('Войти') || text.includes('Регистрация') || pages.guest.url().includes('/auth/login'), 'settings did not show auth gate') } },
  { id: 'user-15', role: 'user', title: 'Guest profile auth gate', run: async ({ pages }) => { await gotoOk(pages.guest, '/profile'); const text = await bodyText(pages.guest); assert(text.includes('Войти') || text.includes('Не удалось загрузить профиль') || text.includes('Регистрация'), 'profile did not show auth gate') } },
  { id: 'user-16', role: 'user', title: 'Guest dashboard redirect', run: async ({ pages }) => gotoRedirect(pages.guest, '/dashboard', '/auth/login') },
  { id: 'user-17', role: 'user', title: 'Guest reservations auth gate', run: async ({ pages }) => { await gotoOk(pages.guest, '/reservations'); const text = await bodyText(pages.guest); assert(text.includes('Войдите') || text.includes('Войти'), 'reservations did not show auth gate') } },
  { id: 'user-18', role: 'user', title: 'Guest history fallback', run: async ({ pages }) => gotoOk(pages.guest, '/history') },
)

allScenarios.push(
  {
    id: 'user-19',
    role: 'user',
    title: 'Guest search finds pizza',
    run: async ({ pages, setup }) => {
      const response = await api<{ places: Array<{ name: string }> }>(pages.guest, `/api/public/search?q=pizza&cityId=${setup.spbCityId}`)
      assert(response.ok, response.text)
      assert(response.body.places.some((place) => place.name.includes('Pizza')), 'Pizza place not found')
    },
  },
  {
    id: 'user-20',
    role: 'user',
    title: 'Guest map API returns places',
    run: async ({ pages }) => {
      const response = await api<{ places: unknown[] }>(pages.guest, '/api/places')
      assert(response.ok, response.text)
      assert(response.body.places.length > 0, 'No places returned')
    },
  },
  {
    id: 'user-21',
    role: 'user',
    title: 'Citizen dashboard redirects to profile',
    run: async ({ pages }) => gotoRedirect(pages.user, '/dashboard', '/profile'),
  },
  {
    id: 'user-22',
    role: 'user',
    title: 'Citizen profile page',
    run: async ({ pages }) => gotoOk(pages.user, '/profile'),
  },
  {
    id: 'user-23',
    role: 'user',
    title: 'Citizen settings page',
    run: async ({ pages }) => gotoOk(pages.user, '/settings'),
  },
  {
    id: 'user-24',
    role: 'user',
    title: 'Citizen favorites page',
    run: async ({ pages }) => gotoOk(pages.user, '/favorites'),
  },
  {
    id: 'user-25',
    role: 'user',
    title: 'Citizen history page',
    run: async ({ pages }) => gotoOk(pages.user, '/history'),
  },
  {
    id: 'user-26',
    role: 'user',
    title: 'Citizen family page',
    run: async ({ pages }) => gotoOk(pages.user, '/family'),
  },
  {
    id: 'user-27',
    role: 'user',
    title: 'Citizen reservations page',
    run: async ({ pages }) => gotoOk(pages.user, '/reservations'),
  },
  {
    id: 'user-28',
    role: 'user',
    title: 'Auth me returns CITIZEN',
    run: async ({ pages }) => {
      const response = await api<{ user: { role: string } }>(pages.user, '/api/auth/me')
      assert(response.ok, response.text)
      assert(response.body.user.role === 'CITIZEN', 'Wrong user role')
    },
  },
  {
    id: 'user-29',
    role: 'user',
    title: 'Profile API returns current email',
    run: async ({ pages }) => {
      const response = await api<{ profile: { user: { email: string } } }>(pages.user, '/api/profile')
      assert(response.ok, response.text)
      assert(response.body.profile.user.email === CREDS.user.email, 'Wrong profile email')
    },
  },
  {
    id: 'user-30',
    role: 'user',
    title: 'Profile update succeeds',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/profile', { method: 'PUT', body: { homeCity: 'Санкт-Петербург', preferredLanguage: 'ru', preferredRadius: 1500 } })
      assert(response.ok, response.text)
    },
  },
  {
    id: 'user-31',
    role: 'user',
    title: 'Add offer favorite',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/favorites', { method: 'POST', body: { entityType: 'OFFER', entityId: IDS.freeOfferId } })
      assert(response.status === 201, response.text)
    },
  },
  {
    id: 'user-32',
    role: 'user',
    title: 'Offer favorite appears in list',
    run: async ({ pages }) => {
      const response = await api<{ favorites: Array<{ entityId: string }> }>(pages.user, '/api/favorites?entityType=OFFER')
      assert(response.ok, response.text)
      assert(response.body.favorites.some((fav) => fav.entityId === IDS.freeOfferId), 'Offer favorite missing')
    },
  },
  {
    id: 'user-33',
    role: 'user',
    title: 'Remove offer favorite',
    run: async ({ pages }) => {
      const response = await api(pages.user, `/api/favorites/OFFER/${IDS.freeOfferId}`, { method: 'DELETE' })
      assert(response.status === 204, `Expected 204, got ${response.status}`)
    },
  },
  {
    id: 'user-34',
    role: 'user',
    title: 'Add place favorite',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/favorites', { method: 'POST', body: { entityType: 'PLACE', entityId: IDS.coffeePlaceId } })
      assert(response.status === 201, response.text)
    },
  },
  {
    id: 'user-35',
    role: 'user',
    title: 'Place favorite appears in list',
    run: async ({ pages }) => {
      const response = await api<{ favorites: Array<{ entityId: string }> }>(pages.user, '/api/favorites?entityType=PLACE')
      assert(response.ok, response.text)
      assert(response.body.favorites.some((fav) => fav.entityId === IDS.coffeePlaceId), 'Place favorite missing')
    },
  },
  {
    id: 'user-36',
    role: 'user',
    title: 'Create demand request',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/demand/create', { method: 'POST', body: { placeId: IDS.noOffersPlaceId } })
      assert(response.status === 201, response.text)
    },
  },
  {
    id: 'user-37',
    role: 'user',
    title: 'Create complaint',
    run: async ({ pages, state }) => {
      const response = await api<{ complaint: { id: string } }>(pages.user, '/api/complaints', {
        method: 'POST',
        body: { placeId: IDS.coffeePlaceId, offerId: IDS.freeOfferId, type: 'WRONG_DISCOUNT', description: 'Сценарная жалоба: скидка была применена неверно и не совпала с условиями.' },
      })
      assert(response.status === 201, response.text)
      state.complaintId = response.body.complaint.id
    },
  },
  {
    id: 'user-38',
    role: 'user',
    title: 'Complaint appears in user list',
    run: async ({ pages, state }) => {
      const response = await api<{ complaints: Array<{ id: string }> }>(pages.user, '/api/complaints')
      assert(response.ok, response.text)
      assert(!!state.complaintId && response.body.complaints.some((x) => x.id === state.complaintId), 'Complaint missing')
    },
  },
  {
    id: 'user-39',
    role: 'user',
    title: 'Free user subscription status endpoint works',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/subscriptions/status')
      assert(response.ok, response.text)
    },
  },
  {
    id: 'user-40',
    role: 'user',
    title: 'Subscriber status is active',
    run: async ({ pages }) => {
      const response = await api<any>(pages.subscriber, '/api/subscriptions/status')
      assert(response.ok, response.text)
      const status = response.body.subscription?.status || response.body.status
      assert(status === 'ACTIVE' || status === 'TRIALING', 'Subscriber status mismatch')
    },
  },
  {
    id: 'user-41',
    role: 'user',
    title: 'Regular user blocked from members-only redemption',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/redemptions/create-session', { method: 'POST', body: { offerId: IDS.memberOfferId } })
      assert(response.status === 400, `Expected 400, got ${response.status}`)
    },
  },
  {
    id: 'user-42',
    role: 'user',
    title: 'Regular user creates free redemption session',
    run: async ({ pages, state }) => {
      const response = await api<{ session: { shortCode: string } }>(pages.user, '/api/redemptions/create-session', { method: 'POST', body: { offerId: 'offer-beauty-first' } })
      assert(response.status === 201, response.text)
      state.freeShortCode = response.body.session.shortCode
    },
  },
  {
    id: 'user-43',
    role: 'user',
    title: 'Subscriber creates members-only redemption session',
    run: async ({ pages, state }) => {
      const response = await api<{ session: { shortCode: string } }>(pages.subscriber, '/api/redemptions/create-session', { method: 'POST', body: { offerId: IDS.memberOfferId } })
      assert(response.status === 201, response.text)
      state.memberShortCode = response.body.session.shortCode
    },
  },
  {
    id: 'user-44',
    role: 'user',
    title: 'Redemptions history endpoint works',
    run: async ({ pages }) => {
      const response = await api(pages.user, '/api/redemptions/history')
      assert(response.ok, response.text)
    },
  },
  {
    id: 'user-45',
    role: 'user',
    title: 'Reservation slots API works',
    run: async ({ pages }) => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const response = await api<{ slots: unknown[] }>(pages.user, `/api/reservations/slots?placeId=${IDS.coffeePlaceId}&date=${tomorrow}&partySize=2`)
      assert(response.ok, response.text)
      assert(Array.isArray(response.body.slots), 'Slots missing')
    },
  },
  {
    id: 'user-46',
    role: 'user',
    title: 'Create reservation',
    run: async ({ pages, state }) => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const response = await api<{ reservation: { id: string } }>(pages.user, '/api/reservations', {
        method: 'POST',
        body: { placeId: IDS.coffeePlaceId, date: tomorrow, timeSlot: '19:00', partySize: 2, guestName: 'Scenario User', guestPhone: '+79990000000', note: 'scenario' },
      })
      assert(response.status === 201, response.text)
      state.reservationId = response.body.reservation.id
    },
  },
  {
    id: 'user-47',
    role: 'user',
    title: 'Reservation appears in list',
    run: async ({ pages, state }) => {
      const response = await api<{ reservations: Array<{ id: string }> }>(pages.user, '/api/reservations')
      assert(response.ok, response.text)
      assert(!!state.reservationId && response.body.reservations.some((x) => x.id === state.reservationId), 'Reservation missing')
    },
  },
  {
    id: 'user-48',
    role: 'user',
    title: 'Coffee category filter returns offers',
    run: async ({ pages }) => {
      const response = await api<{ offers: unknown[] }>(pages.guest, '/api/offers?category=coffee')
      assert(response.ok, response.text)
      assert(response.body.offers.length > 0, 'No coffee offers')
    },
  },
  {
    id: 'user-49',
    role: 'user',
    title: 'Beauty category filter returns offers',
    run: async ({ pages }) => {
      const response = await api<{ offers: unknown[] }>(pages.guest, '/api/offers?category=beauty')
      assert(response.ok, response.text)
      assert(response.body.offers.length > 0, 'No beauty offers')
    },
  },
  {
    id: 'user-50',
    role: 'user',
    title: 'Subscriber plan switch endpoint works',
    run: async ({ pages }) => {
      const response = await api(pages.subscriber, '/api/subscriptions/subscribe', { method: 'POST', body: { planCode: 'premium' } })
      assert(response.status === 200, response.text)
    },
  },
)

;[
  ['coffeeOwner', '/business/dashboard', 'Coffee dashboard'],
  ['coffeeOwner', '/business/offers', 'Coffee offers page'],
  ['coffeeOwner', '/business/stories', 'Coffee stories page'],
  ['coffeeOwner', '/business/staff', 'Coffee staff page'],
  ['coffeeOwner', '/business/places', 'Coffee places page'],
  ['coffeeOwner', '/business/tables', 'Coffee tables page'],
  ['coffeeOwner', '/business/reservations-manage', 'Coffee reservations page'],
  ['coffeeOwner', '/business/demand', 'Coffee demand page'],
  ['coffeeOwner', '/business/bundles', 'Coffee bundles page'],
  ['coffeeOwner', '/business/redemptions', 'Coffee redemptions page'],
  ['coffeeOwner', '/business/analytics', 'Coffee analytics page'],
  ['coffeeOwner', '/business/scanner', 'Coffee scanner page'],
  ['beautyOwner', '/business/dashboard', 'Beauty dashboard'],
  ['beautyOwner', '/business/offers', 'Beauty offers page'],
  ['restaurantOwner', '/business/dashboard', 'Restaurant dashboard'],
  ['restaurantOwner', '/business/offers', 'Restaurant offers page'],
  ['staff', '/business/scanner', 'Staff scanner page'],
].forEach(([pageKey, route, title], index) => {
  allScenarios.push({
    id: `business-${String(index + 1).padStart(2, '0')}`,
    role: 'business',
    title,
    run: async ({ pages }) => gotoOk(pages[pageKey], route),
  })
})

allScenarios.push(
  { id: 'business-18', role: 'business', title: 'Coffee offers API', run: async ({ pages }) => { const r = await api<{ offers: unknown[] }>(pages.coffeeOwner, '/api/business/offers'); assert(r.ok && r.body.offers.length > 0, 'business offers missing') } },
  { id: 'business-19', role: 'business', title: 'Create business offer', run: async ({ pages, state }) => { state.createdOfferId = await createOffer(pages.coffeeOwner, IDS.coffeeBusinessId, IDS.coffeePlaceId, 'created') } },
  { id: 'business-20', role: 'business', title: 'Created offer appears', run: async ({ pages, state }) => { const r = await api<{ offers: Array<{ id: string }> }>(pages.coffeeOwner, '/api/business/offers'); assert(!!state.createdOfferId && r.body.offers.some((x) => x.id === state.createdOfferId), 'created offer missing') } },
  { id: 'business-21', role: 'business', title: 'Submit created offer', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/offers/${state.createdOfferId}`, { method: 'PATCH', body: { title: 'QA Offer Updated' } }); assert(r.ok, r.text) } },
  { id: 'business-22', role: 'business', title: 'Submit for moderation', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/offers/${state.createdOfferId}/submit`, { method: 'POST' }); assert(r.ok, r.text); state.submittedOfferId = state.createdOfferId } },
  { id: 'business-23', role: 'business', title: 'Create rejectable offer', run: async ({ pages, state }) => { state.rejectableOfferId = await createOffer(pages.coffeeOwner, IDS.coffeeBusinessId, IDS.coffeePlaceId, 'rejectable') } },
  { id: 'business-24', role: 'business', title: 'Submit rejectable offer', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/offers/${state.rejectableOfferId}/submit`, { method: 'POST' }); assert(r.ok, r.text) } },
  { id: 'business-25', role: 'business', title: 'Pause active offer', run: async ({ pages }) => { const r = await api(pages.coffeeOwner, `/api/business/offers/${IDS.freeOfferId}/pause`, { method: 'POST' }); assert(r.ok, r.text) } },
  { id: 'business-26', role: 'business', title: 'Resume active offer', run: async ({ pages }) => { const r = await api(pages.coffeeOwner, `/api/business/offers/${IDS.freeOfferId}/resume`, { method: 'POST' }); assert(r.ok, r.text) } },
  { id: 'business-27', role: 'business', title: 'Beauty draft visible', run: async ({ pages }) => { const r = await api<{ offers: Array<{ id: string }> }>(pages.beautyOwner, '/api/business/offers'); assert(r.body.offers.some((x) => x.id === 'offer-draft-beauty'), 'beauty draft missing') } },
  { id: 'business-28', role: 'business', title: 'Restaurant pending visible', run: async ({ pages }) => { const r = await api<{ offers: Array<{ id: string }> }>(pages.restaurantOwner, '/api/business/offers'); assert(r.body.offers.some((x) => x.id === 'offer-pending-gastro'), 'restaurant pending missing') } },
  { id: 'business-29', role: 'business', title: 'Cross-merchant create forbidden', run: async ({ pages }) => { const r = await api(pages.coffeeOwner, '/api/business/offers', { method: 'POST', body: { merchantId: IDS.beautyBusinessId, branchId: IDS.beautyPlaceId, title: 'hack', offerType: 'PERCENT_DISCOUNT', visibility: 'PUBLIC', benefitType: 'PERCENT', benefitValue: 10, currency: 'RUB', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 86400000).toISOString() } }); assert(r.status === 403, `expected 403 got ${r.status}`) } },
  { id: 'business-30', role: 'business', title: 'Staff API lists staff', run: async ({ pages }) => { const r = await api<{ staff: unknown[] }>(pages.coffeeOwner, '/api/business/staff'); assert(r.ok && Array.isArray(r.body.staff), 'staff list missing') } },
  { id: 'business-31', role: 'business', title: 'Invite QA citizen as staff', run: async ({ pages, state }) => { const r = await api<{ staff: { id: string } }>(pages.coffeeOwner, '/api/business/staff', { method: 'POST', body: { merchantId: IDS.coffeeBusinessId, branchId: IDS.coffeePlaceId, email: 'qa-citizen@echocity.ru', staffRole: 'CASHIER' } }); assert(r.status === 201, r.text); state.invitedStaffId = r.body.staff.id } },
  { id: 'business-32', role: 'business', title: 'Remove invited staff', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/staff/${state.invitedStaffId}`, { method: 'DELETE' }); assert(r.ok, r.text) } },
  { id: 'business-33', role: 'business', title: 'Services list endpoint', run: async ({ pages }) => { const r = await api<{ services: unknown[] }>(pages.coffeeOwner, `/api/business/places/${IDS.coffeePlaceId}/services`); assert(r.ok && Array.isArray(r.body.services), 'services list missing') } },
  { id: 'business-34', role: 'business', title: 'Create service', run: async ({ pages, setup, state }) => { const r = await api<{ service: { id: string } }>(pages.coffeeOwner, `/api/business/places/${IDS.coffeePlaceId}/services`, { method: 'POST', body: { serviceTypeId: setup.serviceTypeCoffeeId, name: 'QA House Coffee', price: 250, isSpecial: true, specialPrice: 199 } }); assert(r.status === 201 || r.status === 409, r.text); state.serviceId = r.body?.service?.id || state.serviceId } },
  { id: 'business-35', role: 'business', title: 'Update service', run: async ({ pages, state }) => { if (!state.serviceId) return; const r = await api(pages.coffeeOwner, `/api/business/places/${IDS.coffeePlaceId}/services/${state.serviceId}`, { method: 'PATCH', body: { specialTitle: 'QA Updated', price: 275 } }); assert(r.ok, r.text) } },
  { id: 'business-36', role: 'business', title: 'Delete service', run: async ({ pages, state }) => { if (!state.serviceId) return; const r = await api(pages.coffeeOwner, `/api/business/places/${IDS.coffeePlaceId}/services/${state.serviceId}`, { method: 'DELETE' }); assert(r.ok, r.text) } },
  { id: 'business-37', role: 'business', title: 'Tables list endpoint', run: async ({ pages }) => { const r = await api<{ tables: unknown[] }>(pages.coffeeOwner, `/api/business/tables?placeId=${IDS.coffeePlaceId}`); assert(r.ok && Array.isArray(r.body.tables), 'tables list missing') } },
  { id: 'business-38', role: 'business', title: 'Create table', run: async ({ pages, state }) => { const r = await api<{ table: { id: string } }>(pages.coffeeOwner, '/api/business/tables', { method: 'POST', body: { placeId: IDS.coffeePlaceId, tableNumber: nextId('T').slice(-6), seats: 6, zone: 'window' } }); assert(r.status === 201, r.text); state.tableId = r.body.table.id } },
  { id: 'business-39', role: 'business', title: 'Update table', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/tables/${state.tableId}`, { method: 'PATCH', body: { seats: 8, zone: 'vip' } }); assert(r.ok, r.text) } },
  { id: 'business-40', role: 'business', title: 'Delete table', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/tables/${state.tableId}`, { method: 'DELETE' }); assert(r.ok, r.text) } },
  { id: 'business-41', role: 'business', title: 'Reservations list endpoint', run: async ({ pages }) => { const r = await api<{ reservations: unknown[] }>(pages.coffeeOwner, `/api/business/reservations?placeId=${IDS.coffeePlaceId}`); assert(r.ok && Array.isArray(r.body.reservations), 'reservations list missing') } },
  { id: 'business-42', role: 'business', title: 'Confirm reservation', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/reservations/${state.reservationId}`, { method: 'PATCH', body: { action: 'confirm' } }); assert(r.ok, r.text) } },
  { id: 'business-43', role: 'business', title: 'Complete reservation', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/reservations/${state.reservationId}`, { method: 'PATCH', body: { action: 'complete' } }); assert(r.ok, r.text) } },
  { id: 'business-44', role: 'business', title: 'Respond to demand', run: async ({ pages, state }) => { const r = await api<{ response: { id: string } }>(pages.restaurantOwner, '/api/business/demand/respond', { method: 'POST', body: { demandRequestId: 'demand-bar-discount', message: 'Готовы предложить скидку 15%.' } }); assert(r.status === 201, r.text); state.demandResponseId = r.body.response.id } },
  { id: 'business-45', role: 'business', title: 'Duplicate demand response rejected', run: async ({ pages }) => { const r = await api(pages.restaurantOwner, '/api/business/demand/respond', { method: 'POST', body: { demandRequestId: 'demand-bar-discount', message: 'duplicate' } }); assert(r.status === 409, `expected 409 got ${r.status}`) } },
  { id: 'business-46', role: 'business', title: 'Redemptions endpoint works', run: async ({ pages }) => { const r = await api<{ redemptions: unknown[] }>(pages.coffeeOwner, '/api/business/redemptions'); assert(r.ok && Array.isArray(r.body.redemptions), 'redemptions payload missing') } },
  { id: 'business-47', role: 'business', title: 'Owner analytics endpoint works', run: async ({ pages }) => { const r = await api<any>(pages.coffeeOwner, '/api/business/analytics'); assert(r.ok && Array.isArray(r.body.offerPerformance), 'owner analytics missing') } },
  { id: 'business-48', role: 'business', title: 'Staff analytics endpoint works', run: async ({ pages }) => { const r = await api<any>(pages.staff, '/api/business/analytics'); assert(r.ok && Array.isArray(r.body.offerPerformance), 'staff analytics missing') } },
  { id: 'business-49', role: 'business', title: 'Staff validates free redemption code', run: async ({ pages }) => { const create = await api<{ session: { shortCode: string } }>(pages.user, '/api/redemptions/create-session', { method: 'POST', body: { offerId: IDS.freeOfferId } }); assert(create.status === 201, create.text); const r = await api(pages.staff, '/api/redemptions/validate', { method: 'POST', body: { shortCode: create.body.session.shortCode } }); assert(r.ok, r.text) } },
  { id: 'business-50', role: 'business', title: 'Owner validates members-only redemption code', run: async ({ pages }) => { const create = await api<{ session: { shortCode: string } }>(pages.subscriber, '/api/redemptions/create-session', { method: 'POST', body: { offerId: IDS.memberOfferId } }); assert(create.status === 201, create.text); const r = await api(pages.coffeeOwner, '/api/redemptions/validate', { method: 'POST', body: { shortCode: create.body.session.shortCode } }); assert(r.ok, r.text) } },
)

;['/admin', '/admin/analytics', '/admin/users', '/admin/businesses', '/admin/offers', '/admin/complaints', '/admin/franchises', '/admin/fraud', '/admin/cities', '/admin/bundles', '/admin/api-control'].forEach((route, index) => {
  allScenarios.push({
    id: `admin-${String(index + 1).padStart(2, '0')}`,
    role: 'admin',
    title: `Open ${route}`,
    run: async ({ pages }) => gotoOk(pages.admin, route),
  })
})

allScenarios.push(
  { id: 'admin-12', role: 'admin', title: 'Analytics API', run: async ({ pages }) => { const r = await api<any>(pages.admin, '/api/admin/analytics'); assert(r.ok && r.body.overview.totalUsers > 0, 'analytics missing') } },
  { id: 'admin-13', role: 'admin', title: 'Users API', run: async ({ pages }) => { const r = await api<{ users: unknown[] }>(pages.admin, '/api/admin/users'); assert(r.ok && r.body.users.length > 0, 'users missing') } },
  { id: 'admin-14', role: 'admin', title: 'Users search', run: async ({ pages }) => { const r = await api<{ users: Array<{ email: string }> }>(pages.admin, '/api/admin/users?search=user@echocity.ru'); assert(r.body.users.some((x) => x.email === CREDS.user.email), 'search failed') } },
  { id: 'admin-15', role: 'admin', title: 'Users role filter', run: async ({ pages }) => { const r = await api<{ users: Array<{ role: string }> }>(pages.admin, '/api/admin/users?role=BUSINESS_OWNER'); assert(r.body.users.every((x) => x.role === 'BUSINESS_OWNER'), 'role filter mismatch') } },
  { id: 'admin-16', role: 'admin', title: 'Users active filter', run: async ({ pages }) => { const r = await api<{ users: Array<{ isActive: boolean }> }>(pages.admin, '/api/admin/users?isActive=true'); assert(r.body.users.every((x) => x.isActive), 'active filter mismatch') } },
  { id: 'admin-17', role: 'admin', title: 'User detail API', run: async ({ pages, setup }) => { const r = await api<{ user: { id: string } }>(pages.admin, `/api/admin/users/${setup.qaCitizenId}`); assert(r.ok && r.body.user.id === setup.qaCitizenId, 'user detail failed') } },
  { id: 'admin-18', role: 'admin', title: 'Cannot patch self', run: async ({ pages }) => { const me = await api<any>(pages.admin, '/api/auth/me'); const r = await api(pages.admin, `/api/admin/users/${me.body.user.userId}`, { method: 'PATCH', body: { isActive: false } }); assert(r.status === 400, `expected 400 got ${r.status}`) } },
  { id: 'admin-19', role: 'admin', title: 'Deactivate QA citizen', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/users/${setup.qaCitizenId}`, { method: 'PATCH', body: { isActive: false } }); assert(r.ok, r.text) } },
  { id: 'admin-20', role: 'admin', title: 'Reactivate QA citizen', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/users/${setup.qaCitizenId}`, { method: 'PATCH', body: { isActive: true } }); assert(r.ok, r.text) } },
  { id: 'admin-21', role: 'admin', title: 'Change QA citizen role to staff', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/users/${setup.qaCitizenId}`, { method: 'PATCH', body: { role: 'MERCHANT_STAFF' } }); assert(r.ok, r.text) } },
  { id: 'admin-22', role: 'admin', title: 'Change QA citizen role back', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/users/${setup.qaCitizenId}`, { method: 'PATCH', body: { role: 'CITIZEN' } }); assert(r.ok, r.text) } },
  { id: 'admin-23', role: 'admin', title: 'Businesses approved filter', run: async ({ pages }) => { const r = await api<{ businesses: unknown[] }>(pages.admin, '/api/admin/businesses?status=APPROVED'); assert(r.ok && r.body.businesses.length > 0, 'approved businesses missing') } },
  { id: 'admin-24', role: 'admin', title: 'Business detail API', run: async ({ pages }) => { const r = await api<any>(pages.admin, `/api/admin/businesses/${IDS.coffeeBusinessId}`); assert(r.ok && r.body.business.id === IDS.coffeeBusinessId, 'business detail failed') } },
  { id: 'admin-25', role: 'admin', title: 'Reject business without reason fails', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/businesses/${setup.qaPendingBusinessId}`, { method: 'PATCH', body: { status: 'REJECTED' } }); assert(r.status === 400, `expected 400 got ${r.status}`) } },
  { id: 'admin-26', role: 'admin', title: 'Reject business with reason', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/businesses/${setup.qaPendingBusinessId}`, { method: 'PATCH', body: { status: 'REJECTED', reason: 'scenario reject' } }); assert(r.ok, r.text) } },
  { id: 'admin-27', role: 'admin', title: 'Approve business', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/businesses/${setup.qaPendingBusinessId}`, { method: 'PATCH', body: { status: 'APPROVED' } }); assert(r.ok, r.text) } },
  { id: 'admin-28', role: 'admin', title: 'Suspend business', run: async ({ pages, setup }) => { const r = await api(pages.admin, `/api/admin/businesses/${setup.qaPendingBusinessId}`, { method: 'PATCH', body: { status: 'SUSPENDED' } }); assert(r.ok, r.text) } },
  { id: 'admin-29', role: 'admin', title: 'Suspended business filter works', run: async ({ pages }) => { const r = await api<{ businesses: Array<{ status: string }> }>(pages.admin, '/api/admin/businesses?status=SUSPENDED'); assert(r.body.businesses.some((x) => x.status === 'SUSPENDED'), 'suspended business missing') } },
  { id: 'admin-30', role: 'admin', title: 'Pending offers API', run: async ({ pages, state }) => { const r = await api<{ offers: Array<{ id: string }> }>(pages.admin, '/api/admin/offers?status=PENDING'); assert(r.body.offers.some((x) => x.id === state.submittedOfferId), 'pending submitted offer missing') } },
  { id: 'admin-31', role: 'admin', title: 'Approve submitted offer', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/offers/${state.submittedOfferId}/approve`, { method: 'POST' }); assert(r.ok, r.text) } },
  { id: 'admin-32', role: 'admin', title: 'Reject second offer', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/offers/${state.rejectableOfferId}/reject`, { method: 'POST', body: { reason: 'scenario reject' } }); assert(r.ok, r.text) } },
  { id: 'admin-33', role: 'admin', title: 'Approved offers API', run: async ({ pages }) => { const r = await api<{ offers: unknown[] }>(pages.admin, '/api/admin/offers?status=APPROVED'); assert(r.ok && r.body.offers.length > 0, 'approved offers missing') } },
  { id: 'admin-34', role: 'admin', title: 'Complaints API', run: async ({ pages, state }) => { const r = await api<{ complaints: Array<{ id: string }> }>(pages.admin, '/api/complaints'); assert(r.body.complaints.some((x) => x.id === state.complaintId), 'complaint missing for admin') } },
  { id: 'admin-35', role: 'admin', title: 'Complaint IN_REVIEW', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/complaints/${state.complaintId}`, { method: 'PATCH', body: { status: 'IN_REVIEW', adminNote: 'triage' } }); assert(r.ok, r.text) } },
  { id: 'admin-36', role: 'admin', title: 'Complaint RESOLVED', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/complaints/${state.complaintId}`, { method: 'PATCH', body: { status: 'RESOLVED', adminNote: 'resolved' } }); assert(r.ok, r.text) } },
  { id: 'admin-37', role: 'admin', title: 'Cities list API', run: async ({ pages }) => { const r = await api<{ cities: Array<{ slug: string }> }>(pages.admin, '/api/admin/cities'); assert(r.body.cities.some((x) => x.slug === 'spb'), 'spb missing') } },
  { id: 'admin-38', role: 'admin', title: 'Create city', run: async ({ pages, state }) => { const slug = nextId('qa-city').toLowerCase(); const r = await api(pages.admin, '/api/admin/cities', { method: 'POST', body: { name: `QA City ${slug}`, slug, countryCode: 'RU', timezone: 'Europe/Moscow', defaultLanguage: 'ru' } }); assert(r.status === 201, r.text); state.citySlug = slug } },
  { id: 'admin-39', role: 'admin', title: 'Franchises API', run: async ({ pages }) => { const r = await api<{ franchises: unknown[] }>(pages.admin, '/api/admin/franchises'); assert(r.ok && Array.isArray(r.body.franchises), 'franchises payload missing') } },
  { id: 'admin-40', role: 'admin', title: 'Create franchise', run: async ({ pages, state }) => { const code = nextId('QAFR').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); const r = await api(pages.admin, '/api/admin/franchises', { method: 'POST', body: { code, name: `QA Franchise ${code}`, ownerUserEmail: CREDS.coffeeOwner.email, status: 'ACTIVE', billingEmail: CREDS.coffeeOwner.email } }); assert(r.status === 201, r.text); state.franchiseCode = code } },
  { id: 'admin-41', role: 'admin', title: 'Franchise dropdown contains created', run: async ({ pages, state }) => { const r = await api<{ franchises: Array<{ code: string }> }>(pages.admin, '/api/admin/franchises/list'); assert(r.body.franchises.some((x) => x.code === state.franchiseCode), 'created franchise missing') } },
  { id: 'admin-42', role: 'admin', title: 'Admin place search finds coffee', run: async ({ pages }) => { const r = await api<{ places: Array<{ id: string }> }>(pages.admin, '/api/admin/places/search?q=Coffee'); assert(r.body.places.some((x) => x.id === IDS.coffeePlaceId), 'coffee search missing') } },
  { id: 'admin-43', role: 'admin', title: 'Create bundle', run: async ({ pages, setup, state }) => { const r = await api<any>(pages.admin, '/api/admin/bundles', { method: 'POST', body: { title: `QA Bundle ${nextId('bundle')}`, subtitle: 'Scenario combo', description: 'bundle', validFrom: new Date().toISOString(), cityId: setup.spbCityId, items: [{ placeId: IDS.coffeePlaceId, merchantId: IDS.coffeeBusinessId, offerId: IDS.freeOfferId, itemTitle: 'Coffee item', itemValue: 25000 }, { placeId: IDS.restaurantPlaceId, merchantId: IDS.restaurantBusinessId, offerId: 'offer-lunch-399', itemTitle: 'Lunch item', itemValue: 39900 }] } }); assert(r.status === 201, r.text); state.bundleId = r.body.bundle.id; state.bundleItemId = r.body.bundle.items.find((x: any) => x.merchantId === IDS.coffeeBusinessId)?.id } },
  { id: 'admin-44', role: 'admin', title: 'Bundles API lists created bundle', run: async ({ pages, state }) => { const r = await api<{ bundles: Array<{ id: string }> }>(pages.admin, '/api/admin/bundles'); assert(r.body.bundles.some((x) => x.id === state.bundleId), 'bundle missing') } },
  { id: 'admin-45', role: 'admin', title: 'Merchant accepts bundle item', run: async ({ pages, state }) => { const r = await api(pages.coffeeOwner, `/api/business/bundles/${state.bundleItemId}/accept`, { method: 'POST' }); assert(r.ok, r.text) } },
  { id: 'admin-46', role: 'admin', title: 'Activate bundle', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/bundles/${state.bundleId}`, { method: 'PATCH', body: { action: 'activate' } }); assert(r.ok, r.text) } },
  { id: 'admin-47', role: 'admin', title: 'Pause bundle', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/bundles/${state.bundleId}`, { method: 'PATCH', body: { action: 'pause' } }); assert(r.ok, r.text) } },
  { id: 'admin-48', role: 'admin', title: 'Expire bundle', run: async ({ pages, state }) => { const r = await api(pages.admin, `/api/admin/bundles/${state.bundleId}`, { method: 'PATCH', body: { action: 'expire' } }); assert(r.ok, r.text) } },
  { id: 'admin-49', role: 'admin', title: 'Bundles ACTIVE filter works', run: async ({ pages }) => { const r = await api<{ bundles: unknown[] }>(pages.admin, '/api/admin/bundles?status=ACTIVE'); assert(r.ok && Array.isArray(r.body.bundles), 'active bundles payload missing') } },
  { id: 'admin-50', role: 'admin', title: 'Fraud API returns flags', run: async ({ pages }) => { const r = await api<{ flags: unknown[] }>(pages.admin, '/api/admin/fraud?status=OPEN'); assert(r.ok && r.body.flags.length > 0, 'fraud flags missing') } },
)

assert(allScenarios.filter((x) => x.role === 'user').length === 50, 'user scenarios mismatch')
assert(allScenarios.filter((x) => x.role === 'business').length === 50, 'business scenarios mismatch')
assert(allScenarios.filter((x) => x.role === 'admin').length === 50, 'admin scenarios mismatch')

async function writeResults(results: Array<{ id: string; role: string; title: string; status: string; error?: string }>) {
  const outDir = path.join(process.cwd(), 'test-results')
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'scenario-matrix-results.json'), JSON.stringify(results, null, 2))
  const lines = [
    '# Scenario Matrix Results',
    '',
    `- Base URL: ${BASE_URL}`,
    `- Total: ${results.length}`,
    `- Passed: ${results.filter((x) => x.status === 'passed').length}`,
    `- Failed: ${results.filter((x) => x.status === 'failed').length}`,
    '',
    ...results.map((x) => `- [${x.status.toUpperCase()}] ${x.id} ${x.title}${x.error ? ` :: ${x.error}` : ''}`),
  ]
  await fs.writeFile(path.join(outDir, 'scenario-matrix-results.md'), lines.join('\n'))
}

async function main() {
  const setup = await ensureScenarioData()
  await prewarmRoutes()
  const { browser, pages } = await openPages()
  const state: Record<string, string> = {}
  const ctx: Ctx = { pages, setup, state }
  const results: Array<{ id: string; role: string; title: string; status: string; error?: string }> = []

  try {
    for (const scenario of allScenarios) {
      const startedAt = Date.now()
      try {
        await scenario.run(ctx)
        console.log(`PASS ${scenario.id} ${scenario.title} (${Date.now() - startedAt}ms)`)
        results.push({ id: scenario.id, role: scenario.role, title: scenario.title, status: 'passed' })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`FAIL ${scenario.id} ${scenario.title}: ${message}`)
        results.push({ id: scenario.id, role: scenario.role, title: scenario.title, status: 'failed', error: message })
      }
      await sleep(100)
    }

    await writeResults(results)
    const failed = results.filter((x) => x.status === 'failed')
    console.log(`Scenario matrix complete: ${results.length - failed.length}/${results.length} passed`)
    if (failed.length > 0) process.exitCode = 1
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch(async (error) => {
  console.error('Scenario matrix runner failed:', error)
  await prisma.$disconnect()
  process.exit(1)
})
