# HANDOFF — Session A: Continue the Critical Review

**Scope:** Resume the multi-agent critical review from where it paused. Drive Domains 4-12 to completion. Produce the final IMPLEMENTATION-ROADMAP.md.

---

## What this session IS

Continue the dual-critic + defender + TL workflow that has already processed 3 of 12 domains. You (Claude) are the TL. User drives Codex and Kimi in separate PowerShell tabs. You spawn the Defender via the Agent tool.

## What this session IS NOT

- NOT shipping code for the improvement plan (that's Session B).
- NOT making business decisions about legal entity, pricing, or merchant acquisition (that's Session C).
- NOT running migrations on prod.

---

## Instant context (paste this as your first mental model)

**Project:** `C:\dev\echocity\` — Next.js 15 App Router + Prisma + PostgreSQL + Coolify. Russian local-deals marketplace, brand "ГдеСейчас". Production: `https://echocity.vsedomatut.com` (currently HTTP 500 on `/`, HTTP 200 but empty on `/offers`).

**Verified ground truth (do not re-debate):**
- `/` returns HTTP 500 in prod, `__next_error__` page, `noindex`.
- `/offers` returns 200 with empty state — DB has 0 offers, 0 places, 0 collections, 0 bundles, 0 stories.
- `curl /api/offers/counts?city=...` → `{"counts":{"all":0,"coffee":0,"food":0,"bars":0,"beauty":0,"nails":0,"hair":0,"laundry":0,"other":0}}`
- `curl /api/public/cities` → `{"cities":[]}`
- `curl /api/health` → `{"ok":true}`
- Footer shows `info@gdesejchas.ru` (brand/domain mismatch with `vsedomatut.com`)
- No ИП/ООО/ИНН anywhere. No Роскомнадзор registry citation. No маркировка on CTAs.
- `prisma/migrations/` has exactly one folder `0_init` + lock. 61 Prisma models.
- Sentry is NOT installed (`package.json` has no `@sentry/*`).
- `@playwright/test 1.58.2` IS in deps.

**The shared document:** `C:\dev\echocity\.claude\reviews\active-review.md` — this is the single source of truth. Every actor (TL, Codex, Kimi, Defender) appends to it below the marker. Never edit above the marker.

---

## What's done (Domains 1-3)

### Domain 1 — Homepage 500 rescue (Codex lead)
- **Root cause hypothesis (agreed by all):** `prisma.demandRequest.count` at `app/page.tsx:97-99` is the unguarded throw site; schema drift from the single-`0_init`-migration squash history.
- **Locked plan:** Replace `Promise.all` with `Promise.allSettled` + `safeQuery()` wrapper (new `lib/observability.ts`); add `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`; mode switch via `lib/home-mode.ts` (prelaunch/softlaunch/consumer) driven by `placeCount` + `allActive`; remove `force-dynamic` → `revalidate = 60`; fix 3 plural bugs (`:188`, `:478`, `:502`); hide blur-lock when `memberOffers.length === 0`; `lib/legal-entity.ts` with 8 env vars, boot-time zod assertion in `instrumentation.ts`; Footer refactor; `app/legal/requisites/page.tsx`; `app/robots.ts`; `app/sitemap.ts`; Yandex.Metrika + Webmaster verification in `app/layout.tsx`; CI smoke test.
- **15 rows in improvement plan.** Total ~300 LOC P0 + ~280 LOC P1. 14-18 hours to ship.

### Domain 2 — `/offers` + onboarding collision + mobile bottom nav (Kimi lead)
- **Key finding:** ФЗ-152 ст. 6 violation — `components/OfferFlow.tsx` writes to `localStorage` at lines 79, 86, 95, 117 before consent banner. Compounds per pageview. Fine range 75k-500k₽ (КоАП ст. 13.11).
- **Locked plan:** `lib/consent.ts` + `<ConsentBanner>` pulled forward from Domain 1 P1 into Domain 2 P0. `queuePendingWrite()` gate for every localStorage write (grep-sweep repo). Gate `OnboardingFlow` on `allActive > 0` AND route allowlist. Remove duplicate `<NearbyOffers>` mount at `app/(consumer)/offers/page.tsx:282`. Delete hardcoded `['Санкт-Петербург', 'Москва']` at `:69` — `/api/public/cities` drives the list. Hide category pills, metro filter, all content modules when `counts.all === 0`; show `<EmptyStateWithPivot>` instead. Honest empty copy with `<WaitlistForm>` + merchant CTA. `Prisma WaitlistSubscriber` model with SHA-256(IP+salt) per ФЗ-152. `/api/waitlist` endpoint with rate limit + zod. Wrap `/api/offers/counts` in existing `cached()` helper (same pattern as `/api/public/cities`). `<link rel="canonical" href="/offers">` in `app/(consumer)/offers/layout.tsx` (interim until Domain 9 full slug routing). Refactor `/offers` to RSC + SectionManifest with `visibleWhen` predicates. MobileBottomNav a11y pass. Raw `<img>` → `next/image` on 4 components.
- **20 rows in improvement plan.** Total ~195 LOC P0 + ~283 LOC P1. 12 hours to ship.

### Domain 3 — OfferCard (Codex lead)
- **Key finding:** Schema missing `Offer.originalPrice`, making every PERCENT/FIXED_AMOUNT discount an unverifiable claim under ЗоЗПП ст. 10 п. 2 + ФЗ-38 ст. 5 ч. 3. 16-state badge collision matrix. FavoriteButton nested inside Link = HTML5 invalid + Android WebView race.
- **Locked plan:** `originalPrice Decimal?(10,2)` migration + 3 Postgres CHECK constraints + zod on merchant API + admin UI (3-layer enforcement). `getBenefitBadge` returns `{primary, anchor, pill}` struct. Restructure: `<article>` + `<FavoriteButton>` sibling at `z-20` + `<Link>` with aria-label. Flex badge rails (no magic offsets). Category-initial glyph fallback (drop 4-JPG gamble). `prisma.favorite.groupBy` batched query → `favoriteCount >= 3` chip as cold-start social proof (favoriteCount over viewCountToday). Schedule copy "Откроется в {time}" per 2ГИС convention. Extract `plural()` to `lib/i18n/plural.ts`. `app/dev/offer-card-gallery/page.tsx` 16-state matrix + `tests/ui/offer-card.spec.ts` Playwright snapshot matrix + path-filtered CI workflow. `components/OfferCard.README.md` documenting planned `offer/meta/state` object refactor.
- **16 rows in improvement plan.** Total ~133 LOC P0 + ~155 LOC P1. 6 hours to ship.

### Cumulative totals so far
- **51 improvement-plan rows** locked by TL verdict.
- **~628 LOC P0 + ~718 LOC P1** across 3 PRs (each PR can be split).
- **~32 hours of focused engineering** to ship Domains 1-3.

---

## What's pending (Domains 4-12)

Status of each below. The TL directive for Domain 4 is **already posted** in the doc at the bottom; critics just need to respond.

### Domain 4 — Subscription Plus + recurring billing law (Kimi lead) — DIRECTIVE POSTED
Focus: `/subscription` page audit (reads `app/subscription/` whole dir); soft-lock vs blur-lock at scale; trial-to-paid transition (ЗоЗПП ст. 32.1 same-channel cancellation); cancellation UX (dark pattern vs honest); маркировка + ERID; pricing psychology vs Yandex.Plus / VK Combo / СберSpasibo / Тинькофф Pro; Family/Corporate plans ghost-UI. Codex parallel: Prisma subscription models integrity, payment gateway (ЮKassa/CloudPayments/Tinkoff — which is wired?), webhook idempotency, fiscal receipt (ФЗ-54 ОФД), auth guard on MEMBERS_ONLY pages, refund flow (ЗоЗПП ст. 32 partial refund).

### Domain 5 — Trust/legal/privacy surface (Kimi lead) — NOT STARTED
Focus: ЗоЗПП ст. 9 seller ID, ФЗ-152 ст. 18+22 operator registration, Роскомнадзор registry, ФЗ-38 маркировка, 18+ gate for bars category, cookie/consent banner (partially addressed in Domain 2), ФЗ-54 fiscal receipt flow, footer info hierarchy, `/privacy`, `/terms`, `/legal/requisites` audit.

### Domain 6 — Merchant onboarding + supply-side unit economics (both) — NOT STARTED
Focus: `/business/register` flow audit, merchant dashboard `app/business/`, take rate vs biglion's 40-60%, merchant verification, ИНН/ОГРН verification on signup, first-offer upload flow, payout cadence, 0→50 places acquisition model.

### Domain 7 — Fraud + QR redemption integrity (Codex lead) — NOT STARTED
Focus: `RedemptionSession` + `Redemption` + `RedemptionEvent` models, QR flow abuse vectors (multi-use exploit, screenshot sharing), merchant collusion detection (`FraudFlag`), rate limits, session TTLs, audit trail integrity.

### Domain 8 — Telegram miniapp + Russian acquisition channels (Kimi lead) — NOT STARTED
Focus: `app/miniapp/` audit, Telegram bot/channel strategy, VK/OK/Yandex.Дзен acquisition, deeplink flows, `OAuthAccount` model usage for Telegram.

### Domain 9 — Yandex SEO + schema.org + sitemap (Codex lead) — NOT STARTED
Focus: `/offers/[city]/[category]` slug routing (deferred from Domain 2), `generateStaticParams`, `generateMetadata`, `schema.org/Offer` JSON-LD, Yandex.Metrika + Webmaster verification, canonical URL strategy across the site.

### Domain 10 — Gamification (XP/Coins/Missions/Badges/Streaks) vs 0-user reality (both) — NOT STARTED
Focus: 13 Prisma models with 0 rows — retire, stage-gate, or accelerate? `Mission`, `UserMission`, `Badge`, `UserBadge`, `UserXP`, `CoinTransaction`, `Story`, `StoryView`, Leaderboard, Roulette, MysteryBag — which survive the review?

### Domain 11 — Pricing psychology (Kimi lead) — NOT STARTED
Focus: Anchor price hierarchy (largely addressed in Domain 3), urgency without lying, FOMO ceilings, RU consumer psychology on discounts, biglion/frendi pricing copy conventions, subscription tier comparison, annual-vs-monthly framing.

### Domain 12 — Final 12-week execution plan (all + Defender synthesis) — NOT STARTED
Focus: synthesize ALL domain improvement plans into parallel work streams, P0/P1/P2 ship order, dependencies between domains, owner assignments, weekly milestones, success metrics (site 200-up, first 10 merchants, first 100 offers, first 10 paying Plus subscribers).

---

## How to resume (step-by-step for new session)

### 1. Open the doc and verify state

```bash
cd /c/dev/echocity
git pull  # ensure you have the commit with all session handoffs
grep -nE "^### " .claude/reviews/active-review.md | tail -20
```

Expected last line: `### TL — Turn 4 (Opening)` at approximately line 1428.

### 2. Remind the user to start Codex and Kimi in PowerShell tabs

Copy-paste prompts from the original session's Turn 1 message (look for the `### PROMPT — CODEX TAB` and `### PROMPT — KIMI TAB` blocks earlier in your conversation history, or re-generate them from the role descriptions in the shared doc's "Agent Roster (v2 — dual-critic workflow)" section, lines ~77-88).

Both tabs poll the same file: `C:\dev\echocity\.claude\reviews\active-review.md`. Both critics respond to `@codex` / `@kimi` directives.

### 3. Wait for both critics to post Turn 4

The TL-Turn-4 directive is already in the doc. Just confirm critics are alive and let them respond. Previous turns' cadence: Kimi ~15-17 min, Codex ~3-5 min.

### 4. Spawn Defender via Agent tool

Use the same prompt pattern as Turns 1-3 (general-purpose subagent, strict contract to append only below the marker with format `### Defender — Turn N`, tailored brief including: read the critics' Turn 4 blocks, verify claims with bash, address every question, propose concrete P0/P1 LOC-budgeted plan). Reuse the structure from the Turn 3 defender prompt.

### 5. Post TL Verdict for Domain 4, open Domain 5

TL verdict pattern (repeat for each domain):
- **Convergence** summary (what critics + defender agree on)
- **Locked decisions** (numbered list of what ships)
- **Upgrades from debate** (anything TL adds beyond what agents proposed)
- **Things NOT upgrading** (note defender pushbacks that held)
- **Scoreboard** table (10 dimensions: Codex / Kimi / TL Final)
- **Improvement Plan rows** (numbered X.N with Priority/Effort/Approved)
- **Decision:** PROCEED to Domain N+1 OR request one more round
- **Open next turn directive**

### 6. Repeat for Domains 5-12

Estimated pace: ~30-45 min per domain (critic latency dominates). ~6 hours of wall-clock to finish all 9 remaining domains if you drive continuously.

### 7. Final synthesis (Domain 12)

After Domain 12 Defender response, produce:
- Final TL verdict
- `.claude/reviews/IMPLEMENTATION-ROADMAP.md` — the complete 12-week plan, one table per week, parallel work streams, owners, dependencies
- Update the `## Review Status` section at the bottom of the doc to `COMPLETE`
- Write `REVIEW COMPLETE` on its own line at the very end
- Commit + push

### Tips learned from Domains 1-3
- **Critics converge on substance, diverge on framing.** Don't relitigate when they agree.
- **Defender is empowered to reject with evidence.** 2 rejections in Domain 3 (BenefitType enum + FavoriteButton onClick guard framing) held. Don't dilute that.
- **Ship-all mode means no "Phase 2".** Every fix either lands today or is cut with explicit reasoning.
- **TL upgrades cost clock time**; only add items that are strictly better than what agents proposed.
- **Legal items (ФЗ-XX) stay in Kimi's lane** — Codex should not contradict Russian law claims without cited counter-evidence.
- **Code defect items (Prisma/TS/arch) stay in Codex's lane** — Kimi should defer on technical fixes.
- **Defender's LOC budget is a real constraint**: 200 LOC for most domains, 150 for component-level. Overruns split into same-day P1a+P1b.
- **User blockers are flagged explicitly** — legal entity values, CDN domain, Yandex tokens. Don't let them stop code from shipping; ship with `'**'` permissive defaults and tighten later.

---

## What to hand to Session B (Ship P0/P1) as you go

Every domain's improvement plan feeds Session B directly. As each domain closes, Session B can start shipping its rows. Don't block — Sessions A and B run in parallel.

## What to hand to Session C (Owner Decisions)

Flag any `user action` priority rows to Session C immediately:
- From Domain 1: 8 env values (`LEGAL_NAME`, `LEGAL_INN`, `LEGAL_OGRN`, `LEGAL_ADDRESS`, `LEGAL_ROSKOMNADZOR_NUMBER`, `SUPPORT_EMAIL`, `YANDEX_METRIKA_ID`, `YANDEX_WEBMASTER_TOKEN`).
- From Domain 2: image CDN domain for `next.config.js`.
- (Add more as Domains 4-12 surface them.)

---

## Session A success criteria

- [ ] Domains 4-12 all have TL Verdict blocks in `active-review.md`.
- [ ] `IMPLEMENTATION-ROADMAP.md` produced with 12-week parallel work streams.
- [ ] `REVIEW COMPLETE` written at end of doc.
- [ ] All session artefacts committed and pushed.

---

**Start by:** reading the last ~100 lines of `active-review.md` to orient on where Domain 4's directive was left. Then confirm with user that Codex + Kimi tabs are live.
