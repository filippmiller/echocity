# Phase 1 Design: City Deals Platform (EchoCity Evolution)

**Date:** 2026-03-16
**Status:** Approved
**Author:** Claude + Filip Miller

## Vision

Evolve EchoCity from a city search/discovery app into a full deals platform where:
- Users find and redeem discount offers at local businesses
- Users can subscribe for premium deals or use free deals
- Businesses publish offers, manage redemptions, see analytics
- Users can request discounts where none exist ("Хочу скидку")
- Platform earns from user subscriptions + per-redemption merchant fees

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| First city | Санкт-Петербург | Already default in DB, expand later |
| Map provider | Yandex Maps JS API v3 | Russian market, existing key |
| Payment provider | ЮKassa | Best for RUB recurring subscriptions |
| QR on merchant side | Camera scan + short code fallback | Works on any phone, no special hardware |
| Pricing model | Free + Plus (199₽) + Premium (499₽) | Low barrier + revenue from both sides |
| Free deals | Business pays per redemption | Grows user base without subscription gate |
| Offer engine depth | Full (all types, schedules, limits, rules) | Ship complete from day one |
| Demand engine | MVP only (button + counter, no merchant inbox) | Plant seed, collect data |
| Architecture | Domain modules in single Next.js app | Clean boundaries, no deployment overhead |

## Architecture

### Domain Module Structure

```
modules/
  auth/           — session, login, register (existing)
  users/          — profile, favorites, subscription status
  merchants/      — business registration, staff, dashboard
  places/         — discovery, search, place details (existing)
  offers/         — offer CRUD, lifecycle, schedules, rules, limits
  subscriptions/  — plans, user subscriptions, paywall logic
  payments/       — ЮKassa integration, webhooks, billing events
  redemptions/    — QR generation, validation, scan, events
  demand/         — demand requests, support/voting
  moderation/     — offer review, fraud flags
  admin/          — admin dashboard, analytics (existing, enhanced)
```

### API Route Structure

```
app/api/
  auth/                          — existing
  public/                        — existing (cities, search, places)
  offers/                        — list, detail, nearby, activate
  subscriptions/                 — plans, subscribe, cancel, status
  payments/yokassa/webhook/      — ЮKassa callbacks
  redemptions/
    create-session/              — generate QR/code
    validate/                    — cashier scans
    history/                     — user's past redemptions
  demand/
    create/                      — "хочу скидку"
    support/                     — join existing request
  business/                      — existing + offers CRUD, scanner, analytics, staff
  admin/                         — existing + moderation, fraud, billing
```

## Data Model — New Prisma Models

### Subscriptions & Billing

```prisma
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

model SubscriptionPlan {
  id           String   @id @default(cuid())
  code         String   @unique // free, plus, premium
  name         String
  monthlyPrice Int      // in kopecks
  yearlyPrice  Int?
  currency     String   @default("RUB")
  features     Json     // feature flags
  trialDays    Int      @default(0)
  isActive     Boolean  @default(true)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())

  subscriptions UserSubscription[]
}

model UserSubscription {
  id                     String             @id @default(cuid())
  userId                 String
  planId                 String
  status                 SubscriptionStatus @default(TRIALING)
  startAt                DateTime
  endAt                  DateTime
  autoRenew              Boolean            @default(true)
  canceledAt             DateTime?
  graceUntil             DateTime?
  externalSubscriptionId String?            // ЮKassa ID
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  user     User             @relation(fields: [userId], references: [id])
  plan     SubscriptionPlan @relation(fields: [planId], references: [id])
  payments Payment[]

  @@index([userId])
  @@index([status])
}

model Payment {
  id                String        @id @default(cuid())
  userId            String
  subscriptionId    String?
  provider          String        @default("YOKASSA")
  externalPaymentId String?
  amount            Int           // kopecks
  currency          String        @default("RUB")
  status            PaymentStatus @default(PENDING)
  type              PaymentType
  paidAt            DateTime?
  failureReason     String?
  rawPayload        Json?
  createdAt         DateTime      @default(now())

  user         User              @relation(fields: [userId], references: [id])
  subscription UserSubscription? @relation(fields: [subscriptionId], references: [id])

  @@index([userId])
  @@index([externalPaymentId])
}
```

### Offer Engine

```prisma
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

model Offer {
  id               String                @id @default(cuid())
  merchantId       String
  branchId         String
  title            String
  subtitle         String?
  description      String?
  offerType        OfferType
  visibility       OfferVisibility       @default(PUBLIC)
  benefitType      BenefitType
  benefitValue     Decimal
  currency         String                @default("RUB")
  minOrderAmount   Decimal?
  maxDiscountAmount Decimal?
  approvalStatus   OfferApprovalStatus   @default(DRAFT)
  lifecycleStatus  OfferLifecycleStatus  @default(INACTIVE)
  startAt          DateTime
  endAt            DateTime?
  termsText        String?
  imageUrl         String?
  rejectionReason  String?
  createdByUserId  String
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  merchant   Business @relation(fields: [merchantId], references: [id])
  branch     Place    @relation(fields: [branchId], references: [id])
  createdBy  User     @relation("OfferCreator", fields: [createdByUserId], references: [id])

  schedules        OfferSchedule[]
  blackoutDates    OfferBlackoutDate[]
  rules            OfferRule[]
  limits           OfferLimit?
  sessions         RedemptionSession[]
  redemptions      Redemption[]
  demandRequests   DemandRequest[]
  billingEvents    MerchantBillingEvent[]

  @@index([merchantId])
  @@index([branchId])
  @@index([lifecycleStatus])
  @@index([visibility])
  @@index([offerType])
}

model OfferSchedule {
  id        String   @id @default(cuid())
  offerId   String
  weekday   Int      // 0=Monday, 6=Sunday
  startTime String   // "14:00"
  endTime   String   // "17:00"
  timezone  String   @default("Europe/Moscow")
  isBlackout Boolean @default(false)

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)

  @@index([offerId])
}

model OfferBlackoutDate {
  id      String   @id @default(cuid())
  offerId String
  date    DateTime
  reason  String?

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)

  @@index([offerId])
}

model OfferRule {
  id       String       @id @default(cuid())
  offerId  String
  ruleType OfferRuleType
  operator String?      // "eq", "gte", "lte"
  value    Json         // rule-specific value

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)

  @@index([offerId])
}

model OfferLimit {
  id                   String @id @default(cuid())
  offerId              String @unique
  dailyLimit           Int?
  weeklyLimit          Int?
  monthlyLimit         Int?
  totalLimit           Int?
  perUserDailyLimit    Int?
  perUserWeeklyLimit   Int?
  perUserLifetimeLimit Int?

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)
}
```

### QR / Redemption

```prisma
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

model RedemptionSession {
  id           String                   @id @default(cuid())
  userId       String
  offerId      String
  branchId     String
  sessionToken String                   @unique
  shortCode    String                   @unique
  status       RedemptionSessionStatus  @default(ACTIVE)
  expiresAt    DateTime
  userLat      Float?
  userLng      Float?
  createdAt    DateTime                 @default(now())

  user   User  @relation(fields: [userId], references: [id])
  offer  Offer @relation(fields: [offerId], references: [id])
  branch Place @relation("RedemptionSessionBranch", fields: [branchId], references: [id])

  redemption Redemption?
  events     RedemptionEvent[]

  @@index([userId])
  @@index([offerId])
  @@index([sessionToken])
  @@index([shortCode])
  @@index([status, expiresAt])
}

model Redemption {
  id              String           @id @default(cuid())
  sessionId       String           @unique
  userId          String
  offerId         String
  merchantId      String
  branchId        String
  scannedByUserId String?
  status          RedemptionStatus @default(SUCCESS)
  orderAmount     Decimal?
  discountAmount  Decimal?
  currency        String           @default("RUB")
  redeemedAt      DateTime         @default(now())
  createdAt       DateTime         @default(now())

  session    RedemptionSession @relation(fields: [sessionId], references: [id])
  user       User              @relation(fields: [userId], references: [id])
  offer      Offer             @relation(fields: [offerId], references: [id])
  merchant   Business          @relation(fields: [merchantId], references: [id])
  branch     Place             @relation("RedemptionBranch", fields: [branchId], references: [id])
  scannedBy  User?             @relation("RedemptionScanner", fields: [scannedByUserId], references: [id])

  events        RedemptionEvent[]
  billingEvents MerchantBillingEvent[]

  @@index([userId])
  @@index([offerId])
  @@index([merchantId])
  @@index([branchId])
  @@index([redeemedAt])
}

model RedemptionEvent {
  id          String              @id @default(cuid())
  sessionId   String?
  redemptionId String?
  eventType   RedemptionEventType
  actorType   String              // USER, STAFF, SYSTEM
  actorId     String?
  metadata    Json?
  createdAt   DateTime            @default(now())

  session    RedemptionSession? @relation(fields: [sessionId], references: [id])
  redemption Redemption?        @relation(fields: [redemptionId], references: [id])

  @@index([sessionId])
  @@index([redemptionId])
  @@index([eventType])
}
```

### Merchant Staff & Billing

```prisma
enum StaffRole {
  CASHIER
  MANAGER
}

enum BillingEventType {
  REDEMPTION_FEE
  CLICK_FEE
}

enum BillingEventStatus {
  PENDING
  INVOICED
  PAID
}

model MerchantStaff {
  id         String    @id @default(cuid())
  merchantId String
  branchId   String?
  userId     String
  staffRole  StaffRole @default(CASHIER)
  isActive   Boolean   @default(true)
  createdAt  DateTime  @default(now())

  merchant Business @relation(fields: [merchantId], references: [id])
  branch   Place?   @relation(fields: [branchId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@unique([merchantId, userId])
  @@index([userId])
}

model MerchantBillingEvent {
  id           String             @id @default(cuid())
  merchantId   String
  offerId      String
  redemptionId String?
  eventType    BillingEventType
  amount       Int                // kopecks
  currency     String             @default("RUB")
  status       BillingEventStatus @default(PENDING)
  createdAt    DateTime           @default(now())

  merchant   Business    @relation(fields: [merchantId], references: [id])
  offer      Offer       @relation(fields: [offerId], references: [id])
  redemption Redemption? @relation(fields: [redemptionId], references: [id])

  @@index([merchantId])
  @@index([status])
}
```

### Demand (MVP)

```prisma
enum DemandStatus {
  OPEN
  COLLECTING
  FULFILLED
  EXPIRED
}

model DemandRequest {
  id           String       @id @default(cuid())
  userId       String
  placeId      String?
  offerId      String?      // if fulfilled
  placeName    String?      // raw text for unregistered places
  categoryId   String?
  cityId       String
  lat          Float?
  lng          Float?
  status       DemandStatus @default(OPEN)
  supportCount Int          @default(1)
  createdAt    DateTime     @default(now())

  user     User             @relation(fields: [userId], references: [id])
  place    Place?           @relation(fields: [placeId], references: [id])
  offer    Offer?           @relation(fields: [offerId], references: [id])
  category ServiceCategory? @relation(fields: [categoryId], references: [id])
  city     City             @relation(fields: [cityId], references: [id])

  supports DemandSupport[]

  @@index([placeId])
  @@index([cityId])
  @@index([status])
}

model DemandSupport {
  id              String @id @default(cuid())
  demandRequestId String
  userId          String
  createdAt       DateTime @default(now())

  demandRequest DemandRequest @relation(fields: [demandRequestId], references: [id])
  user          User          @relation(fields: [userId], references: [id])

  @@unique([demandRequestId, userId])
}
```

### Fraud

```prisma
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

model FraudFlag {
  id             String          @id @default(cuid())
  entityType     String          // USER, MERCHANT, REDEMPTION
  entityId       String
  flagType       String
  severity       FraudSeverity   @default(MEDIUM)
  reason         String
  status         FraudFlagStatus @default(OPEN)
  createdAt      DateTime        @default(now())
  resolvedAt     DateTime?
  resolvedByUserId String?

  @@index([entityType, entityId])
  @@index([status])
}
```

## Offer Types Matrix

| Type | Benefit | Example | Visibility |
|------|---------|---------|------------|
| PERCENT_DISCOUNT | -X% | -20% на кухню | free/members/public |
| FIXED_PRICE | Special price | Бизнес-ланч 399₽ | free/members/public |
| FREE_ITEM | Gift with purchase | Бесплатный десерт | members only |
| BUNDLE | N for price of M | 2 кофе по цене 1 | free/members |
| FIRST_VISIT | New customer deal | -25% первый визит | free for all |
| OFF_PEAK | Quiet hours deal | -20% Пн-Чт 14-17 | free/members |
| FLASH | Time-limited urgent | -30% ближайшие 90 мин | free for all |
| REQUEST_ONLY | Response to demand | Персональное предложение | targeted |

## Visibility Rules

- **FREE_FOR_ALL** — anyone can use, business pays per redemption (50-80₽)
- **MEMBERS_ONLY** — requires active Plus or Premium subscription
- **PUBLIC** — visible to all, usable by all (merchant chooses)

## Offer Lifecycle

```
DRAFT → PENDING → APPROVED → ACTIVE → PAUSED/EXPIRED → ARCHIVED
                → REJECTED (with reason)
```

## Redemption Validation Chain

When user activates an offer, system checks in order:

1. User has valid subscription (if MEMBERS_ONLY)
2. Offer lifecycleStatus is ACTIVE
3. Current time matches OfferSchedule (day + hours)
4. Not a blackout date
5. OfferLimit — daily/weekly/monthly/total not exceeded
6. OfferRule — per-user limits, first-time check, etc.
7. Session not expired (60 seconds TTL)

If any check fails → specific error code returned, RedemptionEvent logged.

## QR Flow

```
User taps "Activate"
  → Backend creates RedemptionSession (token + 6-char shortCode, 60s TTL)
  → User sees QR (encodes sessionToken) + shortCode below it
  → QR auto-refreshes every 30s (new session, old one canceled)

Cashier scans QR or enters shortCode
  → Backend validates session + all offer rules
  → If OK → Redemption created (SUCCESS), session marked USED
  → Cashier screen shows: "✓ -20% на кухню"
  → If FAIL → error shown, RedemptionEvent logged
```

## Subscription Plans

| Plan | Price | Benefits |
|------|-------|----------|
| Free | 0₽ | Free deals, "Хочу скидку", basic discovery |
| Plus | 199₽/month | All free + members-only deals (10-25%) |
| Premium | 499₽/month | All Plus + higher discounts, flash deals, priority demand |

### ЮKassa Integration

- Recurring payments API for subscriptions
- Webhook endpoint: `/api/payments/yokassa/webhook`
- 7-day free trial for first-time Plus/Premium
- 3-day grace period on failed renewal
- All raw webhook payloads stored for debugging

## Merchant Scanner

Route: `/business/scanner`

- Two modes: camera QR scan + manual short code entry
- Accessible to BUSINESS_OWNER and MERCHANT_STAFF
- After scan shows: offer name, discount, confirmation status
- Uses `html5-qrcode` npm package for browser camera

## Merchant Staff

New role `MERCHANT_STAFF` with two sub-roles:
- **CASHIER** — scan QR, see today's redemptions
- **MANAGER** — all cashier + manage offers, view analytics

Staff invited by business owner via email.

## Merchant Dashboard Enhancements

New sections added to existing `/business/dashboard`:
- Active Offers — list with status badges, pause/resume
- Create Offer — 9-step wizard (type → benefit → schedule → limits → rules → photo → preview → submit)
- Redemptions — today's log, filterable
- Basic Analytics — weekly views, activations, redemptions, unique users
- Demand Inbox — count of requests for your places
- Staff Management — invite/manage cashiers
- Scanner — quick link

## User App Navigation

Bottom tabs: Главная | Карта | Поиск | Избранное | Профиль

### Home Screen

1. City selector (СПб default)
2. Search bar
3. Category pills (Кофе, Еда, Бары, Красота, Услуги, Развлечения, Магазины)
4. "Рядом сейчас" — nearest active offers
5. "Бесплатные предложения" — free deals
6. "Для подписчиков" — member deals with paywall nudge
7. "Flash" — time-limited with countdown
8. "Новые места" — recently added
9. "Хочу скидку" — CTA banner

### Demand MVP

- "Хочу скидку здесь" button on places without offers
- Join existing requests (increment counter)
- Counter visible on place cards
- Notification when offer appears (Phase 2: merchant response)

## Admin Panel Enhancements

New sections:
- Offer moderation queue (approve/reject with reason)
- Subscription stats (active, revenue, churn)
- Global redemption log
- Fraud flags (auto-detected + manual review)
- Demand heatmap
- Merchant billing events

## Fraud Detection (Basic)

Auto-flags:
- Same user redeeming same offer >3x in 24h
- Redemption attempt from >2km away
- >10 failed attempts per hour per user
- Staff redeeming own merchant's offers

## Multi-City Scalability

- Every entity tied to City
- No code changes to add a city — just DB record + merchants
- City selector in app header scopes all feeds/map/search
- Each city can optionally belong to a Franchise

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map | Yandex Maps JS API v3 | Russian market, existing key |
| Payments | ЮKassa recurring | Best for RUB |
| QR generation | `qrcode` npm | Lightweight, client-side |
| QR scanning | `html5-qrcode` npm | Browser camera, no native app |
| Session tokens | crypto.randomUUID() + HMAC | Tamper-proof |
| Short codes | 6 alphanum, no ambiguous chars | Easy to read aloud |
| Background jobs | node-cron in-process | Sufficient for Phase 1 |
| Geo queries | Haversine SQL formula | Nearby offers by distance |

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Expire offers | Hourly | ACTIVE → EXPIRED when past endAt |
| Expire sessions | Every minute | ACTIVE → EXPIRED when past expiresAt |
| Activate scheduled | Every 5 min | APPROVED → ACTIVE when past startAt |
| Subscription check | Daily | Past-grace subscriptions → EXPIRED |

## What's NOT in Phase 1

- Merchant demand inbox / response flow
- Online commerce / affiliate
- Gamification (wheel, missions, levels)
- Curator system
- Stories / multimedia
- Corporate subscriptions
- Tourist mode
- Advanced analytics / heatmaps
- POS integrations
- AI recommendations
- Group deals

## Existing EchoCity Features Retained

All existing functionality continues to work:
- User auth (email/password, Yandex OAuth)
- Place search with filters
- Place detail pages with services and reviews
- Business registration (3-step wizard)
- Service management with pricing
- Admin city/franchise management
- Yandex Maps integration

These features become the "discovery" layer of the new platform.
