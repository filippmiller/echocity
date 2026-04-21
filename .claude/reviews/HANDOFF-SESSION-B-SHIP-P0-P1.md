# HANDOFF — Session B: Ship P0/P1 from Domains 1-3

**Scope:** Implement the 51 improvement-plan rows locked by TL Verdict for Domains 1, 2, 3. These can ship NOW in parallel with Session A (review continuation). Ship-all mode: no "Phase 2", no deferrals.

**Project:** `C:\dev\echocity\` — Next.js 15, Prisma, PostgreSQL, Coolify on laptop VPS (`https://echocity.vsedomatut.com`).

---

## Priority order (ship today)

### Day 1 morning (P0 block — gets `/` back to 200)
1. Domain 1 hotfix PR — ~300 LOC, gets homepage to 200, adds error/loading/not-found boundaries, observability shim, mode switch.
2. Domain 2 P0 PR — ~195 LOC, fixes `/offers` + ConsentBanner + Москва hardcode + waitlist + cached counts.
3. Domain 3 P0 PR — ~133 LOC, `originalPrice` migration + OfferCard restructure + favoriteCount.

### Day 1 afternoon (P1 block — trust/legal + a11y/perf)
4. Domain 1 P1 legal PR — ~280 LOC, Footer legal entity + privacy audit + robots/sitemap + Metrika + consent banner.
5. Domain 2 P1a (a11y + images) — ~73 LOC.
6. Domain 2 P1b (waitlist form + empty-state pivot) — ~210 LOC.
7. Domain 3 P1 visual regression — ~155 LOC, gallery + Playwright snapshots.

**Total day 1 target:** ~1,346 LOC across 7 PRs. 32 hours single-engineer, 16 hours with 2 engineers parallel. All ship same day.

---

## Domain 1 P0 Hotfix PR — file list

Branch: `fix/homepage-500-rescue`

| # | Path | Action | LOC | What changes |
|---|---|---|---|---|
| 1 | `app/page.tsx` | modify | ~80 | Remove `force-dynamic` at line 1, add `export const revalidate = 60`. Replace `Promise.all` (43-153) with `Promise.allSettled` via `safeQuery()` wrapper from new `lib/observability.ts`. Fix plural bugs at :188 (use `plural()`), :478 (use `plural()` for `+N эксклюзивных скидок`), :502 (replace wrong ternary with `plural()`). Hide blur-lock while `memberOffers.length === 0`. Wrap body in `resolveHomeMode()` early-return for prelaunch mode. |
| 2 | `lib/observability.ts` | create | ~35 | `safeQuery<T>(tag, fn, fallback): Promise<T>` — catches, logs `{tag, errorName, errorMessage, stackTop3}` as structured JSON via `console.error`, returns fallback. Honest shim since Sentry isn't installed. |
| 3 | `lib/home-mode.ts` | create | ~25 | Pure `resolveHomeMode({allActive, placeCount}): 'prelaunch' \| 'softlaunch' \| 'consumer'`. Two-gate: `placeCount < 20 OR allActive < 20` → prelaunch. `20 ≤ placeCount < 50` → softlaunch. `placeCount ≥ 50` → consumer. |
| 4 | `app/error.tsx` | create | ~50 | Client error boundary. Navbar + footer + Russian fallback copy "Что-то пошло не так" + reset button + Links to `/offers` and `/business/register`. `useEffect(() => console.error(error))`. |
| 5 | `app/loading.tsx` | create | ~30 | Skeleton shell — gray hero band + category pill placeholders. |
| 6 | `app/not-found.tsx` | create | ~25 | 404 with navbar + footer + CTA to `/offers`. |
| 7 | `components/MerchantFirstLanding.tsx` | create | ~60 | Prelaunch mode root. Merchant CTA primary ("Подключите заведение — первые 50 партнёров без комиссии"), consumer waitlist form below, no subscription paywalls, no "Как это работает", no SavingsCounter. |

**Total: ~305 LOC.** If #7 exceeds, ship #1-6 as hotfix, #7 as same-day follow-up.

### Acceptance
- `curl https://echocity.vsedomatut.com/` returns HTTP 200.
- `/` renders either consumer homepage (if `placeCount ≥ 20 && allActive ≥ 20`) or `MerchantFirstLanding` (if either is under 20).
- Structured log entry appears in Coolify container logs when any Prisma branch in `getHomeData()` fails.
- `/api/health` still returns 200.
- No regression on `/offers` (should still be 200, empty).

---

## Domain 1 P1 Legal + SEO PR — file list

Branch: `feat/legal-identity-and-seo-base`

Blocks on user providing 8 env values in Coolify — flag to Session C:
- `LEGAL_NAME` (e.g., `ИП Миллер Ф.И.` or `ООО "ГдеСейчас"`)
- `LEGAL_INN`
- `LEGAL_OGRN` (or `LEGAL_OGRNIP` for ИП)
- `LEGAL_ADDRESS`
- `LEGAL_ROSKOMNADZOR_NUMBER` (registry entry from Реестр операторов ПДн)
- `SUPPORT_EMAIL` (real inbox matching legal entity)
- `YANDEX_METRIKA_ID`
- `YANDEX_WEBMASTER_TOKEN`

| # | Path | Action | LOC | What changes |
|---|---|---|---|---|
| 1 | `lib/legal-entity.ts` | create | ~40 | Export `LEGAL_ENTITY` const, zod-validated env reads, `assertLegalIdentityConfigured()` guard. Typed interface. |
| 2 | `instrumentation.ts` | modify | ~10 | Boot-time assertion — throws in `NODE_ENV=production` if `LEGAL_INN` missing. Container fails healthcheck → Coolify rollback. |
| 3 | `components/Footer.tsx` | modify | ~30 | Render `<LegalIdentity />` subsection above copyright row. Replace hardcoded `info@gdesejchas.ru` with `LEGAL_ENTITY.supportEmail`. Change superlative copy "Лучшие скидки..." → "Скидки в кафе, ресторанах и салонах Санкт-Петербурга". |
| 4 | `app/legal/requisites/page.tsx` | create | ~35 | ЗоЗПП ст. 9 + ФЗ-152 ст. 18 "Реквизиты" page. Full legal identity + processing purposes. |
| 5 | `app/privacy/page.tsx` | modify | ~30 | Enumerate localStorage keys, processing purposes, правовые основания, срок хранения, права субъекта, трансграничная передача, cookies list. |
| 6 | `app/api/auth/register/route.ts` | modify | ~8 | Guard with `assertLegalIdentityConfigured()` → 503 if incomplete. |
| 7 | `app/api/otp/request/route.ts` | modify | ~8 | Same guard. |
| 8 | `app/robots.ts` | create | ~15 | App Router Metadata API. Disallow `/admin`, `/api`, `/dev`. Allow all else. Sitemap URL. |
| 9 | `app/sitemap.ts` | create | ~40 | Dynamic from Prisma `Offer` + `Place` where `isActive`. Falls back to static routes when DB empty. |
| 10 | `app/layout.tsx` | modify | ~15 | Yandex.Metrika counter via `<Script strategy="afterInteractive" />` gated on env. `<meta name="yandex-verification">` gated on env. OpenGraph defaults. |
| 11 | `components/ConsentBanner.tsx` | create | ~50 | ФЗ-152 ст. 6 consent banner. Bottom-sticky, Russian copy "Мы сохраняем ваши предпочтения в этом браузере, чтобы показать актуальные скидки. Подробнее — в [Политике](/privacy)". Two buttons: `Принять` / `Только необходимые`. Dispatches `'consent-granted'` CustomEvent. |

**Total: ~281 LOC.**

---

## Domain 2 P0 PR — file list

Branch: `fix/offers-empty-state-and-consent`

| # | Path | Action | LOC | What changes |
|---|---|---|---|---|
| 1 | `lib/consent.ts` | create | ~30 | `hasConsent()`, `grantConsent()`, `revokeConsent()`, `queuePendingWrite(key, value)`, `flushPendingWrites()`. SSR-safe. Reads `localStorage.getItem('echocity_consent_v1')`. |
| 2 | `components/ConsentBanner.tsx` | create | ~50 | (Same as Domain 1 P1 #11 — ship once, use here.) |
| 3 | `components/ClientProviders.tsx` | modify | ~5 | Mount `<ConsentBanner />` above `<OnboardingFlow />`. |
| 4 | `components/OnboardingFlow.tsx` | modify | ~20 | Gate all 4 `localStorage.setItem` (at :79, :86, :95, :117) behind `hasConsent()` + `queuePendingWrite()`. Gate entire mount on `counts.all > 0 && routeAllowed(pathname)`. |
| 5 | `components/NearbyOffers.tsx` | modify | ~8 | Early-return null when `counts.all === 0`. Remove geolocation prompt on empty `/offers`. |
| 6 | `app/(consumer)/offers/page.tsx` | modify | ~30 | (a) Drop hardcoded `['Санкт-Петербург', 'Москва']` at :69. (b) Fetch cities with `placeCount > 0` from updated `/api/public/cities`. (c) Hide switcher when `<2` eligible cities. (d) Rewrite H1 at :133-134 to `Скидки в {city}` + dynamic subcopy. (e) Hide metro filter at :223-269 when `counts.all === 0`. (f) Collapse section mounts at :278-300 behind `counts.all > 0`; zero-supply renders only `<EmptyStateWithPivot />`. |
| 7 | `app/api/offers/counts/route.ts` | modify | ~15 | Wrap in `cached('offers:counts:' + cityName, 300000, ...)`. Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`. |
| 8 | `app/api/public/cities/route.ts` | modify | ~12 | Include `placeCount` via `_count: { select: { branches: { where: {...} } } }`. Bump cache key to `public:cities:v2`. |
| 9 | `components/OfferFeed.tsx` | modify | ~25 | Replace empty state at :68-77 with honest copy "Пока нет скидок / Первые заведения подключаются. Оставьте email — напишем, когда появятся предложения в Санкт-Петербурге." + `<WaitlistForm city={city} source="offers-empty" />` + link to `/business/register`. |

**Total: ~195 LOC.**

---

## Domain 2 P1a — A11y + Images PR

Branch: `chore/offers-a11y-and-images`

| # | Path | Action | LOC |
|---|---|---|---|
| 1 | `components/OnboardingFlow.tsx` | modify | ~35 | Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape-to-close, focus restore. |
| 2 | `components/MobileBottomNav.tsx` | modify | ~10 | `aria-label="Основная навигация"` on `<nav>`, `aria-current="page"` on active `<Link>`. Icons `w-6 h-6`, labels `text-[11px]`. |
| 3 | `components/FeaturedCollections.tsx` | modify | ~5 | `<img>` at :51 → `next/image`. |
| 4 | `components/RecentlyViewed.tsx` | modify | ~5 | `<img>` at :45 → `next/image`. |
| 5 | `components/WhatsHot.tsx` | modify | ~5 | `<img>` at :96 → `next/image`. |
| 6 | `components/TopRatedOffers.tsx` | modify | ~5 | `<img>` at :72 → `next/image`. |
| 7 | `next.config.js` | modify | ~8 | Add `images.remotePatterns`. Ship permissive `'**'` initially; tighten to real CDN in follow-up once Session C confirms domain. |
| 8 | `app/(consumer)/offers/layout.tsx` | create | ~20 | Export `metadata` with `alternates.canonical = '/offers'`. |

**Total: ~93 LOC.**

---

## Domain 2 P1b — Waitlist + Empty State Pivot PR

Branch: `feat/waitlist-and-empty-state-pivot`

| # | Path | Action | LOC |
|---|---|---|---|
| 1 | `prisma/schema.prisma` | modify | ~20 | Add `WaitlistSubscriber` model (see below). |
| 2 | `prisma/migrations/<ts>_add_waitlist_subscriber/migration.sql` | generated | auto | Run `npx prisma migrate dev --name add_waitlist_subscriber` locally, verify in psql, commit. |
| 3 | `app/api/waitlist/route.ts` | create | ~50 | POST endpoint. zod validate `{email?, telegram?, city, source}`. Rate limit 3/hour/IP. Consent check. SHA-256(IP + `WAITLIST_IP_SALT` env). Returns `{success:true}` or `{error:'Уже в списке'}` on duplicate. |
| 4 | `components/WaitlistForm.tsx` | create | ~60 | React 19 `useActionState` + server action. Email input + submit button. Russian success/error states. aria attributes. |
| 5 | `components/EmptyStateWithPivot.tsx` | create | ~60 | Reads `categoryCounts`, suggests nearest non-empty category (`"В 'Кофе' пусто, но в 'Еда' есть 12 предложений →"`). Falls back to `<WaitlistForm />` when ALL categories empty. |

**Prisma model:**
```prisma
model WaitlistSubscriber {
  id          String   @id @default(cuid())
  email       String?  @db.VarChar(255)
  telegram    String?  @db.VarChar(64)
  city        String   @db.VarChar(100)
  source      String   @db.VarChar(64)
  userAgent   String?  @db.VarChar(512)
  ipHash      String?  @db.VarChar(64)
  createdAt   DateTime @default(now())
  notifiedAt  DateTime?

  @@index([city, createdAt])
  @@index([email])
  @@map("waitlist_subscribers")
}
```

**Total: ~210 LOC + migration SQL.**

### Migration run
```bash
cd C:/dev/echocity
npx prisma migrate dev --name add_waitlist_subscriber
# verify:
docker exec b13rk5k1ix7mckiqotydobja psql -U echocity -d echocity -c '\d waitlist_subscribers'
```
Per global rules: YOU apply migrations, never wait for deploy. Ensure `WAITLIST_IP_SALT` env is set in Coolify before deploying the API.

---

## Domain 3 P0 PR — file list

Branch: `fix/offer-card-anchor-price-and-a11y`

| # | Path | Action | LOC |
|---|---|---|---|
| 1 | `prisma/schema.prisma` | modify | +1 | Add `originalPrice Decimal? @db.Decimal(10, 2)` after `maxDiscountAmount` in `Offer` model. |
| 2 | `prisma/migrations/<ts>_add_offer_original_price/migration.sql` | create | +18 | ALTER TABLE + 3 CHECK constraints (see below). |
| 3 | `lib/i18n/plural.ts` | create | +10 | Extract `plural(n, one, few, many)` from `app/page.tsx:25-32`. |
| 4 | `app/page.tsx:25-32` + `app/api/business/demand/suggestions/route.ts` | modify | -16/+2 | Replace inline `plural()` with `import { plural } from '@/lib/i18n/plural'`. |
| 5 | `components/OfferCard.tsx:15-37` | modify | +8 | Add `originalPrice?: number \| null`, `favoriteCount?: number` props. |
| 6 | `components/OfferCard.tsx:71-80` | modify | +18/-10 | `getBenefitBadge` returns `{primary, anchor, pill}` struct supporting `originalPrice`. |
| 7 | `components/OfferCard.tsx:109-159` | modify | +26/-22 | `<article>` root, `<FavoriteButton>` as Link sibling at `z-20`, `aria-label` on Link. Flex badge rails: top-left for `discount + trending`, top-right for `plus + online`. Remove magic offsets. |
| 8 | `components/OfferCard.tsx:113-123` | modify | +14/-9 | Category-initial glyph fallback. Drop 4-JPG gamble + `onError` hide. |
| 9 | `components/OfferCard.tsx:223-235` | modify | +6 | Render `favoriteCount >= 3` chip when `redemptionCount < 1`. |
| 10 | `components/OfferCard.tsx:188-204` | modify | +2/-2 | `Сегодня с {startTime}` → `Откроется в {startTime}`. |
| 11 | `app/page.tsx` (getHomeData + mapOfferToCard) | modify | +12 | Add `prisma.favorite.groupBy` batched query. Pass `favoriteCount` through `mapOfferToCard`. |
| 12 | `app/api/merchant/offers/route.ts` (POST) | modify | +10 | Zod refine: originalPrice required for PERCENT/FIXED_AMOUNT. |

**Migration SQL:**
```sql
-- prisma/migrations/20260421_add_offer_original_price/migration.sql
ALTER TABLE "Offer" ADD COLUMN "originalPrice" DECIMAL(10,2);

-- No backfill needed — 0 production offers.

ALTER TABLE "Offer" ADD CONSTRAINT "offer_original_price_required_for_percent_and_amount"
  CHECK (
    ("benefitType" NOT IN ('PERCENT', 'FIXED_AMOUNT'))
    OR ("originalPrice" IS NOT NULL AND "originalPrice" > 0)
  );

ALTER TABLE "Offer" ADD CONSTRAINT "offer_percent_value_sane"
  CHECK ("benefitType" != 'PERCENT' OR ("benefitValue" >= 1 AND "benefitValue" <= 99));

ALTER TABLE "Offer" ADD CONSTRAINT "offer_fixed_amount_below_original"
  CHECK ("benefitType" != 'FIXED_AMOUNT' OR ("benefitValue" < "originalPrice"));
```

**Total: ~133 LOC.**

### Migration run
```bash
cd C:/dev/echocity
npx prisma migrate dev --name add_offer_original_price
docker exec b13rk5k1ix7mckiqotydobja psql -U echocity -d echocity -c '\d "Offer"' | grep originalPrice
```

---

## Domain 3 P1 PR — Visual Regression + Skeleton

Branch: `test/offer-card-visual-matrix`

| # | Path | Action | LOC |
|---|---|---|---|
| 1 | `components/ui/OfferCardSkeleton.tsx` | modify | +10 | Add badge-row + meta-row placeholders. |
| 2 | `app/dev/offer-card-gallery/page.tsx` | create | +80 | Dev-gated route. 16-state card grid with scripted fixtures: `base, flash, trending, flash+trending, plus, online, plus+online, flash+plus+online, flash+trending+plus+online, no-image, almost-gone, schedule-open, schedule-opens-today, schedule-tomorrow, members-only+trending, all-badges`. |
| 3 | `tests/ui/offer-card.spec.ts` | create | +40 | Playwright test. 390px viewport. Iterates 16 `[data-card-id]` locators, `toHaveScreenshot` with `maxDiffPixels: 40`. |
| 4 | `.github/workflows/visual-regression.yml` | create | +25 | Path-filtered job on `components/OfferCard.tsx` or `components/FavoriteButton.tsx` changes. Runs Playwright, uploads diffs. |
| 5 | `modules/offers/types.ts` | modify | +8/-6 | Reconcile with component props — add `originalPrice`, `favoriteCount`, `isVerified`, `isTrending`, `reviewCount`. |
| 6 | `components/OfferCard.README.md` | create | +40 | Document planned `offer/meta/state` object prop refactor. Show migration path for callers. |

**Total: ~155 LOC.**

---

## Cross-cutting P0 — CI smoke test

Branch: `ci/home-smoke-and-zero-supply`

| # | Path | Action | LOC |
|---|---|---|---|
| 1 | `e2e/home-smoke.spec.ts` | create | ~30 | Playwright. Asserts `/` returns 200 against staging. Runs in CI gate before merge to main. |
| 2 | `tests/integration/home-zero-supply.int.spec.ts` | create | ~50 | Starts Postgres container, applies schema, seeds nothing, hits `/` via Next.js dev server, asserts 200. Prevents regression of the 500 class. |
| 3 | `e2e/offers-empty-state.spec.ts` | create | ~40 | Navigates `/offers` with empty DB, asserts no onboarding modal (if counts.all === 0), asserts WaitlistForm present, asserts no localStorage writes before consent granted. |
| 4 | `.github/workflows/e2e.yml` | modify | ~10 | Add both specs to required checks. |

**Total: ~130 LOC.**

---

## Ship checklist

### Before starting
- [ ] `git pull` to get this handoff + committed review doc.
- [ ] Confirm Coolify env has all 8 legal + 2 Yandex env values (Session C owns delivering them). If missing, ship P0 + P1 a11y/perf/visual regression first; hold P1 legal/SEO until values provided.
- [ ] Confirm `WAITLIST_IP_SALT` env exists (generate random 32-byte hex if not).
- [ ] Confirm image CDN domain (Session C).

### Per PR
- [ ] Read the row table above for that PR.
- [ ] Make branch `<type>/<short>` per global rules.
- [ ] Implement file-by-file. Run `npm run typecheck && npm run lint` after each file.
- [ ] Run relevant tests (`npm run test`, `npx playwright test ...`).
- [ ] Verify locally with dev server where possible.
- [ ] Commit with conventional-commit message referencing the improvement plan row numbers (e.g., `fix(home): rescue 500 via allSettled + error boundary + mode switch [1.1-1.6]`).
- [ ] Push branch, open PR, let CI pass.
- [ ] If DB migration: RUN IT YOURSELF on prod via `npx prisma migrate deploy` in the container per global Migration Gate rule. Verify with `\d` query.
- [ ] Verify deploy: Coolify build green, `curl https://echocity.vsedomatut.com/` returns expected status, relevant API endpoint returns expected shape.
- [ ] Update `.claude/work-log.md` with a reverse-chronological entry.

### Final
- [ ] All 51 improvement-plan rows from Domains 1-3 are marked complete (or explicitly cut with reasoning).
- [ ] `/` returns 200.
- [ ] `/offers` shows honest empty state with `WaitlistForm`.
- [ ] Footer shows full legal identity from env vars.
- [ ] Yandex.Metrika + Webmaster wired; `robots.txt` + `sitemap.xml` reachable.
- [ ] ConsentBanner appears once per browser, gates all localStorage writes.
- [ ] OfferCard renders with `originalPrice` anchor, `favoriteCount` chip, restructured layout.
- [ ] 16-state Playwright visual regression suite passing.

---

## Risk register

- **Prisma schema drift on prod.** `0_init` is the only migration in the repo. When you run `prisma migrate deploy` with new migrations, it may fail with P3009. Follow the documented pattern in `.claude/deploy-instructions.md` (`prisma db push` to reconcile, then `prisma migrate resolve --applied`).
- **Coolify post-deploy hook may or may not run `migrate deploy`** — verify in Coolify service config before shipping. If it doesn't, run manually in container shell.
- **User might not have `ИП/ООО` yet.** If Session C reports legal entity not registered, the P1 legal PR's env assertion blocks the container from starting. Ship it on a feature branch without merging until Session C unblocks.
- **Yandex.Metrika without consent** — wait until ConsentBanner is shipped first, then layer Metrika behind `hasConsent()` guard. Do not ship Metrika-without-consent even briefly.

---

## Out of scope for Session B

- Domains 4-12 improvement plans (not yet locked — wait for Session A).
- Merchant acquisition (business ops, not code).
- Legal entity choice (ИП vs ООО — Session C).
- Pricing tier decisions (Domain 4 will refine).

---

## Success criteria

Production goes from "500 homepage, empty offers, no legal entity, ФЗ-152 violation on every pageview" to:
- Homepage returns 200 with honest prelaunch or consumer UI.
- `/offers` is transparently empty with a waitlist capture.
- Every localStorage write is consent-gated.
- Footer has full ИП/ООО + ИНН + ОГРН + Роскомнадзор registry (once Session C delivers values).
- Yandex.Metrika + Webmaster wired, sitemap.xml + robots.txt live.
- OfferCard has anchor price + favoriteCount + a11y + visual regression CI.

Sessions A, B, C can run in parallel. B is unblocked today.
