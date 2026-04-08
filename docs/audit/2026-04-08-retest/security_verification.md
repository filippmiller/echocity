# Security Verification Report

**Date:** 2026-04-08
**Auditor:** Claude Opus 4.6 (automated)
**Scope:** 10-item security checklist retest

---

## Results Summary

| # | Item | Result |
|---|------|--------|
| 1 | XSS: YandexMap balloon escaping | PASS |
| 2 | Auth: Max miniapp HMAC-SHA256 | PASS |
| 3 | Auth: VK miniapp signature verification | PASS |
| 4 | Session: HMAC-signed cookie config | PASS |
| 5 | CSRF: origin header checked for mutations | PASS |
| 6 | Rate limiting: 4 tiers | PASS |
| 7 | SQL injection: no $queryRawUnsafe | PASS |
| 8 | No dangerouslySetInnerHTML | PASS |
| 9 | Admin routes: session.role === 'ADMIN' | PASS |
| 10 | Business routes: session.role === 'BUSINESS_OWNER' | PASS |

**Overall: 10/10 PASS**

---

## Detailed Findings

### 1. [PASS] XSS: YandexMap balloon content is HTML-escaped

**File:** `components/YandexMap.tsx` (line 129)

The `esc()` function escapes `&`, `<`, `>`, and `"` before injecting into balloon HTML. Applied to `place.name`, `place.addressLine1`, `place.placeType`, and `iconCaption`.

```
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
```

All dynamic values in `balloonContent` and `iconCaption` are wrapped with `esc()`.

---

### 2. [PASS] Auth: Max miniapp token requires valid HMAC-SHA256 signature

**File:** `modules/miniapp/auth.ts` (lines 84-103)

`verifyMaxLaunchParams()` splits the JWT into 3 parts, recomputes HMAC-SHA256 over `header.payload` using `maxAppSecret`, and compares the signature. Rejects with `INVALID_SIGNATURE` on mismatch. Payload is only parsed after signature verification passes.

---

### 3. [PASS] Auth: VK miniapp verifies launch param signature

**File:** `modules/miniapp/auth.ts` (lines 19-44)

`verifyVKLaunchParams()` filters params starting with `vk_`, sorts them, joins as query string, computes HMAC-SHA256 with `appSecret`, and compares against the `sign` parameter using `base64url` encoding. Rejects with `INVALID_SIGNATURE` on mismatch.

---

### 4. [PASS] Session: HMAC-signed cookie, httpOnly, sameSite=lax, secure in production

**File:** `modules/auth/session.ts` (lines 30-31, 75-81)

- HMAC-SHA256 signing via `crypto.createHmac('sha256', SESSION_SECRET)`
- Timing-safe comparison via `crypto.timingSafeEqual` (line 47)
- Cookie attributes (lines 76-80): `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`
- `SESSION_SECRET` is required in production (throws on missing, line 12)

---

### 5. [PASS] CSRF: origin header checked for mutations

**File:** `middleware.ts` (lines 70-94)

`checkOrigin()` skips GET/HEAD/OPTIONS. For mutations, it compares `Origin` header host against `Host` header. Returns 403 on mismatch. Exempts `/api/webhooks/` and `/api/payments/` (server-to-server callbacks). Allows missing Origin (non-browser clients).

---

### 6. [PASS] Rate limiting: middleware has 4 tiers

**File:** `middleware.ts` (lines 4-21)

Four distinct rules:
1. `api:read` -- 600 req/min (GET/HEAD/OPTIONS)
2. `api:mutation` -- 180 req/min (POST/PUT/DELETE etc.)
3. `api:auth:login` -- 10 req/5min (`/api/auth/login`)
4. `api:auth:register` -- 30 req/10min (`/api/auth/register`)

Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`) are attached to all responses.

---

### 7. [PASS] SQL injection: no $queryRawUnsafe

**Searched:** entire codebase for `$queryRawUnsafe`

Only occurrence is a comment in `modules/offers/service.ts` (line 173) that explicitly warns NOT to use it. The actual query on line 174 uses `prisma.$queryRaw` with tagged template literals, which auto-parameterizes all interpolated values.

---

### 8. [PASS] No dangerouslySetInnerHTML

**Searched:** entire codebase for `dangerouslySetInnerHTML`

Zero occurrences found in any `.ts` or `.tsx` file. Only mention is in `security-scan-report.md` (documentation).

---

### 9. [PASS] Admin routes all check session.role === 'ADMIN'

**Files checked (17 route files):**
- `app/api/admin/analytics/route.ts`
- `app/api/admin/bundles/route.ts`
- `app/api/admin/bundles/[id]/route.ts`
- `app/api/admin/businesses/route.ts`
- `app/api/admin/businesses/[id]/route.ts`
- `app/api/admin/cities/route.ts`
- `app/api/admin/complaints/route.ts`
- `app/api/admin/complaints/[id]/route.ts`
- `app/api/admin/franchises/route.ts`
- `app/api/admin/franchises/list/route.ts`
- `app/api/admin/fraud/route.ts`
- `app/api/admin/offers/route.ts`
- `app/api/admin/offers/[id]/approve/route.ts`
- `app/api/admin/offers/[id]/reject/route.ts`
- `app/api/admin/places/search/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`

Every exported handler in every admin route calls `getSession()` and checks `session.role !== 'ADMIN'`, returning 401/403 on failure. Routes with multiple handlers (GET + PATCH, GET + POST) check in each handler independently.

---

### 10. [PASS] Business routes all check session.role === 'BUSINESS_OWNER'

**Files checked (27 route files):**

All business route handlers check `session.role !== 'BUSINESS_OWNER'` with two acceptable variations:

- `app/api/business/register/route.ts` -- Public registration endpoint (no auth required). Creates a new business account. This is correct: unauthenticated users need to register.
- `app/api/business/analytics/route.ts` -- Allows both `BUSINESS_OWNER` and `MERCHANT_STAFF` (line 7: `session.role !== 'BUSINESS_OWNER' && session.role !== 'MERCHANT_STAFF'`). This is intentional: staff can view analytics.
- `app/api/business/places/[placeId]/services/route.ts` GET handler -- Checks session exists and verifies ownership via `place.business.ownerId === session.userId` query filter (lines 36-44), which is equivalent authorization.

All other handlers (POST, PATCH, DELETE) across all business routes explicitly check `session.role !== 'BUSINESS_OWNER'`.

---

## Conclusion

All 10 security items pass verification. No issues found.
