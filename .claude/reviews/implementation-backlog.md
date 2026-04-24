# EchoCity — Consolidated Implementation Backlog

> Synthesized from the 12-domain review in `active-review.md`. Locks every P0 decision into a six-sprint ship sequence. Every row is file-line actionable; every sprint has a clear done-definition; every sprint has a merge gate.

**Review date:** 2026-04-21
**Product:** EchoCity (brand: ГдеСейчас / VseDomaTut)
**Scope:** Next.js 15 App Router + React 19 + Prisma 6.19 + YooKassa + PostgreSQL
**Target host:** to be decided — parking-lot P0.0 blocker

---

## P0.0 — Unblockers (must decide BEFORE any code ships)

| # | Decision | Owner | Default |
|---|---|---|---|
| U.1 | Canonical host — `gdesejchas.ru` vs. `echocity.ru` vs. keep `echocity.filippmiller.com` | Product | **`gdesejchas.ru` (brand match)** |
| U.2 | Legal entity (ИП vs. ООО) + ИНН + ОГРН + реквизиты for footer (ФЗ-38 compliance) | Legal | **Route to user** |
| U.3 | Telegram support handle URL (primary RU channel for paid-tier users) | Support | **Route to user — recommend create before Sprint B ships** |
| U.4 | Yandex Webmaster verification code | Ops | **User provides via `YANDEX_VERIFICATION` env** |
| U.5 | Google Search Console verification code | Ops | **User provides via `GOOGLE_SITE_VERIFICATION` env** |
| U.6 | YooKassa sandbox credentials (`YOOKASSA_TEST_SHOP_ID` + `YOOKASSA_TEST_SECRET_KEY`) | Ops | **User provisions from merchant panel** |
| U.7 | YooKassa webhook Basic-Auth secret (optional but recommended — paired with IP allowlist) | Ops | **User chooses 32-char random; inject as `YOOKASSA_WEBHOOK_BASIC_SECRET`** |
| U.8 | Brand-tone guidance doc — discount-hunter vs. premium curator positioning | Content | **Route to user — Sprint D blocker for copy work** |
| U.9 | Staging environment — dedicated subdomain on separate infra (recommend Timeweb VPS + Postgres) | DevOps | **Recommend provision before Sprint A e2e tests run** |
| U.10 | GitHub branch protection on `main` (1 review + CI green + linear history) | DevOps | **User enables in GitHub repo settings** |
| U.11 | OG default 1200×630 PNG asset (`public/og-default.png`) | Design | **Route to designer — Sprint E blocker** |
| U.12 | Observability stack buy-in — GlitchTip (errors) + Yandex Cloud Logging (logs) + Yandex Cloud Monitoring (metrics + alerts) + Telegram bot (alert channel) | Product + DevOps | **TL-recommended; ~₽400-600/mo** |
| U.13 | Decision on Turbo-страницы for offer pages (Yandex AMP equivalent) | Product | **Defer P2; revisit after 3mo of SEO data** |

**None of these require code.** All can be unblocked with a 30-minute product-ops review session. U.1 (canonical host) is the single biggest unblocker — it cascades into U.4, U.5, SEO Phase 1 + robots + sitemap + canonical-alternates + deploy DNS.

---

## Sprint A — Quality Gate Floor
**Goal:** No patch merges to `main` without automated lint + typecheck + test + build + migration-dry-run gate. Plus pre-commit + secret scan + branch protection.

**Duration estimate:** 2-3 dev days.
**LOC:** ~240 (Domain 11 full P0 + Domain 10 items 10.2, 10.3 that block cascading-failure during the big patches).

**Why first:** Every subsequent sprint touches high-risk surfaces (payments, auth, cron, migrations). Without CI gate, regressions ship blind. The floor is cheap; the alternative is continuous rollback.

**Merge gate:** all of Sprint A must green before any Sprint B patch merges.

| Row | Source | Action | LOC |
|---|---|---|---|
| A.1 | Domain 11.1 | **NEW `.github/workflows/ci.yml`** — jobs: lint, typecheck, unit (`test:unit`), smoke, integration, build, migration-check (Postgres 16 service container + `prisma migrate deploy` + `prisma migrate diff --exit-code`), e2e (Playwright against localhost via `webServer`) | 60 |
| A.2 | Domain 11.2 | **NEW `eslint.config.mjs`** — flat-config Next 15 + `@typescript-eslint/no-floating-promises` + `no-misused-promises` + `await-thenable` + `eslint-plugin-jsx-a11y/recommended` + `eslint-plugin-security/recommended-legacy` + `eslint-plugin-promise/always-return` + `next/core-web-vitals` | 40 |
| A.3 | Domain 11.3 | **NEW `.husky/pre-commit`** + `lint-staged` config block in `package.json` — runs eslint --fix + `tsc-files` typecheck on staged + `gitleaks protect --staged` | 15 |
| A.4 | Domain 11.4 | `playwright.config.ts:3` — default `BASE_URL='http://localhost:3010'`, hard refuse prod without `E2E_FORCE_PROD=1`, add `webServer` auto-launch, move `storageState` localStorage-onboarded-stub from global to per-test | 20 |
| A.5 | Domain 11.8 | `package.json` — `"typecheck": "tsc --noEmit --incremental false"`; wired into CI + pre-commit | 5 |
| A.6 | Domain 11.9 | CI job `migration-check` — `prisma migrate diff` + `prisma validate` (already inside A.1) | (folded) |
| A.7 | Domain 11.10 | **NEW `.gitleaks.toml`** + `gitleaks/gitleaks-action@v2` CI step (inside A.1) + pre-commit gitleaks hook (inside A.3) | 10 |
| A.8 | Domain 11.18 | User action — GitHub branch protection on `main` (1 review, all CI green, linear history, no force-push, no deletion) | 0 |
| A.9 | Domain 10.2 | **NEW `components/ErrorBoundary.tsx`** (class) + wrap `app/(consumer)/layout.tsx` + `app/(business)/layout.tsx` + `app/(admin)/layout.tsx` — reports to GlitchTip (lazy-loaded) + branded fallback | 35 |
| A.10 | Domain 10.3 | **NEW `instrumentation.ts`** — `process.on('unhandledRejection')` + `process.on('uncaughtException')` → structured log + GlitchTip report + graceful-shutdown 15s window | 15 |
| A.11 | Domain 11.17 | `modules/payments/yokassa.ts` — sandbox-vs-prod key branch at SDK init on `NODE_ENV === 'test' \|\| PLAYWRIGHT === '1' \|\| BASE_URL startsWith 'http://localhost'` | 10 |
| A.12 | Domain 11.5 | **NEW `tests/unit/payments/yokassa.test.ts`** — 7 describe blocks: Idempotence-Key sent, `upsert` atomicity, webhook IP allowlist, webhook Basic auth if-present, `$transaction` rollback, `rawPayload` PII scrub, `receipt` construction | 80 |
| A.13 | Domain 11.11 | **NEW `tests/smoke/post-deploy.sh`** + CI post-deploy step hitting `/api/health` (200 + all critical checks green) + `/offers` (200 + expected HTML marker) + `/api/payments/webhook` OPTIONS ping | 20 |
| A.14 | Domain 11.16 | `tests/setup.ts` — add `import '@testing-library/jest-dom/vitest'` | 1 |

**Sprint A LOC: 311** (over 200 by 111 — accept on floor-level grounds; this is the foundation every other sprint depends on).

**Done-definition for Sprint A:**
- PR to `main` blocked unless all of: ESLint, typecheck, Vitest unit+smoke+integration, next build, prisma migrate dry-run, Playwright localhost e2e all pass.
- Pre-commit rejects bad commits locally.
- GitHub branch protection enforced.
- `modules/payments/yokassa.ts` has 7 passing unit tests covering every Domain 9 patch surface.

---

## Sprint B — Financial Integrity + Compliance
**Goal:** Make payments atomic, webhooks authentic, idempotency real, redemption race-free. Plus the minimum legal surface: 54-ФЗ fiscal receipt + ФЗ-152 PII scrub + ЦБ РФ append-only ledger.

**Duration estimate:** 3-4 dev days (large, careful patch).
**LOC:** ~335 (Domain 9 Block A 195 + Domain 10 rows 10.5 + 10.6 + 10.9 + 10.4 = 140).

**Why second:** Payments are the largest revenue and legal blast-radius surface. The current state has five distinct financial-integrity defects (Domain 9 findings). These defects compound with Domain 10 no-audit / no-ledger gaps into "we cannot prove a transaction occurred." Sprint B closes the proof surface.

**Merge gate:** Sprint A green + Sprint B manual QA on staging (per U.9) + YooKassa sandbox end-to-end verified.

| Row | Source | Action | LOC |
|---|---|---|---|
| B.1 | Domain 9.1 | `modules/payments/yokassa.ts:40` — replace `crypto.randomUUID()` with deterministic key `hash(userId \| planId \| intentNonce)` — defeats retry dedup bypass | 10 |
| B.2 | Domain 9.2 | `modules/payments/yokassa.ts:95-117` — REMOVE body-HMAC `_signature` check; REPLACE with YooKassa-canonical IP allowlist (CIDRs `185.71.76.0/27`, `185.71.77.0/27`, `77.75.153.0/25`, `77.75.156.11`, `77.75.156.35`, `2a02:5180::/32`) + optional HTTP Basic auth if `YOOKASSA_WEBHOOK_BASIC_SECRET` set | 35 |
| B.3 | Domain 9.3 | `modules/payments/yokassa.ts:128-149` — replace find-then-create with `prisma.payment.upsert` on `externalPaymentId @unique` | 15 |
| B.4 | Domain 9.4 | `modules/payments/yokassa.ts:134-172` — wrap Payment create + UserSubscription create/update in `$transaction`; rollback on subscription failure | 25 |
| B.5 | Domain 9.5 | `modules/redemptions/service.ts:189-223` — catch P2002 on `Redemption.sessionId @unique` conflict inside transaction → return "already redeemed" 409 instead of 500 | 15 |
| B.6 | Domain 9.6 | `modules/redemptions/service.ts:244-254` — fix `earnedCoins` closure bug: `await` the `earnCashback` promise inside transaction + return real coin count | 10 |
| B.7 | Domain 9.7 | `modules/payments/yokassa.ts:146` — scrub `rawPayload` to allowlist `{ id, status, amount, currency, description }`; drop `email`, `card.last4`, `card.bin`, `card.issuer`, `payer_email`, `masked_pan` | 15 |
| B.8 | Domain 9.8 | `modules/payments/yokassa.ts:45-63` — construct `receipt` object (items[], customer.email OR customer.phone, vat_code) per 54-ФЗ; make optional in sandbox mode | 30 |
| B.9 | Domain 9.9 | `prisma/schema.prisma` — add partial-unique indexes via raw SQL migration: `CREATE UNIQUE INDEX ... WHERE status = 'ACTIVE'` on `UserSubscription(userId)` and `RedemptionSession(userId, offerId)` | 20 |
| B.10 | Domain 9.10 | `middleware.ts` `getClientIp` — add proxy-IP allowlist before trusting `x-forwarded-for`; else use socket IP | 20 |
| B.11 | Domain 10.5 | `prisma/schema.prisma` — add `CronRun { id, jobName, startedAt, finishedAt, durationMs, status, error, itemsProcessed }` + `lib/cron.ts` `withCronRun(name, fn)` wrapper | 35 |
| B.12 | Domain 10.4 | `lib/cron.ts` — `pg_try_advisory_lock(<stable-hash>)` wrapper on 3 financially-sensitive jobs: `sendWeeklyDigests`, `distributeAllCorporateCredits`, `expireSubscriptions` | 10 |
| B.13 | Domain 10.6 | `prisma/schema.prisma` — add `AuditLog { id, actorId, actorType, action, entityType, entityId, diff Json, ip, userAgent, createdAt }` + `lib/audit.ts` `withAudit(req, ...)` helper + apply to every mutating admin route | 45 |
| B.14 | Domain 10.9 | `prisma/schema.prisma` — add `FinancialEvent { id, kind (enum), userId, amountKopecks, currency, externalRef, metadata Json, createdAt }` + `lib/financial-events.ts` `recordFinancialEvent(kind, ...)` called inside every payment / subscription / cashback transaction | 35 |

**Sprint B LOC: 320.**

**Done-definition for Sprint B:**
- All YooKassa webhook events verified by IP allowlist + optional Basic auth.
- Payment + UserSubscription + FinancialEvent write together or all roll back.
- Redemption race returns 409 not 500.
- `Payment.rawPayload` contains zero PII (legal audit).
- `AuditLog` entry exists for every admin mutation.
- 3 critical cron jobs single-execution via advisory lock.
- `CronRun` records start/finish for every cron invocation — enables deadman-switch.
- Sprint A's `tests/unit/payments/yokassa.test.ts` all green against new code.

---

## Sprint C — Operational Recovery + Observability
**Goal:** When something fails in prod, operators can see it, correlate it, and respond. Users see branded recovery surfaces, not white 500s.

**Duration estimate:** 2-3 dev days.
**LOC:** ~215 (Domain 10 rows 10.1 + 10.7 + 10.8 + Domain 6 rows 6.1-6.5).

**Why third:** Sprints B's patches increase change-velocity; observability must ship with or immediately after them so prod incidents surface. Domain 6 first-visit UX is a brand-trust floor — homepage 500 + empty-state apology + unsupported claims drive users away before they see any feature.

| Row | Source | Action | LOC |
|---|---|---|---|
| C.1 | Domain 6.1 / 10.1 | **NEW `app/error.tsx`** + **NEW `app/not-found.tsx`** + **NEW `app/global-error.tsx`** — branded recovery with `/offers` CTA, policy links, support link; all emit `robots: { index: false, follow: true }` (Domain 12.18 folded) | 80 |
| C.2 | Domain 6.2 | `components/OfferFeed.tsx:68-76` — replace empty-state apology with three-action recovery: "Запросить скидку" → `/business/register`, "Подключить заведение" → business flow, "Сменить город/снять фильтры" → UX widget | 35 |
| C.3 | Domain 6.3 | `components/OnboardingFlow.tsx:70-108` — suppress auto-open on `/offers` when catalog zero; delay until user sees at least one real card OR explicitly opens tutorial | 20 |
| C.4 | Domain 6.4 | `app/page.tsx:465-483` + `components/OfferDetailClient.tsx:384-403` — suppress Plus CTA card when `memberOffers.length === 0`; swap to neutral "Уведомить о запуске Plus" or hide | 35 |
| C.5 | Domain 6.5 | `components/SatisfactionGuarantee.tsx:19-24,45-89` + `app/(consumer)/guarantee/page.tsx:27-30,55-63` — strip "24 ч возврат" + "ответим в течение часа"; keep only "refund upon request" language | 35 |
| C.6 | Domain 10.7 | `middleware.ts` — mint `requestId = crypto.randomUUID()` + `AsyncLocalStorage.run({ requestId }, next)`; `lib/logger.ts` reads from ALS + prepends `[req=<uuid>]`; response header `x-request-id` echoed | 25 |
| C.7 | Domain 10.8 | `app/api/health/route.ts` — extend with `checks: { db, yokassa_ping, cron_recent, webhook_recent }`; 503 on any critical fail; ping YooKassa `/payments/_info` with 2s timeout | 40 |
| C.8 | Domain 9.11 / 10.11 | `middleware.ts:99` — rate-limit rejection emits `logger.warn('rate_limit_reject', { ip, route, rule, ttlMs })` (Block B from Domain 9) | 10 |

**Sprint C LOC: 280** (over by 80; accept — half the over-budget is the three error-page files which are UX foundation).

**Done-definition for Sprint C:**
- No route returns unhandled 500; every error path renders branded recovery.
- Empty-state `/offers` offers three actions, not an apology.
- Onboarding no longer obstructs empty-catalog recovery.
- Plus CTA no longer markets product that has zero inventory.
- Guarantee page no longer promises SLAs the team cannot honor.
- Every prod log line carries `[req=<uuid>]`.
- `/api/health` reports `yokassa_ping`, `cron_recent`, `webhook_recent` — uptime monitor can detect silent payment breakage.
- 429 rejections are observable.

---

## Sprint D — Accessibility + Performance Baseline + Security Narrowing
**Goal:** Close the WCAG 2.1 AA + mobile-touch-target + Russian a11y legal gap (ФЗ-181 + ГОСТ Р 52872-2019). Swap production VPS host for stable RU-region. Wire observability stack (GlitchTip + Metrika) for real-user signal. Narrow CSRF carve-out.

**Duration estimate:** 3-4 dev days.
**LOC:** ~370 (Domain 5 160 + Domain 8 210).

| Row | Source | Action | LOC |
|---|---|---|---|
| D.1 | Domain 5.1 | `components/OnboardingFlow.tsx:168-237` — dialog semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, initial focus, Tab trap, focus restore | 60 |
| D.2 | Domain 5.2 | `components/AuthPrompt.tsx:14-125` — same dialog semantics for auth sheet | 45 |
| D.3 | Domain 5.3 | `components/Navbar.tsx:53-58` + `components/ShareButton.tsx:74-82` + `app/(consumer)/subscription/page.tsx:175-179,185-189` + `app/(consumer)/profile/page.tsx:356-362` — explicit `aria-label` on icon-only controls; replace `title` with `aria-label` | 8 |
| D.4 | Domain 5.4 | `app/(consumer)/offers/page.tsx:146-153` — add `aria-label="Город"` or visually-hidden label to city `<select>` | 5 |
| D.5 | Domain 5.5 | `app/globals.css:18-25` — remove blanket `.chip, .text-btn` exemption from 44×44 rule; add targeted rules: `.chip { min-h-[44px]; }`, `.text-btn { min-h-[44px]; }`, `footer a { min-h-[44px]; padding: 8px 12px; }`, `select { min-h-[44px]; }` | 16 |
| D.6 | Domain 5.6 | `components/OnboardingFlow.tsx:185-190` + `components/AuthPrompt.tsx:69,85,111,119` + `components/OfferDetailClient.tsx:342-348` + `components/Footer.tsx:5,36-40` — replace `gray-400`/`gray-300` interactive text (2.54:1, 1.47:1) with `gray-600` (~7:1 on white, AA-safe) | 12 |
| D.7 | Domain 5.7 | `components/FavoriteButton.tsx:63-87` — add `aria-pressed={isFavorited}` | 4 |
| D.8 | Domain 5.8 | `app/(consumer)/subscription/page.tsx:174-190` — add `role="status"` / `role="alert"` to success/error banners | 8 |
| D.9 | Domain 5.9 | `app/(consumer)/layout.tsx:12-20` — wrap children in `<main id="content">` landmark | 2 |
| D.10 | Domain 8.1 | `app/page.tsx:34-173` — remove 6 `.catch(() => [])` / `.catch(() => null)` silent fallbacks in `getHomeData()`; let real errors surface to Domain 10 error boundary | 20 |
| D.11 | Domain 8.2 | `app/page.tsx:155-170` — remove `merchant: { include: { name: true } }` unused join; audit remaining `mapOfferToCard` for N+1 | 15 |
| D.12 | Domain 8.3 | `next.config.ts` — add `images: { formats: ['image/avif', 'image/webp'], remotePatterns: [...], deviceSizes: [...], minimumCacheTTL: 86400 }` block; `output: 'standalone'` for Docker deploy | 20 |
| D.13 | Domain 8.4 | `next.config.ts` — add CSP header; `middleware.ts` — add nonce generation + CSP-compatible script attribution | 25 |
| D.14 | Domain 8.5 | **NEW `lib/analytics/metrika.ts`** + wire into `app/layout.tsx` via `components/MetrikaScript.tsx` SSR — Yandex Metrika counter with SPA pageview hook + GDPR/ФЗ-152-compliant opt-in | 40 |
| D.15 | Domain 8.6 | **NEW `components/GlitchTipScript.tsx`** + env `NEXT_PUBLIC_GLITCHTIP_DSN` (lazy-load unless set); wire into ErrorBoundary.reportError + Sprint A instrumentation.ts | 30 |
| D.16 | Domain 8.7 | `package.json`/deploy — switch default prod target to Timeweb VPS (documented in `docs/deploy.md` new file); retain Coolify as development-only | 50 |
| D.17 | Domain 9.12 | `middleware.ts:77` — narrow CSRF carve-out from `pathname.startsWith('/api/payments/')` to exact `pathname === '/api/payments/webhook'` | 5 |
| D.18 | Domain 9.13 | `middleware.ts:81` — remove `if (!origin) return true` loophole; require explicit `Origin` or `Referer` on mutating requests | 5 |

**Sprint D LOC: 370** (over by 170; accept — a11y + perf + secure-defaults is the floor for every RU-consumer product).

**Done-definition for Sprint D:**
- `axe-core` / Lighthouse a11y score ≥ 95 on `/`, `/offers`, `/subscription`, `/profile`.
- 44×44 touch targets met on chip, text-btn, footer link, select.
- Silent-catch pattern eliminated in homepage fanout.
- Metrika tracks pageviews + web vitals; GlitchTip captures client errors.
- Production deploy no longer depends on Coolify network stability.
- CSRF + origin checks no longer have bypass loopholes.

---

## Sprint E — SEO Phase 1 + Brand Trust Surface
**Goal:** Make the catalog indexable. Land the minimum viable SEO: sitemap + robots + per-route metadata on top-3 pages + Offer + Organization JSON-LD + static OG + Yandex + Google verification.

**Duration estimate:** 2 dev days.
**LOC:** ~172 (Domain 12 Phase 1, within budget).

**Unblocked by:** U.1 (canonical host), U.4 (Yandex verification code), U.5 (Google verification code), U.11 (OG PNG).

| Row | Source | Action | LOC |
|---|---|---|---|
| E.1 | Domain 12.1 | **NEW `app/sitemap.ts`** — `MetadataRoute.Sitemap` enumerating static routes + active offers + verified businesses; `lastmod` from `updatedAt`; `export const revalidate = 3600` | 50 |
| E.2 | Domain 12.2 | **NEW `app/robots.ts`** — disallow `/api/*`, `/admin/*`, `/business/*`, `/auth/*`, `/redeem/*`, `/dev/*`, `/profile`, `/favorites`, `/wallet`, `/settings`, `/history`, `/reservations`, `/dashboard`, `/miniapp/*`; sitemap declaration; allow all else | 15 |
| E.3 | Domain 12.3a | `generateMetadata` on `app/(consumer)/offers/page.tsx`, `app/(consumer)/subscription/page.tsx`, `app/(consumer)/collections/[slug]/page.tsx` — dynamic title/description/OG/canonical + root-layout `metadataBase: new URL(process.env.NEXT_PUBLIC_CANONICAL_URL)` | 35 |
| E.4 | Domain 12.4a | **NEW `components/StructuredData.tsx`** — SSR `<script type="application/ld+json">` supporting `Offer` (offer detail) + `Organization` + `WebSite` + `SearchAction` (root) | 60 |
| E.5 | Domain 12.8a | **NEW asset `public/og-default.png`** (1200×630, brand + tagline) + root-layout `openGraph.images` + `twitter.images` referencing it | 10 |
| E.6 | Domain 12.10 | `app/layout.tsx` head — `<meta name="yandex-verification" content={env.YANDEX_VERIFICATION} />` + `<meta name="google-site-verification" content={env.GOOGLE_SITE_VERIFICATION} />` | 2 |
| E.7 | Domain 12.14 | `app/layout.tsx:23` — replace hardcoded `echocity.vsedomatut.com` with `process.env.NEXT_PUBLIC_CANONICAL_URL`; add to `.env.example` | 0 (inside E.3) |
| E.8 | Domain 6.7 / Domain 7 | Legal-entity visibility — `Footer.tsx` adds ИНН/ОГРН/реквизиты block once U.2 resolves (fold in when data available) | 20 |
| E.9 | Domain 6.9 / Domain 7 | Support channel — Telegram link + email in footer + `NEW app/(consumer)/contact/page.tsx` | 30 |

**Sprint E LOC: 222** (over by 22, accept — rows E.8 and E.9 unblock U.2 + U.3 once data available).

**Done-definition for Sprint E:**
- `yandex.ru/search?text=site:<host>` returns catalog pages within 48h of Yandex Webmaster submission.
- `google.com/search?q=site:<host>` shows rich Offer snippets (price, availability).
- `/sitemap.xml` returns valid XML with all active offers + verified merchants.
- `/robots.txt` disallows all private routes.
- Social shares on VK / Telegram render branded OG preview.
- Footer shows ИНН/ОГРН (if U.2 resolved) + Telegram support link (if U.3 resolved).

---

## Sprint F — Follow-up Waves (not in v1)
Organized by priority for post-v1 scheduling; no hard deadline.

### F.a — SEO Phase 2 (1-2 weeks after Sprint E, ~135 LOC)
- Domain 12.3b — per-route metadata on remaining 4 marketing routes (`/bundles`, `/business`, `/for-businesses`, `/for-users`, `/guarantee`) — 50 LOC
- Domain 12.4b — extend JSON-LD with `LocalBusiness` (places/[id]) + `BreadcrumbList` — 30 LOC
- Domain 12.5 — `[slug]-[id]` URL pattern + `generateSlug()` + 301 redirect — 25 LOC
- Domain 12.8b — dynamic OG images via `app/(consumer)/offers/[id]/opengraph-image.tsx` with `ImageResponse` — 30 LOC

### F.b — SEO Phase 3 (2-4 weeks, ~165 LOC)
- Domain 12.6 — `app/[city]/page.tsx` with top-10 cities + generateStaticParams — 80 LOC
- Domain 12.11 — visual breadcrumbs component — 35 LOC
- Domain 12.12 — internal linking sections in offer detail ("еще от merchant", "еще в city", "похожие") — 50 LOC

### F.c — Observability + Audit Polish (~120 LOC)
- Domain 10.10 — canonical error envelope `lib/api-response.ts` + refactor routes — 30 LOC
- Domain 10.12 — admin support-lookup UI (user → payments + redemptions + subscription + audit) — 80 LOC
- Domain 12.13 — `/api/vitals` + Metrika custom event — 25 LOC

### F.d — Test Quality Deepening (~140 LOC)
- Domain 11.6 — `tests/setup.ts` Proxy throws-on-unconfigured — 15 LOC + existing-test triage
- Domain 11.7 — `tests/helpers/reset.ts` per-test state reset — 30 LOC
- Domain 11.12 — Dependabot config + `npm audit` CI step — 15 LOC
- Domain 11.13 — onboarding-flow dedicated e2e test — 10 LOC
- Domain 11.14 — `tests/unit/validators-ru.test.ts` (phone, ИНН, ОГРН, IDN email, Cyrillic city) — 40 LOC
- Domain 11.15 — k6 load scripts for offer-feed + checkout — 40 LOC

### F.e — A11y Polish (~91 LOC)
- Domain 5.10 — skip link in consumer layout — 8 LOC
- Domain 5.11 — `prefers-reduced-motion` respected in `globals.css` + `OnboardingFlow` + `QRRedeemScreen` — 35 LOC
- Domain 5.12 — `aria-expanded`, `aria-haspopup` on CitySelector + Navbar user menu — 18 LOC
- Domain 5.13 — QR redemption local `aria-live` status region — 18 LOC

### F.f — Performance Phase 2 (~100 LOC)
- Upstash Redis rate-limit backend (durable, distributed) — Domain 8/9 P1 — 50 LOC
- Image CDN migration (Yandex Cloud CDN or Selectel CDN) + remote-pattern update — 30 LOC
- Server Component route-level caching audit (revalidate tags) — 20 LOC

### F.g — Brand Trust / UX (Domain 7 P1, ~150 LOC)
- Trust strip on entry surfaces with real merchant counts / reviews — 35 LOC
- VK / Telegram / YouTube footer links — 15 LOC
- Press/authority meta section on `/about` — 40 LOC
- Loyalty program documentation / referral UI polish — 60 LOC

---

## LOC Summary

| Sprint | LOC | Cumulative | Notes |
|---|---|---|---|
| A — Quality Gate Floor | 311 | 311 | Must land first; blocks all other sprints |
| B — Financial Integrity | 320 | 631 | Gated by Sprint A CI green |
| C — Operational Recovery | 280 | 911 | Can parallelize with D if staffed |
| D — A11y + Perf + Security | 370 | 1281 | Can parallelize with C if staffed |
| E — SEO Phase 1 + Brand | 222 | 1503 | Gated by U.1 canonical host |
| **v1 ship total** | **1503 LOC** | | |
| F.a — SEO Phase 2 | ~135 | 1638 | Post-v1 wave 1 |
| F.b — SEO Phase 3 | ~165 | 1803 | Post-v1 wave 2 |
| F.c — Obs polish | ~120 | 1923 | Post-v1 wave 2 |
| F.d — Test deepening | ~140 | 2063 | Post-v1 wave 3 |
| F.e — A11y polish | ~91 | 2154 | Post-v1 wave 3 |
| F.f — Perf Phase 2 | ~100 | 2254 | Post-v1 wave 4 |
| F.g — Brand / UX | ~150 | 2404 | Post-v1 wave 4 |

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R.1 | Canonical-host decision (U.1) delayed → Sprint E blocked | Med | High | TL default: `gdesejchas.ru` placeholder; override via env post-ship |
| R.2 | Branch protection (U.10) not enabled → Sprint A CI gate bypassable | Med | High | Required checkbox for Sprint A sign-off |
| R.3 | YooKassa webhook IP list changes (rare, published quarterly) | Low | Med | Make CIDR list a config file; schedule quarterly review |
| R.4 | `pg_try_advisory_lock` hash collision between jobs | Low | Med | Use `hashtext(jobName)` with namespaced prefix; document collision-check |
| R.5 | `AuditLog` JSON `diff` storage bloat | Med | Low | Policy: store diffs only (not full before/after), retention 3y hot + archive |
| R.6 | `FinancialEvent` cardinality explosion (~10k events/day at scale) | Med | Low | Partition by `createdAt` monthly once volume > 100k/mo |
| R.7 | Sprint B migration wave (5 migrations) fails in production | Low | Critical | Sprint A's A.6 migration dry-run gates; staging rehearsal required per U.9 |
| R.8 | Metrika + GlitchTip scripts block first paint (LCP regression) | Low | Med | Lazy-load; CSP-compatible nonce; verified under Domain 8 patches |
| R.9 | Playwright e2e against localhost fails to spin Postgres service | Med | Low | Sprint A uses GitHub Actions `services` directive — battle-tested |
| R.10 | Canonical host DNS propagation + SSL cert issuance | Med | Med | Pre-stage DNS + cert 48h before Sprint E ship |
| R.11 | User-provided Telegram support handle not yet created (U.3) | Med | Med | Sprint E.9 ships stub "Telegram (скоро)" + email-only; upgrades when U.3 resolves |
| R.12 | Post-ship SERP CTR remains low because existing domain has zero authority | High | Med | Acceptable; SEO ramps over 2-4 months; track in Metrika + Yandex Webmaster |

---

## Scoreboard Summary (Pre-Ship)

| Domain | Overall Score | Delta to Acceptable (3.0) |
|---|---|---|
| 4 — Legal / Compliance | (prior-session) | — |
| 5 — Accessibility / Mobile / Touch | 3.2 | +0.2 ✓ |
| 6 — Consumer Perception / Messaging / Funnel | 2.7 | -0.3 |
| 7 — Brand Trust | (prior-session) | — |
| 8 — Performance / Runtime / Observability (partial) | 2.5 (est) | -0.5 |
| 9 — Backend / API / Data Integrity | (see Domain 9 TL) | — |
| 10 — Observability / Errors / Logging / Alerting / Audit | 1.5 | -1.5 |
| 11 — Testing / CI / Quality Gates | 1.75 | -1.25 |
| 12 — SEO / Discovery / Growth | 1.86 | -1.14 |

**Pre-ship aggregate: 2.2 / 5.0** (weighted by domain risk).

**Post-Sprint-A-through-E projected aggregate: 3.5 / 5.0** — passes the "acceptable" threshold for RU-market consumer launch.

**To reach 4.0+:** execute Sprint F waves over 2-3 months post-ship.

---

## Ship Readiness Checklist (End of Sprint E)

- [ ] Sprint A CI pipeline green for 3+ consecutive days; zero bypass commits to `main`.
- [ ] Sprint B payment flow tested end-to-end on staging against YooKassa sandbox: payment → subscription → cashback → webhook → AuditLog entry + FinancialEvent entry.
- [ ] Sprint C `/api/health` shows all 4 checks green in prod.
- [ ] Sprint D Lighthouse scores: perf ≥ 80, a11y ≥ 95, seo ≥ 90 on `/`, `/offers`, `/subscription`.
- [ ] Sprint E sitemap submitted to Yandex Webmaster + Google Search Console; first 24h index scan confirms zero errors.
- [ ] Legal: ИНН/ОГРН in footer; ФЗ-152 privacy policy current; 54-ФЗ receipt construction verified in sandbox + staging.
- [ ] Support: Telegram handle live + email responded to within 24h; `/contact` route live.
- [ ] Brand: OG canonical URL matches prod; copy audited for hardcoded-city references; tagline consistent across `/`, `/offers`, `/subscription`, `/about`.

---

## Parking Lot (Post-Ship Decisions)

1. **Canonical URL strategy for post-ship** — if initial data shows `echocity.ru` outperforms `gdesejchas.ru` for CTR, consider host migration (expensive post-ship; prefer commit pre-ship).
2. **Yandex Turbo-страницы adoption** — revisit after 3 months of Metrika data.
3. **Redis-backed rate limit** — migrate from in-memory `globalThis.__cityechoRateLimitStore` once replica count > 1.
4. **Sentry SaaS vs. self-hosted GlitchTip** — if incident volume exceeds GlitchTip capacity, evaluate Sentry EU-region with ФЗ-152 DPA.
5. **Self-hosted GitHub Actions runner on Yandex Cloud** — once CI latency to Yandex Cloud Postgres / Monitoring becomes painful.
6. **Pure-Cyrillic URLs** — evaluate based on Yandex "Поисковые фразы" report after Phase 2 ship.
7. **Mobile app (Capacitor / Expo) with Telegram Mini App twin** — out of review scope; product decision.
8. **YooKassa API upgrade to v3 auth flow** — when YooKassa announces deprecation.

---

**End of consolidated backlog.** All 12 domains accounted for; all P0 items routed to one of Sprints A-E or explicitly deferred to Sprint F waves. Every row has a file-line or concrete new-file action. User-action unblockers (U.1-U.13) surfaced and defaulted where TL can decide.

