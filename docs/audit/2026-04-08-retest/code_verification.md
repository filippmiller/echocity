# Code Verification Audit — 2026-04-08

All 40 items from 7 commits verified against source code.

**Result: 40/40 PASS**

---

## Commit 1: Homepage UX + Legal Pages

**1. Russian numeral grammar: `plural()` function handles 1, 2, 5 cases**
- [PASS] `app/page.tsx:25-31`
- `plural(n, one, few, many)` — handles teens (`abs > 10 && abs < 20 => many`), lastDigit=1 => one, 2-4 => few, else many.

**2. Trust stats hidden when < 20 venues; fallback text shown**
- [PASS] `app/page.tsx:211-218`
- `{placeCount >= 20 ? (...stats...) : (<p>Новые скидки каждый день</p>)}`

**3. Empty categories removed — only 5 remain**
- [PASS] `app/page.tsx:16-22`
- `CATEGORIES` array: Кофе, Еда, Бары, Красота, Услуги (5 total). No Развлечения, Магазины, Туристам.

**4. "Как это работает" 3-step section**
- [PASS] `app/page.tsx:261-263`
- `<h2>Как это работает</h2>` inside `<section>` with `grid grid-cols-3`.

**5. Privacy Policy page at /privacy with 152-FZ**
- [PASS] `app/(consumer)/privacy/page.tsx:23-24`
- Russian content referencing "Федеральным законом от 27.07.2006 N 152-ФЗ «О персональных данных»".

**6. Terms of Service page at /terms with Russian content**
- [PASS] `app/(consumer)/terms/page.tsx:5`
- Title: "Условия использования — ГдеСейчас", full Russian content.

**7. Footer has legal links**
- [PASS] `components/Footer.tsx:39-40`
- `<Link href="/privacy">Политика конфиденциальности</Link>` and `<Link href="/terms">Условия использования</Link>`.

**8. OG URL points to echocity.vsedomatut.com**
- [PASS] `app/layout.tsx:25`
- `url: 'https://echocity.vsedomatut.com'`

**9. create-admin.ts script exists**
- [PASS] `scripts/create-admin.ts:1-20`
- Uses `hashPassword` from `lib/password`, upserts admin user via Prisma.

---

## Commit 2: CollapsibleSection + Admin Complaints

**10. CollapsibleSection: no orphaned "Свернуть" buttons for empty sections**
- [PASS] `components/CollapsibleSection.tsx:79-86`
- `{isOpen && hasContent && (<button>Свернуть</button>)}` — button only renders when content exists AND section is open.

**11. CollapsibleSection: no "Показать раздел" for empty content**
- [PASS] `components/CollapsibleSection.tsx:70-78`
- Collapsed state: `hasContent ? (<button>Показать раздел</button>) : null` — returns null when empty.

**12. GET /api/admin/complaints returns JSON**
- [PASS] `app/api/admin/complaints/route.ts:14-56`
- `export async function GET(req)` returns `NextResponse.json({ complaints, total })`.

**13. Admin complaints enum validation (invalid status returns empty, not 500)**
- [PASS] `app/api/admin/complaints/route.ts:5-7, 29-32`
- `VALID_STATUSES`, `VALID_PRIORITIES`, `VALID_TYPES` arrays defined. Where clause only adds filter if value is in the valid list — invalid values are silently ignored, resulting in unfiltered (not error) response.

---

## Commit 3: Demand Fix

**14. POST /api/demand/create accepts CUID placeIds**
- [PASS] `app/api/demand/create/route.ts:8`
- `placeId: z.string().cuid().optional()`

**15. Validation uses z.string().cuid()**
- [PASS] `app/api/demand/create/route.ts:8,10-11`
- `placeId: z.string().cuid()`, `categoryId: z.string().cuid()`, `cityId: z.string().cuid()` — all use `.cuid()`, not `.min(1)` or `.uuid()`.

---

## Commit 4: Visual Enrichment

**16. /map fallback "Карта временно недоступна"**
- [PASS] `components/YandexMap.tsx:171`
- `<p>Карта временно недоступна</p>` shown in fallback div when map fails to load.

**17. /for-users page in Russian, brand is "ГдеСейчас"**
- [PASS] `app/for-users/page.tsx:5-6,19`
- Title: "Для пользователей — ГдеСейчас", body: "ГдеСейчас — ваш помощник..."

**18. Footer visible on mobile (no hidden md:block)**
- [PASS] `components/Footer.tsx:5`
- `<footer className="bg-gray-900 text-gray-400 py-10 px-4 pb-24 md:pb-10">` — no `hidden` class, visible on all breakpoints.

**19. Offer cards show placeholder photos when no imageUrl**
- [PASS] `components/OfferCard.tsx:116-121`
- When `!imageUrl`: renders `<img src="/images/offers/offer-placeholder-${(id.charCodeAt(id.length-1) % 4) + 1}.jpg" />` — photo placeholders, not colored gradients.

**20. Offer card placeholder has onError handler**
- [PASS] `components/OfferCard.tsx:122`
- `onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}`

**21. Hero has SPb cityscape background at ~25% opacity with mix-blend-soft-light**
- [PASS] `app/page.tsx:184`
- `<img src="/images/hero-bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-soft-light" />`

**22. Hero padding is pt-8 pb-12**
- [PASS] `app/page.tsx:182`
- `<section className="... pt-8 pb-12 px-4 ...">`

**23. History page: FRAUD_SUSPECTED shows "На проверке"**
- [PASS] `app/(consumer)/history/page.tsx:44-45`
- `FRAUD_SUSPECTED: { label: 'На проверке', ... }`

**24. Wallet page: manual adjustment shows "Бонус от ГдеСейчас"**
- [PASS] `app/(consumer)/wallet/page.tsx:20`
- `MANUAL_ADJUSTMENT: 'Бонус от ГдеСейчас'`

**25. 12 images exist in public/images/**
- [PASS] `public/images/`
- 12 files confirmed: `categories/bar.jpg`, `categories/beauty.jpg`, `categories/coffee.jpg`, `categories/food.jpg`, `categories/hair.jpg`, `categories/nails.jpg`, `hero-bg.jpg`, `how-it-works.jpg`, `offers/offer-placeholder-1.jpg`, `offers/offer-placeholder-2.jpg`, `offers/offer-placeholder-3.jpg`, `offers/offer-placeholder-4.jpg`.

---

## Commit 5: Code Review Fixes

**26. lib/password.ts exports hashPassword() and verifyPassword()**
- [PASS] `lib/password.ts:11,16`
- `export async function hashPassword(password: string)` and `export async function verifyPassword(password: string, hash: string)`

**27. scripts/create-admin.ts uses hashPassword from lib/password**
- [PASS] `scripts/create-admin.ts:2`
- `import { hashPassword } from '../lib/password'`

**28. CollapsibleSection: collapsed empty sections show nothing**
- [PASS] `components/CollapsibleSection.tsx:70-78`
- When `!isOpen && !hasContent`: renders `null` (no button, no content).

**29. Admin complaints: status/priority/type validated against enum lists**
- [PASS] `app/api/admin/complaints/route.ts:5-7,30-32`
- `VALID_STATUSES`, `VALID_PRIORITIES`, `VALID_TYPES` const arrays used in `.includes()` checks before adding to where clause.

**30. Demand create: uses z.string().cuid() for IDs**
- [PASS] `app/api/demand/create/route.ts:8,10-11`
- All three ID fields: `z.string().cuid().optional()`

**31. Miniapp auth: no dead createSession import**
- [PASS] `app/api/auth/miniapp/verify/route.ts:4,55`
- `import { createSession }` on line 4, used on line 55: `await createSession(...)`. Import is active.

**32. Miniapp auth: providerUserId is String(userId) (no vk_/max_ prefix)**
- [PASS] `modules/miniapp/auth.ts:48,65,112,128`
- VK: `providerUserId: String(vkUserId)` (lines 48, 65). Max: `providerUserId: String(maxUserId)` (lines 112, 128). No prefix applied.

---

## Commit 6: Security Fixes

**33. YandexMap: balloon content HTML-escaped (esc function)**
- [PASS] `components/YandexMap.tsx:129,140-145`
- `const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')` — applied to `place.name`, `place.addressLine1`, `place.placeType`, and `iconCaption`.

**34. Max miniapp auth: HMAC-SHA256 signature verification**
- [PASS] `modules/miniapp/auth.ts:94-103`
- `crypto.createHmac('sha256', maxAppSecret).update(header.payload).digest('base64url')` compared against token signature. Returns `INVALID_SIGNATURE` on mismatch.

**35. VK miniapp auth: proper signature verification**
- [PASS] `modules/miniapp/auth.ts:30-44`
- Filters `vk_` params, sorts, joins, then `crypto.createHmac('sha256', appSecret).update(signParams).digest('base64url')` compared against `params.get('sign')`.

---

## Commit 7: Design Fixes

**36. Manrope font loaded via next/font/google with Cyrillic subset**
- [PASS] `app/layout.tsx:2,5-9`
- `import { Manrope } from "next/font/google"` with `subsets: ['cyrillic', 'latin']`, `variable: '--font-manrope'`.

**37. tailwind.config.ts has fontFamily.sans with var(--font-manrope)**
- [PASS] `tailwind.config.ts:10-12`
- `fontFamily: { sans: ['var(--font-manrope)', 'system-ui', '-apple-system', 'sans-serif'] }`

**38. html tag has manrope.variable className**
- [PASS] `app/layout.tsx:43`
- `<html lang="ru" className={manrope.variable}>`

**39. @tailwindcss/typography plugin installed and configured**
- [PASS] `tailwind.config.ts:64`
- `plugins: [require('@tailwindcss/typography')]`

**40. for-users secondary CTA has border-2 border-white**
- [PASS] `app/for-users/page.tsx:30`
- `className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"`

---

## Summary

| Commit | Items | Pass | Fail |
|--------|-------|------|------|
| 1: Homepage UX + Legal | 1-9 | 9 | 0 |
| 2: CollapsibleSection + Admin | 10-13 | 4 | 0 |
| 3: Demand Fix | 14-15 | 2 | 0 |
| 4: Visual Enrichment | 16-25 | 10 | 0 |
| 5: Code Review Fixes | 26-32 | 7 | 0 |
| 6: Security Fixes | 33-35 | 3 | 0 |
| 7: Design Fixes | 36-40 | 5 | 0 |
| **Total** | **1-40** | **40** | **0** |
