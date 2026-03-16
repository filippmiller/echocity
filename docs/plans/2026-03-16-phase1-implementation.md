# Phase 1: City Deals Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform EchoCity into a deals platform with offer engine, QR redemption, subscriptions, demand MVP, and merchant tools.

**Architecture:** Domain modules within the existing Next.js 15 monolith. New Prisma models added to existing schema. Existing auth/places/reviews untouched. Each new domain gets its own `modules/<domain>/` folder with service, types, and validation.

**Tech Stack:** Next.js 15, React 19, Prisma + PostgreSQL, Tailwind CSS, ЮKassa (payments), Yandex Maps JS API v3, `qrcode` + `html5-qrcode` (QR), `node-cron` (background jobs), Zod (validation)

**Design Doc:** `docs/plans/2026-03-16-phase1-deals-platform-design.md`

---

## Task 1: Prisma Schema — Add All New Models

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** The existing schema has User, Business, Place, PlaceService, Review, City, Franchise, etc. We're adding ~15 new models for offers, subscriptions, redemptions, demand, merchant staff, billing, and fraud. We also need to add `MERCHANT_STAFF` to the Role enum and add reverse relations on existing models (User, Business, Place, City, ServiceCategory).

**Step 1: Add new enums to schema.prisma**

After the existing `PlaceCategory` enum, add all new enums:

```prisma
// === SUBSCRIPTION ENUMS ===
enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum PaymentType {
  SUBSCRIPTION
  RENEWAL
  ONE_TIME
  REFUND
}

// === OFFER ENUMS ===
enum OfferType {
  PERCENT_DISCOUNT
  FIXED_PRICE
  FREE_ITEM
  BUNDLE
  FIRST_VISIT
  OFF_PEAK
  FLASH
  REQUEST_ONLY
}

enum OfferVisibility {
  PUBLIC
  MEMBERS_ONLY
  FREE_FOR_ALL
}

enum BenefitType {
  PERCENT
  FIXED_AMOUNT
  FIXED_PRICE
  FREE_ITEM
  BUNDLE
}

enum OfferApprovalStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
}

enum OfferLifecycleStatus {
  INACTIVE
  SCHEDULED
  ACTIVE
  PAUSED
  EXPIRED
  ARCHIVED
}

enum OfferRuleType {
  FIRST_TIME_ONLY
  ONCE_PER_DAY
  ONCE_PER_WEEK
  ONCE_PER_MONTH
  ONCE_PER_LIFETIME
  MIN_CHECK
  GEO_RADIUS
  EXCLUDED_CATEGORIES
  ALLOWED_CATEGORIES
  MIN_PARTY_SIZE
}

// === REDEMPTION ENUMS ===
enum RedemptionSessionStatus {
  ACTIVE
  USED
  EXPIRED
  CANCELED
}

enum RedemptionStatus {
  SUCCESS
  REJECTED
  REVERSED
  FRAUD_SUSPECTED
}

enum RedemptionEventType {
  QR_GENERATED
  QR_REFRESHED
  SCAN_STARTED
  REDEEMED
  REVERSED
  LIMIT_FAILED
  RULE_FAILED
  GEO_FAILED
  FRAUD_FLAGGED
}

// === MERCHANT STAFF ENUMS ===
enum StaffRole {
  CASHIER
  MANAGER
}

// === BILLING ENUMS ===
enum BillingEventType {
  REDEMPTION_FEE
  CLICK_FEE
}

enum BillingEventStatus {
  PENDING
  INVOICED
  PAID
}

// === DEMAND ENUMS ===
enum DemandStatus {
  OPEN
  COLLECTING
  FULFILLED
  EXPIRED
}

// === FRAUD ENUMS ===
enum FraudSeverity {
  LOW
  MEDIUM
  HIGH
}

enum FraudFlagStatus {
  OPEN
  REVIEWED
  DISMISSED
}
```

**Step 2: Add MERCHANT_STAFF to the existing Role enum**

Change existing enum:
```prisma
enum Role {
  ADMIN
  CITIZEN
  BUSINESS_OWNER
  MERCHANT_STAFF
}
```

**Step 3: Add all new models**

After the existing `OAuthAccount` model, add all new models exactly as specified in the design doc (see `docs/plans/2026-03-16-phase1-deals-platform-design.md`, section "Data Model — New Prisma Models"). Copy all models verbatim:
- SubscriptionPlan
- UserSubscription
- Payment
- Offer
- OfferSchedule
- OfferBlackoutDate
- OfferRule
- OfferLimit
- RedemptionSession
- Redemption
- RedemptionEvent
- MerchantStaff
- MerchantBillingEvent
- DemandRequest
- DemandSupport
- FraudFlag

**Step 4: Add reverse relations on existing models**

On the `User` model, add these relation fields after existing ones:
```prisma
  subscriptions      UserSubscription[]
  payments           Payment[]
  redemptionSessions RedemptionSession[]
  redemptions        Redemption[]
  scannedRedemptions Redemption[]       @relation("RedemptionScanner")
  createdOffers      Offer[]            @relation("OfferCreator")
  merchantStaff      MerchantStaff[]
  demandRequests     DemandRequest[]
  demandSupports     DemandSupport[]
```

On the `Business` model, add:
```prisma
  offers        Offer[]
  redemptions   Redemption[]
  staff         MerchantStaff[]
  billingEvents MerchantBillingEvent[]
```

On the `Place` model, add:
```prisma
  offers                  Offer[]
  redemptionSessions      RedemptionSession[] @relation("RedemptionSessionBranch")
  branchRedemptions       Redemption[]        @relation("RedemptionBranch")
  merchantStaff           MerchantStaff[]
  demandRequests          DemandRequest[]
```

On the `City` model, add:
```prisma
  demandRequests DemandRequest[]
```

On the `ServiceCategory` model, add:
```prisma
  demandRequests DemandRequest[]
```

**Step 5: Generate migration and apply**

Run:
```bash
cd C:/dev/echocity && npx prisma migrate dev --name add_deals_platform_models
```
Expected: Migration created and applied successfully. Prisma client regenerated.

**Step 6: Verify schema compiles**

Run:
```bash
cd C:/dev/echocity && npx prisma generate
```
Expected: `✔ Generated Prisma Client`

**Step 7: Commit**

```bash
cd C:/dev/echocity && git add prisma/ && git commit -m "feat(schema): add deals platform models — offers, subscriptions, redemptions, demand, staff, billing, fraud"
```

---

## Task 2: Seed Data — Subscription Plans & Test Offers

**Files:**
- Modify: `prisma/seed.ts`

**Context:** We need subscription plans in the DB for the app to work. We also want demo offers for development. The seed file already exists at `prisma/seed.ts`.

**Step 1: Add subscription plan seed data**

Add to `prisma/seed.ts` a function that upserts 3 plans:

```typescript
async function seedSubscriptionPlans() {
  const plans = [
    {
      code: 'free',
      name: 'Бесплатный',
      monthlyPrice: 0,
      currency: 'RUB',
      features: { maxOffers: 5, visibility: ['FREE_FOR_ALL'] },
      trialDays: 0,
      sortOrder: 0,
    },
    {
      code: 'plus',
      name: 'Plus',
      monthlyPrice: 19900, // 199₽ in kopecks
      currency: 'RUB',
      features: { maxOffers: -1, visibility: ['FREE_FOR_ALL', 'MEMBERS_ONLY', 'PUBLIC'] },
      trialDays: 7,
      sortOrder: 1,
    },
    {
      code: 'premium',
      name: 'Premium',
      monthlyPrice: 49900, // 499₽ in kopecks
      currency: 'RUB',
      features: { maxOffers: -1, visibility: ['FREE_FOR_ALL', 'MEMBERS_ONLY', 'PUBLIC'], flash: true, priorityDemand: true },
      trialDays: 7,
      sortOrder: 2,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    })
  }
  console.log('Seeded subscription plans')
}
```

Call `seedSubscriptionPlans()` from the main seed function.

**Step 2: Run seed**

```bash
cd C:/dev/echocity && npx prisma db seed
```
Expected: "Seeded subscription plans"

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add prisma/seed.ts && git commit -m "feat(seed): add subscription plans seed data"
```

---

## Task 3: Domain Module — Offers Service

**Files:**
- Create: `modules/offers/types.ts`
- Create: `modules/offers/validation.ts`
- Create: `modules/offers/service.ts`

**Context:** This is the core offer engine. The service handles CRUD, lifecycle transitions, and the validation chain used during redemption.

**Step 1: Create offer types**

`modules/offers/types.ts` — export TypeScript types derived from Prisma enums + custom types for API responses:

```typescript
import type { Offer, OfferSchedule, OfferRule, OfferLimit, OfferBlackoutDate } from '@prisma/client'

export type OfferWithDetails = Offer & {
  schedules: OfferSchedule[]
  rules: OfferRule[]
  limits: OfferLimit | null
  blackoutDates: OfferBlackoutDate[]
  branch: { id: string; title: string; address: string; city: string; lat: number | null; lng: number | null }
  merchant: { id: string; name: string }
}

export type OfferCard = {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branchName: string
  branchAddress: string
  branchCity: string
  distance?: number
  isActive: boolean
  currentlyValid: boolean
}

export type CreateOfferInput = {
  merchantId: string
  branchId: string
  title: string
  subtitle?: string
  description?: string
  offerType: string
  visibility?: string
  benefitType: string
  benefitValue: number
  currency?: string
  minOrderAmount?: number
  maxDiscountAmount?: number
  startAt: string // ISO date
  endAt?: string
  termsText?: string
  imageUrl?: string
  schedules?: Array<{ weekday: number; startTime: string; endTime: string }>
  blackoutDates?: Array<{ date: string; reason?: string }>
  rules?: Array<{ ruleType: string; operator?: string; value: unknown }>
  limits?: {
    dailyLimit?: number
    weeklyLimit?: number
    monthlyLimit?: number
    totalLimit?: number
    perUserDailyLimit?: number
    perUserWeeklyLimit?: number
    perUserLifetimeLimit?: number
  }
}

export type OfferValidationResult = {
  valid: boolean
  errorCode?: string
  errorMessage?: string
}
```

**Step 2: Create offer validation schemas**

`modules/offers/validation.ts` — Zod schemas for offer creation/update:

```typescript
import { z } from 'zod'

export const createOfferSchema = z.object({
  merchantId: z.string().min(1),
  branchId: z.string().min(1),
  title: z.string().min(3).max(100),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  offerType: z.enum(['PERCENT_DISCOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE', 'FIRST_VISIT', 'OFF_PEAK', 'FLASH', 'REQUEST_ONLY']),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'FREE_FOR_ALL']).default('PUBLIC'),
  benefitType: z.enum(['PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE']),
  benefitValue: z.number().positive(),
  currency: z.string().default('RUB'),
  minOrderAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  termsText: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  schedules: z.array(z.object({
    weekday: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  blackoutDates: z.array(z.object({
    date: z.string().datetime(),
    reason: z.string().optional(),
  })).optional(),
  rules: z.array(z.object({
    ruleType: z.enum(['FIRST_TIME_ONLY', 'ONCE_PER_DAY', 'ONCE_PER_WEEK', 'ONCE_PER_MONTH', 'ONCE_PER_LIFETIME', 'MIN_CHECK', 'GEO_RADIUS', 'EXCLUDED_CATEGORIES', 'ALLOWED_CATEGORIES', 'MIN_PARTY_SIZE']),
    operator: z.string().optional(),
    value: z.unknown(),
  })).optional(),
  limits: z.object({
    dailyLimit: z.number().int().positive().optional(),
    weeklyLimit: z.number().int().positive().optional(),
    monthlyLimit: z.number().int().positive().optional(),
    totalLimit: z.number().int().positive().optional(),
    perUserDailyLimit: z.number().int().positive().optional(),
    perUserWeeklyLimit: z.number().int().positive().optional(),
    perUserLifetimeLimit: z.number().int().positive().optional(),
  }).optional(),
})

export const updateOfferSchema = createOfferSchema.partial().omit({ merchantId: true, branchId: true })

export const submitOfferSchema = z.object({ offerId: z.string().min(1) })
```

**Step 3: Create offer service**

`modules/offers/service.ts` — implements core business logic:

```typescript
import { prisma } from '@/lib/prisma'
import type { CreateOfferInput, OfferValidationResult, OfferWithDetails } from './types'

export async function createOffer(input: CreateOfferInput, createdByUserId: string) {
  const { schedules, blackoutDates, rules, limits, ...offerData } = input

  return prisma.offer.create({
    data: {
      ...offerData,
      benefitValue: offerData.benefitValue,
      minOrderAmount: offerData.minOrderAmount ?? null,
      maxDiscountAmount: offerData.maxDiscountAmount ?? null,
      startAt: new Date(offerData.startAt),
      endAt: offerData.endAt ? new Date(offerData.endAt) : null,
      approvalStatus: 'DRAFT',
      lifecycleStatus: 'INACTIVE',
      createdByUserId,
      schedules: schedules ? { create: schedules } : undefined,
      blackoutDates: blackoutDates
        ? { create: blackoutDates.map((d) => ({ date: new Date(d.date), reason: d.reason })) }
        : undefined,
      rules: rules ? { create: rules.map((r) => ({ ruleType: r.ruleType as any, operator: r.operator, value: r.value as any })) } : undefined,
      limits: limits ? { create: limits } : undefined,
    },
    include: { schedules: true, rules: true, limits: true, blackoutDates: true, branch: true, merchant: true },
  })
}

export async function submitForModeration(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { merchant: true } })
  if (!offer) throw new Error('Offer not found')
  if (offer.merchant.ownerId !== userId) throw new Error('Not authorized')
  if (offer.approvalStatus !== 'DRAFT' && offer.approvalStatus !== 'REJECTED') {
    throw new Error('Offer can only be submitted from DRAFT or REJECTED status')
  }

  return prisma.offer.update({
    where: { id: offerId },
    data: { approvalStatus: 'PENDING' },
  })
}

export async function approveOffer(offerId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } })
  if (!offer || offer.approvalStatus !== 'PENDING') throw new Error('Invalid offer state')

  const now = new Date()
  const isScheduledForFuture = offer.startAt > now

  return prisma.offer.update({
    where: { id: offerId },
    data: {
      approvalStatus: 'APPROVED',
      lifecycleStatus: isScheduledForFuture ? 'SCHEDULED' : 'ACTIVE',
    },
  })
}

export async function rejectOffer(offerId: string, reason: string) {
  return prisma.offer.update({
    where: { id: offerId },
    data: { approvalStatus: 'REJECTED', rejectionReason: reason },
  })
}

export async function pauseOffer(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { merchant: true } })
  if (!offer) throw new Error('Offer not found')
  if (offer.merchant.ownerId !== userId) throw new Error('Not authorized')
  if (offer.lifecycleStatus !== 'ACTIVE') throw new Error('Can only pause active offers')

  return prisma.offer.update({ where: { id: offerId }, data: { lifecycleStatus: 'PAUSED' } })
}

export async function resumeOffer(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { merchant: true } })
  if (!offer) throw new Error('Offer not found')
  if (offer.merchant.ownerId !== userId) throw new Error('Not authorized')
  if (offer.lifecycleStatus !== 'PAUSED') throw new Error('Can only resume paused offers')

  return prisma.offer.update({ where: { id: offerId }, data: { lifecycleStatus: 'ACTIVE' } })
}

export async function getOfferById(offerId: string): Promise<OfferWithDetails | null> {
  return prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      schedules: true,
      rules: true,
      limits: true,
      blackoutDates: true,
      branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
      merchant: { select: { id: true, name: true } },
    },
  }) as any
}

export async function getActiveOffersByCity(cityName: string, options?: { visibility?: string; limit?: number; offset?: number }) {
  return prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      branch: { city: cityName, isActive: true },
      ...(options?.visibility ? { visibility: options.visibility as any } : {}),
    },
    include: {
      schedules: true,
      limits: true,
      branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
      merchant: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  })
}

export async function getNearbyOffers(lat: number, lng: number, radiusKm: number, cityName: string) {
  // Haversine formula in raw SQL for distance sorting
  const offers = await prisma.$queryRaw<Array<any>>`
    SELECT o.*, p.title as "branchTitle", p.address as "branchAddress", p.lat as "branchLat", p.lng as "branchLng",
      (6371 * acos(cos(radians(${lat})) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.lat)))) AS distance
    FROM "Offer" o
    JOIN "Place" p ON o."branchId" = p.id
    WHERE o."lifecycleStatus" = 'ACTIVE'
      AND o."approvalStatus" = 'APPROVED'
      AND p."isActive" = true
      AND p.city = ${cityName}
      AND p.lat IS NOT NULL
      AND p.lng IS NOT NULL
      AND (6371 * acos(cos(radians(${lat})) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.lat)))) < ${radiusKm}
    ORDER BY distance ASC
    LIMIT 50
  `
  return offers
}

// Validation chain: checks if an offer can be redeemed right now by a given user
export async function validateOfferForRedemption(offerId: string, userId: string): Promise<OfferValidationResult> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { schedules: true, rules: true, limits: true, blackoutDates: true },
  })

  if (!offer) return { valid: false, errorCode: 'OFFER_NOT_FOUND', errorMessage: 'Предложение не найдено' }
  if (offer.lifecycleStatus !== 'ACTIVE') return { valid: false, errorCode: 'OFFER_NOT_ACTIVE', errorMessage: 'Предложение неактивно' }

  // Check subscription for members-only
  if (offer.visibility === 'MEMBERS_ONLY') {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    })
    if (!sub) return { valid: false, errorCode: 'SUBSCRIPTION_REQUIRED', errorMessage: 'Нужна подписка Plus или Premium' }
  }

  // Check schedule
  const now = new Date()
  const moscowOffset = 3 * 60 // UTC+3
  const moscowTime = new Date(now.getTime() + moscowOffset * 60000)
  const weekday = (moscowTime.getUTCDay() + 6) % 7 // 0=Monday

  if (offer.schedules.length > 0) {
    const currentTime = `${String(moscowTime.getUTCHours()).padStart(2, '0')}:${String(moscowTime.getUTCMinutes()).padStart(2, '0')}`
    const matchingSchedule = offer.schedules.find(
      (s) => s.weekday === weekday && !s.isBlackout && s.startTime <= currentTime && s.endTime > currentTime
    )
    if (!matchingSchedule) return { valid: false, errorCode: 'OUTSIDE_SCHEDULE', errorMessage: 'Предложение не действует в это время' }
  }

  // Check blackout dates
  const todayStr = moscowTime.toISOString().split('T')[0]
  const isBlackout = offer.blackoutDates.some((b) => b.date.toISOString().split('T')[0] === todayStr)
  if (isBlackout) return { valid: false, errorCode: 'BLACKOUT_DATE', errorMessage: 'Предложение не действует сегодня' }

  // Check limits
  if (offer.limits) {
    const startOfDay = new Date(todayStr + 'T00:00:00Z')
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(moscowTime.getUTCFullYear(), moscowTime.getUTCMonth(), 1)

    if (offer.limits.dailyLimit) {
      const dailyCount = await prisma.redemption.count({
        where: { offerId, status: 'SUCCESS', redeemedAt: { gte: startOfDay } },
      })
      if (dailyCount >= offer.limits.dailyLimit) return { valid: false, errorCode: 'DAILY_LIMIT', errorMessage: 'Лимит на сегодня исчерпан' }
    }

    if (offer.limits.totalLimit) {
      const totalCount = await prisma.redemption.count({
        where: { offerId, status: 'SUCCESS' },
      })
      if (totalCount >= offer.limits.totalLimit) return { valid: false, errorCode: 'TOTAL_LIMIT', errorMessage: 'Общий лимит исчерпан' }
    }

    if (offer.limits.perUserDailyLimit) {
      const userDailyCount = await prisma.redemption.count({
        where: { offerId, userId, status: 'SUCCESS', redeemedAt: { gte: startOfDay } },
      })
      if (userDailyCount >= offer.limits.perUserDailyLimit) return { valid: false, errorCode: 'USER_DAILY_LIMIT', errorMessage: 'Вы уже использовали это предложение сегодня' }
    }

    if (offer.limits.perUserLifetimeLimit) {
      const userTotalCount = await prisma.redemption.count({
        where: { offerId, userId, status: 'SUCCESS' },
      })
      if (userTotalCount >= offer.limits.perUserLifetimeLimit) return { valid: false, errorCode: 'USER_LIFETIME_LIMIT', errorMessage: 'Вы исчерпали лимит использования' }
    }

    // Weekly and monthly checks follow same pattern — implement for weeklyLimit, monthlyLimit, perUserWeeklyLimit
  }

  // Check rules
  for (const rule of offer.rules) {
    if (rule.ruleType === 'FIRST_TIME_ONLY') {
      const existing = await prisma.redemption.count({ where: { offerId, userId, status: 'SUCCESS' } })
      if (existing > 0) return { valid: false, errorCode: 'FIRST_TIME_ONLY', errorMessage: 'Только для первого визита' }
    }
    // Additional rule types (MIN_CHECK, GEO_RADIUS, etc.) — validated similarly
  }

  return { valid: true }
}

// Cron job: expire past-endAt offers
export async function expireOffers() {
  const now = new Date()
  const result = await prisma.offer.updateMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      endAt: { lte: now },
    },
    data: { lifecycleStatus: 'EXPIRED' },
  })
  return result.count
}

// Cron job: activate scheduled offers
export async function activateScheduledOffers() {
  const now = new Date()
  const result = await prisma.offer.updateMany({
    where: {
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'SCHEDULED',
      startAt: { lte: now },
    },
    data: { lifecycleStatus: 'ACTIVE' },
  })
  return result.count
}
```

**Step 4: Commit**

```bash
cd C:/dev/echocity && git add modules/offers/ && git commit -m "feat(offers): add offer service with CRUD, lifecycle, and validation chain"
```

---

## Task 4: Domain Module — Subscriptions Service

**Files:**
- Create: `modules/subscriptions/service.ts`
- Create: `modules/subscriptions/types.ts`

**Step 1: Create subscription types**

`modules/subscriptions/types.ts`:
```typescript
export type PlanInfo = {
  id: string
  code: string
  name: string
  monthlyPrice: number // kopecks
  features: Record<string, unknown>
  trialDays: number
}

export type UserSubscriptionStatus = {
  isSubscribed: boolean
  planCode: string | null
  status: string | null
  endAt: Date | null
}
```

**Step 2: Create subscription service**

`modules/subscriptions/service.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import type { UserSubscriptionStatus } from './types'

export async function getPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionStatus> {
  const sub = await prisma.userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!sub) return { isSubscribed: false, planCode: 'free', status: null, endAt: null }

  return {
    isSubscribed: true,
    planCode: sub.plan.code,
    status: sub.status,
    endAt: sub.endAt,
  }
}

export async function createSubscription(userId: string, planCode: string, externalSubscriptionId?: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } })
  if (!plan) throw new Error('Plan not found')
  if (plan.code === 'free') throw new Error('Cannot subscribe to free plan')

  const now = new Date()
  const endAt = new Date(now)
  endAt.setMonth(endAt.getMonth() + 1)

  const startAt = plan.trialDays > 0
    ? now
    : now

  const trialEndAt = plan.trialDays > 0
    ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
    : endAt

  return prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: plan.trialDays > 0 ? 'TRIALING' : 'ACTIVE',
      startAt: now,
      endAt: plan.trialDays > 0 ? trialEndAt : endAt,
      autoRenew: true,
      externalSubscriptionId,
    },
  })
}

export async function cancelSubscription(userId: string) {
  const sub = await prisma.userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) throw new Error('No active subscription')

  return prisma.userSubscription.update({
    where: { id: sub.id },
    data: { autoRenew: false, canceledAt: new Date() },
  })
}

// Cron job: expire past-grace subscriptions
export async function expireSubscriptions() {
  const now = new Date()
  const result = await prisma.userSubscription.updateMany({
    where: {
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      endAt: { lte: now },
      autoRenew: false,
    },
    data: { status: 'EXPIRED' },
  })
  return result.count
}
```

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add modules/subscriptions/ && git commit -m "feat(subscriptions): add subscription service with plans, create, cancel, expire"
```

---

## Task 5: Domain Module — Redemptions Service (QR + Validation)

**Files:**
- Create: `modules/redemptions/service.ts`
- Create: `modules/redemptions/tokens.ts`

**Step 1: Create token generation utility**

`modules/redemptions/tokens.ts`:
```typescript
import crypto from 'crypto'

const HMAC_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-me'

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

export function generateShortCode(): string {
  // 6 chars, no ambiguous: exclude 0,O,1,I,L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)]
  }
  return code
}

export function signToken(token: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(token).digest('hex')
}

export function verifyTokenSignature(token: string, signature: string): boolean {
  const expected = signToken(token)
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
```

**Step 2: Create redemption service**

`modules/redemptions/service.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { generateSessionToken, generateShortCode } from './tokens'
import { validateOfferForRedemption } from '@/modules/offers/service'

const SESSION_TTL_MS = 60 * 1000 // 60 seconds

export async function createRedemptionSession(userId: string, offerId: string, userLat?: number, userLng?: number) {
  // Validate the offer first
  const validation = await validateOfferForRedemption(offerId, userId)
  if (!validation.valid) {
    // Log the failed attempt
    await prisma.redemptionEvent.create({
      data: {
        eventType: validation.errorCode === 'SUBSCRIPTION_REQUIRED' ? 'RULE_FAILED' : 'LIMIT_FAILED',
        actorType: 'USER',
        actorId: userId,
        metadata: { offerId, errorCode: validation.errorCode },
      },
    })
    return { success: false, error: validation.errorCode, message: validation.errorMessage }
  }

  const offer = await prisma.offer.findUnique({ where: { id: offerId } })
  if (!offer) return { success: false, error: 'OFFER_NOT_FOUND', message: 'Предложение не найдено' }

  // Cancel any existing active sessions for this user+offer
  await prisma.redemptionSession.updateMany({
    where: { userId, offerId, status: 'ACTIVE' },
    data: { status: 'CANCELED' },
  })

  const sessionToken = generateSessionToken()
  const shortCode = generateShortCode()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const session = await prisma.redemptionSession.create({
    data: {
      userId,
      offerId,
      branchId: offer.branchId,
      sessionToken,
      shortCode,
      status: 'ACTIVE',
      expiresAt,
      userLat: userLat ?? null,
      userLng: userLng ?? null,
    },
  })

  await prisma.redemptionEvent.create({
    data: {
      sessionId: session.id,
      eventType: 'QR_GENERATED',
      actorType: 'USER',
      actorId: userId,
    },
  })

  return { success: true, session: { id: session.id, sessionToken, shortCode, expiresAt } }
}

export async function validateAndRedeem(input: { sessionToken?: string; shortCode?: string; scannedByUserId?: string }) {
  const { sessionToken, shortCode, scannedByUserId } = input

  // Find session by token or code
  const session = await prisma.redemptionSession.findFirst({
    where: sessionToken
      ? { sessionToken, status: 'ACTIVE' }
      : { shortCode, status: 'ACTIVE' },
    include: { offer: { include: { merchant: true } } },
  })

  if (!session) {
    return { success: false, error: 'SESSION_NOT_FOUND', message: 'Сессия не найдена или истекла' }
  }

  if (session.expiresAt < new Date()) {
    await prisma.redemptionSession.update({ where: { id: session.id }, data: { status: 'EXPIRED' } })
    return { success: false, error: 'SESSION_EXPIRED', message: 'QR-код истёк. Попросите клиента обновить' }
  }

  // Re-validate the offer (limits might have changed)
  const validation = await validateOfferForRedemption(session.offerId, session.userId)
  if (!validation.valid) {
    await prisma.redemptionEvent.create({
      data: {
        sessionId: session.id,
        eventType: validation.errorCode?.includes('LIMIT') ? 'LIMIT_FAILED' : 'RULE_FAILED',
        actorType: 'STAFF',
        actorId: scannedByUserId,
        metadata: { errorCode: validation.errorCode },
      },
    })
    return { success: false, error: validation.errorCode, message: validation.errorMessage }
  }

  // Create redemption + mark session used in transaction
  const redemption = await prisma.$transaction(async (tx) => {
    await tx.redemptionSession.update({ where: { id: session.id }, data: { status: 'USED' } })

    const r = await tx.redemption.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        offerId: session.offerId,
        merchantId: session.offer.merchantId,
        branchId: session.offer.branchId,
        scannedByUserId: scannedByUserId ?? null,
        status: 'SUCCESS',
      },
    })

    await tx.redemptionEvent.create({
      data: {
        sessionId: session.id,
        redemptionId: r.id,
        eventType: 'REDEEMED',
        actorType: scannedByUserId ? 'STAFF' : 'SYSTEM',
        actorId: scannedByUserId,
      },
    })

    // If FREE_FOR_ALL, create billing event
    if (session.offer.visibility === 'FREE_FOR_ALL') {
      await tx.merchantBillingEvent.create({
        data: {
          merchantId: session.offer.merchantId,
          offerId: session.offerId,
          redemptionId: r.id,
          eventType: 'REDEMPTION_FEE',
          amount: 5000, // 50₽ in kopecks — configurable later
          currency: 'RUB',
          status: 'PENDING',
        },
      })
    }

    return r
  })

  return {
    success: true,
    redemption: {
      id: redemption.id,
      offerTitle: session.offer.title,
      benefitType: session.offer.benefitType,
      benefitValue: Number(session.offer.benefitValue),
      branchId: session.offer.branchId,
    },
  }
}

// Cron: expire stale sessions
export async function expireSessions() {
  const result = await prisma.redemptionSession.updateMany({
    where: { status: 'ACTIVE', expiresAt: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  })
  return result.count
}
```

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add modules/redemptions/ && git commit -m "feat(redemptions): add QR session creation, validation, redemption flow"
```

---

## Task 6: Domain Module — Demand Service (MVP)

**Files:**
- Create: `modules/demand/service.ts`

**Step 1: Create demand service**

`modules/demand/service.ts`:
```typescript
import { prisma } from '@/lib/prisma'

export async function createDemandRequest(userId: string, input: { placeId?: string; placeName?: string; categoryId?: string; cityId: string; lat?: number; lng?: number }) {
  // Check if user already has a request for this place
  if (input.placeId) {
    const existing = await prisma.demandRequest.findFirst({
      where: { placeId: input.placeId, status: { in: ['OPEN', 'COLLECTING'] } },
    })
    if (existing) {
      // Auto-support instead of creating duplicate
      return supportDemandRequest(existing.id, userId)
    }
  }

  return prisma.demandRequest.create({
    data: {
      userId,
      placeId: input.placeId ?? null,
      placeName: input.placeName ?? null,
      categoryId: input.categoryId ?? null,
      cityId: input.cityId,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      status: 'OPEN',
      supportCount: 1,
    },
  })
}

export async function supportDemandRequest(demandRequestId: string, userId: string) {
  // Check already supported
  const existing = await prisma.demandSupport.findUnique({
    where: { demandRequestId_userId: { demandRequestId, userId } },
  })
  if (existing) return { alreadySupported: true }

  await prisma.$transaction([
    prisma.demandSupport.create({ data: { demandRequestId, userId } }),
    prisma.demandRequest.update({
      where: { id: demandRequestId },
      data: { supportCount: { increment: 1 } },
    }),
  ])

  return { alreadySupported: false }
}

export async function getDemandForPlace(placeId: string) {
  return prisma.demandRequest.findMany({
    where: { placeId, status: { in: ['OPEN', 'COLLECTING'] } },
    orderBy: { supportCount: 'desc' },
    take: 10,
    include: { _count: { select: { supports: true } } },
  })
}

export async function getDemandByCity(cityId: string, limit = 20) {
  return prisma.demandRequest.findMany({
    where: { cityId, status: { in: ['OPEN', 'COLLECTING'] } },
    orderBy: { supportCount: 'desc' },
    take: limit,
    include: {
      place: { select: { id: true, title: true, address: true } },
      _count: { select: { supports: true } },
    },
  })
}
```

**Step 2: Commit**

```bash
cd C:/dev/echocity && git add modules/demand/ && git commit -m "feat(demand): add MVP demand service — create, support, query"
```

---

## Task 7: Cron Jobs Setup

**Files:**
- Create: `lib/cron.ts`
- Modify: `app/layout.tsx` or create `lib/init-server.ts`

**Step 1: Install node-cron**

```bash
cd C:/dev/echocity && npm install node-cron && npm install -D @types/node-cron
```

**Step 2: Create cron setup**

`lib/cron.ts`:
```typescript
import cron from 'node-cron'
import { expireOffers, activateScheduledOffers } from '@/modules/offers/service'
import { expireSessions } from '@/modules/redemptions/service'
import { expireSubscriptions } from '@/modules/subscriptions/service'
import { logger } from '@/lib/logger'

let initialized = false

export function initCronJobs() {
  if (initialized || process.env.NODE_ENV === 'test') return
  initialized = true

  // Every minute: expire redemption sessions
  cron.schedule('* * * * *', async () => {
    try {
      const count = await expireSessions()
      if (count > 0) logger.info(`Expired ${count} redemption sessions`)
    } catch (e) { logger.error('Cron expireSessions failed', e) }
  })

  // Every 5 minutes: activate scheduled offers
  cron.schedule('*/5 * * * *', async () => {
    try {
      const count = await activateScheduledOffers()
      if (count > 0) logger.info(`Activated ${count} scheduled offers`)
    } catch (e) { logger.error('Cron activateScheduledOffers failed', e) }
  })

  // Every hour: expire past-endAt offers
  cron.schedule('0 * * * *', async () => {
    try {
      const count = await expireOffers()
      if (count > 0) logger.info(`Expired ${count} offers`)
    } catch (e) { logger.error('Cron expireOffers failed', e) }
  })

  // Daily at 3am: expire subscriptions
  cron.schedule('0 3 * * *', async () => {
    try {
      const count = await expireSubscriptions()
      if (count > 0) logger.info(`Expired ${count} subscriptions`)
    } catch (e) { logger.error('Cron expireSubscriptions failed', e) }
  })

  logger.info('Cron jobs initialized')
}
```

**Step 3: Initialize cron in instrumentation hook**

Create `instrumentation.ts` in project root (Next.js instrumentation hook):
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCronJobs } = await import('@/lib/cron')
    initCronJobs()
  }
}
```

Add to `next.config.js` (if not already enabled):
```javascript
experimental: {
  instrumentationHook: true,
}
```

**Step 4: Commit**

```bash
cd C:/dev/echocity && git add lib/cron.ts instrumentation.ts next.config.* package.json package-lock.json && git commit -m "feat(cron): add background jobs for offer/session/subscription expiry"
```

---

## Task 8: API Routes — Offers (Public + Business)

**Files:**
- Create: `app/api/offers/route.ts` (GET — list active offers)
- Create: `app/api/offers/[id]/route.ts` (GET — offer detail)
- Create: `app/api/offers/nearby/route.ts` (GET — nearby offers)
- Create: `app/api/business/offers/route.ts` (GET list, POST create)
- Create: `app/api/business/offers/[id]/route.ts` (PATCH update, DELETE)
- Create: `app/api/business/offers/[id]/submit/route.ts` (POST — submit for moderation)
- Create: `app/api/business/offers/[id]/pause/route.ts` (POST)
- Create: `app/api/business/offers/[id]/resume/route.ts` (POST)

**Context:** Public offer routes need no auth. Business offer routes check session for BUSINESS_OWNER role. Use existing `modules/auth/session.ts` for session reading and `lib/admin-guard.ts` pattern for authorization.

**Step 1: Create public offers list endpoint**

`app/api/offers/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getActiveOffersByCity } from '@/modules/offers/service'

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const visibility = req.nextUrl.searchParams.get('visibility') || undefined
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  const offers = await getActiveOffersByCity(city, { visibility, limit, offset })
  return NextResponse.json({ offers })
}
```

**Step 2: Create offer detail endpoint**

`app/api/offers/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getOfferById } from '@/modules/offers/service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = await getOfferById(id)
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ offer })
}
```

**Step 3: Create nearby offers endpoint**

`app/api/offers/nearby/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getNearbyOffers } from '@/modules/offers/service'

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '0')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') || '0')
  const radius = parseFloat(req.nextUrl.searchParams.get('radius') || '5')
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'

  if (!lat || !lng) return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })

  const offers = await getNearbyOffers(lat, lng, radius, city)
  return NextResponse.json({ offers })
}
```

**Step 4: Create business offer CRUD endpoints**

`app/api/business/offers/route.ts` — GET (my offers) + POST (create offer). Check session, verify BUSINESS_OWNER role, use offer service.

`app/api/business/offers/[id]/route.ts` — PATCH (update) + DELETE.

`app/api/business/offers/[id]/submit/route.ts` — POST, calls `submitForModeration()`.

`app/api/business/offers/[id]/pause/route.ts` — POST, calls `pauseOffer()`.

`app/api/business/offers/[id]/resume/route.ts` — POST, calls `resumeOffer()`.

All business routes follow the existing pattern in `app/api/business/` — read session from cookies, verify role, call service, return JSON.

**Step 5: Commit**

```bash
cd C:/dev/echocity && git add app/api/offers/ app/api/business/offers/ && git commit -m "feat(api): add offer API routes — public list/detail/nearby + business CRUD/lifecycle"
```

---

## Task 9: API Routes — Subscriptions

**Files:**
- Create: `app/api/subscriptions/plans/route.ts` (GET)
- Create: `app/api/subscriptions/status/route.ts` (GET)
- Create: `app/api/subscriptions/subscribe/route.ts` (POST)
- Create: `app/api/subscriptions/cancel/route.ts` (POST)

**Step 1: Implement all 4 endpoints**

Plans (public): returns active plans.
Status (auth): returns user's current subscription status.
Subscribe (auth): creates subscription (Phase 1 uses stub — marks as TRIALING directly, real ЮKassa in Task 14).
Cancel (auth): sets autoRenew=false.

**Step 2: Commit**

```bash
cd C:/dev/echocity && git add app/api/subscriptions/ && git commit -m "feat(api): add subscription API routes — plans, status, subscribe, cancel"
```

---

## Task 10: API Routes — Redemptions (QR Flow)

**Files:**
- Create: `app/api/redemptions/create-session/route.ts` (POST)
- Create: `app/api/redemptions/validate/route.ts` (POST)
- Create: `app/api/redemptions/history/route.ts` (GET)

**Step 1: Create session endpoint** — auth required, calls `createRedemptionSession()`.

**Step 2: Validate endpoint** — auth required (BUSINESS_OWNER or MERCHANT_STAFF), accepts `sessionToken` or `shortCode`, calls `validateAndRedeem()`.

**Step 3: History endpoint** — auth required, returns user's past redemptions with offer details.

**Step 4: Commit**

```bash
cd C:/dev/echocity && git add app/api/redemptions/ && git commit -m "feat(api): add redemption API routes — create QR session, validate/redeem, history"
```

---

## Task 11: API Routes — Demand MVP

**Files:**
- Create: `app/api/demand/create/route.ts` (POST)
- Create: `app/api/demand/support/route.ts` (POST)
- Create: `app/api/demand/[placeId]/route.ts` (GET)

**Step 1:** Implement create (auth required), support (auth required), and get-by-place (public).

**Step 2: Commit**

```bash
cd C:/dev/echocity && git add app/api/demand/ && git commit -m "feat(api): add demand MVP API routes — create, support, get by place"
```

---

## Task 12: API Routes — Admin Moderation

**Files:**
- Create: `app/api/admin/offers/route.ts` (GET pending offers)
- Create: `app/api/admin/offers/[id]/approve/route.ts` (POST)
- Create: `app/api/admin/offers/[id]/reject/route.ts` (POST)
- Create: `app/api/admin/fraud/route.ts` (GET fraud flags)

**Step 1:** All admin routes use existing `lib/admin-guard.ts` pattern. Implement moderation queue + approve/reject + fraud list.

**Step 2: Commit**

```bash
cd C:/dev/echocity && git add app/api/admin/offers/ app/api/admin/fraud/ && git commit -m "feat(api): add admin moderation API — offer queue, approve/reject, fraud flags"
```

---

## Task 13: Frontend — Offer Discovery Pages

**Files:**
- Create: `app/offers/page.tsx` (offers feed/list)
- Create: `app/offers/[id]/page.tsx` (offer detail)
- Create: `app/offers/[id]/redeem/page.tsx` (QR screen)
- Create: `components/OfferCard.tsx`
- Create: `components/OfferFeed.tsx`
- Create: `components/QRRedeemScreen.tsx`
- Modify: `app/page.tsx` (add deals CTA to landing)
- Modify: `app/places/[id]/page.tsx` (add offers section + demand button)
- Modify: `components/Navbar.tsx` (add offers nav link)

**Context:** Mobile-first design using existing Tailwind setup. Use existing auth hooks for subscription-gated features. QR generation uses `qrcode` npm package (install: `npm install qrcode @types/qrcode`).

**Step 1: Install QR package**

```bash
cd C:/dev/echocity && npm install qrcode && npm install -D @types/qrcode
```

**Step 2: Create OfferCard component**

A reusable card showing: image, title, benefit badge (-20%), branch name/address, distance, visibility badge (free/member), time validity indicator.

**Step 3: Create offers feed page**

`app/offers/page.tsx` — sections: "Рядом сейчас", "Бесплатные", "Для подписчиков", "Flash". Fetches from `/api/offers`. City selector at top.

**Step 4: Create offer detail page**

`app/offers/[id]/page.tsx` — full offer info, conditions, schedule, limits remaining, "Активировать" CTA. If MEMBERS_ONLY and user not subscribed, show paywall.

**Step 5: Create QR redeem screen**

`app/offers/[id]/redeem/page.tsx` — generates QR from sessionToken using `qrcode` package, shows shortCode below, 60s countdown, auto-refresh every 30s by calling create-session again.

**Step 6: Add offers section to place detail page**

Modify `app/places/[id]/page.tsx` — after services section, add "Предложения" section listing active offers for this place. Add "Хочу скидку" button if no offers, showing demand count.

**Step 7: Update navbar**

Add "Скидки" link to Navbar for all users.

**Step 8: Commit**

```bash
cd C:/dev/echocity && git add app/offers/ components/OfferCard.tsx components/OfferFeed.tsx components/QRRedeemScreen.tsx app/places/ components/Navbar.tsx app/page.tsx package.json package-lock.json && git commit -m "feat(ui): add offer discovery pages — feed, detail, QR redeem, place integration"
```

---

## Task 14: Frontend — Subscription & Paywall

**Files:**
- Create: `app/subscription/page.tsx` (plans + subscribe)
- Create: `components/Paywall.tsx`
- Create: `components/SubscriptionBadge.tsx`

**Step 1: Create subscription page**

`app/subscription/page.tsx` — shows 3 plans in cards, current status, subscribe/cancel buttons. For Phase 1, subscribe creates a TRIALING subscription directly (stub payment). Real ЮKassa integration in Task 18.

**Step 2: Create paywall component**

`components/Paywall.tsx` — shown when user tries to use MEMBERS_ONLY offer without subscription. Shows plan comparison + CTA to subscribe.

**Step 3: Create subscription badge**

`components/SubscriptionBadge.tsx` — small badge in navbar/profile showing plan status (Free/Plus/Premium).

**Step 4: Commit**

```bash
cd C:/dev/echocity && git add app/subscription/ components/Paywall.tsx components/SubscriptionBadge.tsx && git commit -m "feat(ui): add subscription page, paywall, and plan badges"
```

---

## Task 15: Frontend — Merchant Offer Management

**Files:**
- Create: `app/business/offers/create/page.tsx` (offer creation wizard)
- Create: `app/business/offers/[id]/page.tsx` (offer detail/edit)
- Modify: `app/business/offers/page.tsx` (list with status badges)
- Create: `components/OfferWizard.tsx`

**Step 1: Create offer wizard component**

`components/OfferWizard.tsx` — multi-step form: type → benefit → schedule → limits → rules → photo → preview → submit. Uses React state for steps, Zod validation from `modules/offers/validation.ts`.

**Step 2: Create offer creation page**

`app/business/offers/create/page.tsx` — wraps OfferWizard, POSTs to `/api/business/offers`.

**Step 3: Enhance offers list page**

Modify existing `app/business/offers/page.tsx` — show table of merchant's offers with status badges (DRAFT/PENDING/ACTIVE/PAUSED/EXPIRED/REJECTED), action buttons (edit/pause/resume/submit).

**Step 4: Create offer detail/edit page**

`app/business/offers/[id]/page.tsx` — view offer details, edit if DRAFT, see rejection reason if REJECTED.

**Step 5: Commit**

```bash
cd C:/dev/echocity && git add app/business/offers/ components/OfferWizard.tsx && git commit -m "feat(ui): add merchant offer management — wizard, list, detail/edit"
```

---

## Task 16: Frontend — Merchant QR Scanner

**Files:**
- Create: `app/business/scanner/page.tsx`
- Create: `components/QRScanner.tsx`

**Context:** Install `html5-qrcode`: `npm install html5-qrcode`

**Step 1: Install scanner package**

```bash
cd C:/dev/echocity && npm install html5-qrcode
```

**Step 2: Create QR scanner component**

`components/QRScanner.tsx` — wraps `html5-qrcode` library. Two tabs: "Сканировать QR" (camera) and "Ввести код" (text input). On successful scan/input, calls `/api/redemptions/validate`. Shows success (green check + offer details) or failure (red X + error message).

**Step 3: Create scanner page**

`app/business/scanner/page.tsx` — auth guard for BUSINESS_OWNER/MERCHANT_STAFF. Shows QRScanner + today's redemptions list below.

**Step 4: Commit**

```bash
cd C:/dev/echocity && git add app/business/scanner/ components/QRScanner.tsx package.json package-lock.json && git commit -m "feat(ui): add merchant QR scanner page with camera + code entry"
```

---

## Task 17: Frontend — Admin Offer Moderation

**Files:**
- Modify: `app/admin/page.tsx` (add moderation tab)
- Create: `app/admin/offers/page.tsx` (moderation queue)

**Step 1: Create moderation queue page**

`app/admin/offers/page.tsx` — list of PENDING offers with details, approve/reject buttons. Reject shows reason input modal.

**Step 2: Add tab to admin dashboard**

Modify `app/admin/page.tsx` — add "Модерация" tab linking to moderation queue.

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add app/admin/ && git commit -m "feat(ui): add admin offer moderation queue with approve/reject"
```

---

## Task 18: ЮKassa Payment Integration

**Files:**
- Create: `modules/payments/yokassa.ts`
- Create: `app/api/payments/yokassa/webhook/route.ts`
- Modify: `app/api/subscriptions/subscribe/route.ts`

**Context:** ЮKassa (yookassa.ru) recurring payments. Install SDK: `npm install @yookassa/sdk`. Use test mode for development.

**Step 1: Install ЮKassa SDK**

```bash
cd C:/dev/echocity && npm install @yookassa/sdk
```

**Step 2: Create ЮKassa integration module**

`modules/payments/yokassa.ts`:
- `createPayment(amount, currency, description, returnUrl, metadata)` — creates a ЮKassa payment
- `createRecurringPayment(savedPaymentMethodId, amount, description)` — charges saved card
- `handleWebhook(body)` — processes payment.succeeded / payment.canceled webhooks

**Step 3: Create webhook endpoint**

`app/api/payments/yokassa/webhook/route.ts` — receives ЮKassa webhook, verifies signature, processes payment status, updates UserSubscription and Payment records.

**Step 4: Update subscribe endpoint**

Modify `app/api/subscriptions/subscribe/route.ts` — instead of creating subscription directly, redirect to ЮKassa checkout. Subscription is created in webhook after successful payment.

**Step 5: Add env vars**

Add to `.env`:
```
YOKASSA_SHOP_ID=your_shop_id
YOKASSA_SECRET_KEY=your_secret_key
```

**Step 6: Commit**

```bash
cd C:/dev/echocity && git add modules/payments/ app/api/payments/ app/api/subscriptions/ package.json package-lock.json && git commit -m "feat(payments): integrate ЮKassa for subscription payments with webhooks"
```

---

## Task 19: Fraud Detection — Basic Auto-Flags

**Files:**
- Create: `modules/moderation/fraud.ts`

**Step 1: Create fraud detection service**

`modules/moderation/fraud.ts`:
- `checkRedemptionFraud(redemption)` — called after each successful redemption
  - Flag if same user+offer >3x in 24h
  - Flag if user location >2km from branch
  - Flag if staff redeeming own merchant's offers
- `checkRateLimitFraud(userId)` — called on failed redemption attempts
  - Flag if >10 failures per hour

**Step 2: Integrate into redemption flow**

Add a call to `checkRedemptionFraud()` at the end of `validateAndRedeem()` in `modules/redemptions/service.ts`. Non-blocking — runs after redemption is confirmed.

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add modules/moderation/ modules/redemptions/service.ts && git commit -m "feat(fraud): add basic auto-fraud detection on redemptions"
```

---

## Task 20: Yandex Maps Integration — Offer Pins

**Files:**
- Modify: `app/map/page.tsx`
- Modify: `components/YandexMap.tsx`

**Context:** Yandex Maps API key: `6bcc5d98-b76f-4b10-965c-28ded0f0a4c0` (from domcom project). Add to `.env` as `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`.

**Step 1: Add API key to env**

Add to `.env`:
```
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=6bcc5d98-b76f-4b10-965c-28ded0f0a4c0
```

**Step 2: Enhance YandexMap component**

Modify `components/YandexMap.tsx` — accept `offers` prop with lat/lng/title/benefit data. Render offer pins on map with custom placemark icons showing discount badge. On pin click, show balloon with offer card + "Подробнее" link.

**Step 3: Enhance map page**

Modify `app/map/page.tsx` — fetch nearby offers, pass to YandexMap. Add category filter pills above map.

**Step 4: Commit**

```bash
cd C:/dev/echocity && git add app/map/ components/YandexMap.tsx .env.example && git commit -m "feat(map): add offer pins to Yandex Maps with discount badges"
```

---

## Task 21: Merchant Staff Management

**Files:**
- Create: `app/api/business/staff/route.ts` (GET list, POST invite)
- Create: `app/api/business/staff/[id]/route.ts` (DELETE remove)
- Create: `app/business/staff/page.tsx`

**Step 1: Create staff API routes**

GET: list staff for merchant. POST: invite by email (creates user with MERCHANT_STAFF role if not exists, creates MerchantStaff record). DELETE: deactivate staff member.

**Step 2: Create staff management page**

`app/business/staff/page.tsx` — list of staff with roles, invite form, remove button.

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add app/api/business/staff/ app/business/staff/ && git commit -m "feat(staff): add merchant staff management — invite, list, remove"
```

---

## Task 22: Merchant Dashboard — Analytics & Redemptions

**Files:**
- Modify: `app/business/dashboard/page.tsx`
- Create: `app/business/redemptions/page.tsx`

**Step 1: Enhance business dashboard**

Add cards showing: active offers count, today's redemptions, this week unique users, total revenue estimate. Add quick links to scanner, offers, staff.

**Step 2: Create redemptions page**

`app/business/redemptions/page.tsx` — table of redemptions with date, offer, user (anonymized), status. Filterable by offer and date range.

**Step 3: Commit**

```bash
cd C:/dev/echocity && git add app/business/dashboard/ app/business/redemptions/ && git commit -m "feat(ui): enhance merchant dashboard with analytics + redemptions log"
```

---

## Task 23: Home Page Redesign

**Files:**
- Modify: `app/page.tsx`

**Step 1: Redesign landing page**

Transform the minimal landing into a deals-focused home:
1. Hero: "Скидки в лучших местах вашего города" + city selector
2. Category pills: Кофе, Еда, Бары, Красота, Услуги
3. Featured offers grid (fetch from `/api/offers?limit=6`)
4. "Для бизнеса" CTA section
5. "Подписка" CTA section
6. Existing login/register buttons

**Step 2: Commit**

```bash
cd C:/dev/echocity && git add app/page.tsx && git commit -m "feat(ui): redesign home page with deals-focused layout"
```

---

## Task 24: Navigation & Layout Updates

**Files:**
- Modify: `components/Navbar.tsx`
- Modify: `app/layout.tsx`

**Step 1: Update navigation**

Add bottom tab bar for mobile (Главная | Карта | Скидки | Избранное | Профиль). Update desktop navbar with Скидки link. Show subscription badge. Role-based nav items.

**Step 2: Commit**

```bash
cd C:/dev/echocity && git add components/Navbar.tsx app/layout.tsx && git commit -m "feat(ui): add mobile bottom tabs + subscription badge to navigation"
```

---

## Task 25: End-to-End Smoke Test

**Files:**
- Create: `docs/plans/2026-03-16-phase1-smoke-test.md`

**Step 1: Manual smoke test checklist**

Test the full flow manually:

1. Register as CITIZEN → log in
2. Browse offers feed → see active offers
3. Open offer detail → see conditions
4. Try to activate MEMBERS_ONLY offer → see paywall
5. Subscribe to Plus (trial) → verify subscription status
6. Activate offer → see QR + short code
7. Open merchant scanner (different browser/incognito as BUSINESS_OWNER) → scan QR
8. Verify redemption recorded → check merchant dashboard
9. Create "Хочу скидку" on place without offers → verify counter
10. Admin: approve pending offer → verify it becomes ACTIVE
11. Check map → offer pins visible
12. Verify cron: wait for session expiry

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
cd C:/dev/echocity && git add -A && git commit -m "feat(phase1): complete Phase 1 — deals platform with offers, QR, subscriptions, demand MVP"
```

---

## Summary of All Tasks

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Prisma Schema — all new models | None |
| 2 | Seed Data — subscription plans | Task 1 |
| 3 | Offers Service | Task 1 |
| 4 | Subscriptions Service | Task 1 |
| 5 | Redemptions Service | Tasks 3, 4 |
| 6 | Demand Service (MVP) | Task 1 |
| 7 | Cron Jobs | Tasks 3, 4, 5 |
| 8 | API Routes — Offers | Task 3 |
| 9 | API Routes — Subscriptions | Task 4 |
| 10 | API Routes — Redemptions | Task 5 |
| 11 | API Routes — Demand | Task 6 |
| 12 | API Routes — Admin Moderation | Task 3 |
| 13 | Frontend — Offer Discovery | Tasks 8, 10 |
| 14 | Frontend — Subscription & Paywall | Task 9 |
| 15 | Frontend — Merchant Offer Mgmt | Task 8 |
| 16 | Frontend — Merchant QR Scanner | Task 10 |
| 17 | Frontend — Admin Moderation | Task 12 |
| 18 | ЮKassa Payment Integration | Task 9 |
| 19 | Fraud Detection | Task 5 |
| 20 | Yandex Maps — Offer Pins | Task 8 |
| 21 | Merchant Staff Management | Task 1 |
| 22 | Merchant Dashboard Analytics | Tasks 8, 10 |
| 23 | Home Page Redesign | Task 8 |
| 24 | Navigation Updates | Task 14 |
| 25 | End-to-End Smoke Test | All |
