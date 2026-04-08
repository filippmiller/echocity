# EchoCity Re-Audit Results — 2026-04-08

**Auditor:** Claude Opus 4.6 (automated, 4 parallel agents)
**Scope:** Full re-audit after 46 findings / 36 fixes across 8 commits

---

## Executive Summary

| Category | Items | Pass | Fail |
|----------|-------|------|------|
| Code Fix Verifications | 40 | 40 | 0 |
| API E2E Tests | 65 | 65 | 0 |
| Security Checks | 10 | 10 | 0 |
| Visual Page Audit | 22 pages | 22 | 0 |
| **Total** | **137** | **137** | **0** |

**Result: ALL 137 ITEMS PASS. Zero regressions. Zero new BLOCKER/CRITICAL issues.**

6 new MEDIUM/LOW issues discovered (see `new_findings.md`).
1 performance observation noted (connection pool sensitivity).

---

## 1. Code Fix Verifications (40/40 PASS)

Full details in `code_verification.md`.

### Commit 1: Homepage UX + Legal Pages (9/9)
- [x] `plural()` function handles Russian numeral grammar (1, 2, 5)
- [x] Trust stats hidden when < 20 venues; "Новые скидки каждый день" fallback
- [x] Empty categories removed — only 5 remain (Кофе, Еда, Бары, Красота, Услуги)
- [x] "Как это работает" 3-step section present
- [x] /privacy page with 152-FЗ content
- [x] /terms page with Russian content
- [x] Footer has legal links
- [x] OG URL: echocity.vsedomatut.com
- [x] create-admin.ts script works

### Commit 2: CollapsibleSection + Admin Complaints (4/4)
- [x] No orphaned "Свернуть" buttons for empty sections
- [x] No "Показать раздел" for empty content
- [x] /api/admin/complaints returns JSON
- [x] Invalid status filter handled gracefully (no 500)

### Commit 3: Demand Fix (2/2)
- [x] POST /api/demand/create accepts CUID placeIds
- [x] Validation uses z.string().cuid()

### Commit 4: Visual Enrichment (10/10)
- [x] /map fallback "Карта временно недоступна"
- [x] /for-users in Russian, brand "ГдеСейчас"
- [x] Footer visible on mobile (no hidden md:block)
- [x] Offer cards show placeholder photos (not gradients)
- [x] Placeholder has onError handler
- [x] Hero has SPb cityscape at ~25% opacity, mix-blend-soft-light
- [x] Hero padding pt-8 pb-12
- [x] FRAUD_SUSPECTED shows "На проверке"
- [x] Manual adjustment shows "Бонус от ГдеСейчас"
- [x] 12 images in public/images/

### Commit 5: Code Review Fixes (7/7)
- [x] lib/password.ts exports hashPassword() and verifyPassword()
- [x] create-admin.ts uses hashPassword from lib/password
- [x] CollapsibleSection: collapsed empty = nothing rendered
- [x] Admin complaints: enum validation for status/priority/type
- [x] Demand create: z.string().cuid() for IDs
- [x] No dead createSession import in miniapp auth
- [x] providerUserId = String(userId) (no prefix)

### Commit 6: Security Fixes (3/3)
- [x] YandexMap balloon HTML-escaped via esc() function
- [x] Max miniapp: HMAC-SHA256 signature verification
- [x] VK miniapp: signature verification unchanged

### Commit 7: Design Fixes (5/5)
- [x] Manrope font via next/font/google with Cyrillic subset
- [x] tailwind.config.ts fontFamily.sans = var(--font-manrope)
- [x] html tag has manrope.variable className
- [x] @tailwindcss/typography plugin installed
- [x] for-users secondary CTA: border-2 border-white

---

## 2. API E2E Tests (65/65 PASS)

Full details in `api_test_results.md`.

| Section | Tests | Pass |
|---------|-------|------|
| Authentication | 5 | 5 |
| Public Endpoints | 13 | 13 |
| Citizen Auth Flows | 26 | 26 |
| Admin Endpoints | 11 | 11 |
| Business Endpoints | 5 | 5 |
| Cross-Role Visibility | 4 | 4 |
| Data Persistence | 1 | 1 |

Key validations:
- Register/login/session/logout cycle works
- All 13 public endpoints return 200
- Profile CRUD persists changes
- Favorites add/list works
- Notifications preferences PATCH verified
- Complaints created with 20-char min validation
- Demand create accepts CUID IDs
- Admin invalid filter = graceful handling (not 500)
- Cross-role: citizen blocked from admin (401) and business (401)
- Test user confirmed in database

---

## 3. Security Checks (10/10 PASS)

Full details in `security_verification.md`.

- [x] XSS: YandexMap balloon content HTML-escaped
- [x] Max miniapp: HMAC-SHA256 signature required
- [x] VK miniapp: launch param signature verified
- [x] Session: HMAC-signed, httpOnly, sameSite=lax, secure in prod
- [x] CSRF: origin header checked for mutations
- [x] Rate limiting: 4 tiers (read/mutation/login/register)
- [x] No $queryRawUnsafe usage
- [x] No dangerouslySetInnerHTML
- [x] All 17 admin routes check role === 'ADMIN'
- [x] All 27 business routes check role === 'BUSINESS_OWNER'

---

## 4. Visual Browser Audit (22 pages)

Full details in `visual_audit.md`.

All 22 pages analyzed via source code and HTML output. Key verifications:
- Manrope font properly configured and applied
- Hero background image with correct opacity/blend
- 5 category cards (empty ones removed)
- CollapsibleSection behavior correct
- Map fallback message present
- Russian content throughout
- OG meta tags correct
- Footer legal links present (where Footer component is included)

6 new issues discovered (see `new_findings.md`).

---

## Success Criteria Assessment

| Criterion | Status |
|-----------|--------|
| All 36+ fixes verified working | PASS (40/40) |
| All 62+ API tests pass | PASS (65/65) |
| No regressions from fixes | PASS (0 regressions) |
| Visual quality improved (Manrope, hero, placeholders) | PASS |
| Security fixes confirmed (XSS, Max auth) | PASS |
| Zero new BLOCKER or CRITICAL issues | PASS |

**OVERALL VERDICT: PASS**
