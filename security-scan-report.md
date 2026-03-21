---
report_type: vulnerability-hunting
generated: 2026-03-19T12:00:00Z
version: 2026-03-19
status: success
agent: security-scanner
files_processed: 110+
issues_found: 18
critical_count: 2
high_count: 6
medium_count: 7
low_count: 3
modifications_made: false
---

# Security Scan Report

**Generated**: 2026-03-19
**Project**: echocity (Next.js 15 + Prisma + YoKassa)
**Files Analyzed**: 110+ API routes, modules, middleware, config
**Total Issues Found**: 18
**Status**: Requires Attention

---

## Executive Summary

The echocity codebase demonstrates solid security fundamentals: HMAC-signed sessions with timing-safe comparison, rate limiting on all API routes, bcrypt password hashing, and admin-role guards on all `/api/admin/*` endpoints. However, the scan identified two critical issues (webhook signature timing attack, .env committed to git), six high-priority issues, and several medium/low findings that should be addressed before production hardening.

### Key Metrics
- **Critical Issues**: 2
- **High Priority Issues**: 6
- **Medium Priority Issues**: 7
- **Low Priority Issues**: 3
- **Files Scanned**: 110+
- **Modifications Made**: No

---

## Critical Issues (Priority 1)

### CRITICAL-1: YoKassa Webhook Signature Uses Non-Constant-Time Comparison

- **File**: `modules/payments/yokassa.ts:100`
- **Category**: Security - Cryptographic Weakness
- **Description**: The webhook signature verification at line 100 uses `!==` (string inequality) to compare the received signature against the expected HMAC signature. This is vulnerable to timing attacks where an attacker can incrementally guess the correct signature byte-by-byte by measuring response times. The session module (`modules/auth/session.ts:47`) correctly uses `crypto.timingSafeEqual`, but the payment webhook does not.
- **Impact**: An attacker could forge YoKassa webhook payloads to create fake payment records, grant unauthorized subscriptions, or manipulate user payment status.
- **Code**:
```typescript
// yokassa.ts:99-100 -- VULNERABLE
const receivedSignature = body._signature
if (!receivedSignature || receivedSignature !== expectedSignature) {
```
- **Fix**: Replace with `crypto.timingSafeEqual`:
```typescript
const receivedSigBuf = Buffer.from(receivedSignature, 'hex')
const expectedSigBuf = Buffer.from(expectedSignature, 'hex')
if (receivedSigBuf.length !== expectedSigBuf.length ||
    !crypto.timingSafeEqual(receivedSigBuf, expectedSigBuf)) {
  logger.warn('YoKassa webhook: invalid signature')
  throw new Error('Webhook signature verification failed')
}
```

### CRITICAL-2: .env File Not Excluded from Git

- **File**: `.gitignore` (missing `.env` entry) and `.env`
- **Category**: Security - Secrets Exposure
- **Description**: The `.gitignore` file only excludes `.env*.local` patterns. The `.env` file itself is NOT in `.gitignore`. While `git ls-files .env` shows it is not currently tracked, any developer running `git add .` or `git add -A` would inadvertently commit secrets including `DATABASE_URL`, `NEXTAUTH_SECRET`, `YOKASSA_SECRET_KEY`, and `YANDEX_MAPS_API_KEY` (which already has a real-looking UUID value in `.env`).
- **Impact**: Credentials, API keys, and database connection strings could be exposed in version control history permanently.
- **Fix**: Add `.env` to `.gitignore`:
```gitignore
# local env files
.env
.env*.local
```

---

## High Priority Issues (Priority 2)

### HIGH-1: Multiple POST Endpoints Lack Zod Input Validation

- **Files**:
  - `app/api/demand/create/route.ts` - raw `req.json()` body passed directly
  - `app/api/demand/support/route.ts` - no schema validation
  - `app/api/complaints/route.ts` - manual validation instead of Zod
  - `app/api/business/staff/route.ts` - no schema validation on POST
  - `app/api/family/members/route.ts` - no schema validation
  - `app/api/reservations/route.ts` - manual field checks, no Zod
  - `app/api/redemptions/create-session/route.ts` - no schema validation
  - `app/api/offers/[id]/reviews/route.ts` - manual validation
- **Category**: Input Validation
- **Description**: At least 8 POST endpoints accept JSON bodies without Zod schema validation. While some perform manual checks, they lack comprehensive type coercion, length limits, and sanitization that Zod provides consistently.
- **Impact**: Malformed input could reach database operations, cause unexpected errors, or allow injection of excessively long strings.
- **Fix**: Add Zod schemas to all POST endpoints. Example for `demand/create`:
```typescript
const createDemandSchema = z.object({
  placeId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  serviceType: z.string().min(1).max(100),
  description: z.string().min(10).max(1000).optional(),
})
```

### HIGH-2: POST /api/places Creates Business Accounts for Any Authenticated User

- **File**: `app/api/places/route.ts:85-165`
- **Category**: Authorization Bypass
- **Description**: The POST handler creates a `Business` record with `status: 'APPROVED'` for any authenticated user who does not already have a business. This endpoint was labeled "for testing" in a code comment but is deployed. Any CITIZEN user can create an approved business and places without going through the proper business registration flow.
- **Impact**: Unauthorized business creation, bypassing moderation.
- **Fix**: Restrict to BUSINESS_OWNER role or remove the test code:
```typescript
if (!session || session.role !== 'BUSINESS_OWNER') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### HIGH-3: No CSRF Protection on State-Changing Operations

- **Category**: CSRF
- **Description**: The application uses `sameSite: 'lax'` cookies for sessions (line 78 in session.ts). While `lax` protects against top-level cross-site POST requests, it does NOT protect against:
  - Cross-site requests initiated via JavaScript `fetch()` from a malicious page if the user navigates from the attacker's site
  - Subresource requests in some edge cases
  There is no CSRF token mechanism for any POST/PUT/DELETE endpoints.
- **Impact**: A sophisticated attacker could potentially forge state-changing requests (create offers, redeem offers, manage staff) if the user visits a malicious page.
- **Fix**: Implement one of:
  1. Double-submit cookie CSRF pattern
  2. `Origin` / `Referer` header validation in middleware
  3. Custom CSRF token header requirement (e.g., `X-Requested-With`)

### HIGH-4: Login Rate Limit Too Generous (100 attempts / 5 minutes)

- **File**: `middleware.ts:16-19`
- **Category**: Brute Force Protection
- **Description**: The login rate limit allows 100 attempts per 5 minutes per IP. This is ~20 attempts per minute, which is too permissive for a login endpoint. An attacker can try 2,880 passwords per day per IP.
- **Impact**: Feasible brute-force attacks on weak passwords.
- **Fix**: Reduce to 10 attempts per 5 minutes, or implement exponential backoff / account lockout:
```typescript
const AUTH_LOGIN_RULE: RateLimitRule = {
  key: 'api:auth:login',
  limit: 10,
  windowMs: 5 * 60_000,
}
```

### HIGH-5: No Security Headers Configured

- **File**: `next.config.ts`
- **Category**: Security Headers
- **Description**: The Next.js config has no security headers configured. Missing headers:
  - `Content-Security-Policy` (CSP)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)
  - `Referrer-Policy`
  - `Permissions-Policy`
- **Impact**: Increased attack surface for XSS, clickjacking, MIME sniffing, and downgrade attacks.
- **Fix**: Add headers to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    }]
  },
}
```

### HIGH-6: Health Endpoint Exposes Environment Configuration

- **File**: `app/api/health/route.ts`
- **Category**: Information Disclosure
- **Description**: The health endpoint reveals whether specific secrets are configured (`sessionSecret`, `redemptionSecret`, `pushConfigured`), the Node.js environment name, and server uptime. This information is useful for attackers to understand the deployment configuration.
- **Impact**: Reconnaissance information leakage.
- **Fix**: Return only `{ ok: true/false }` for unauthenticated requests. Move detailed checks behind admin authentication.

---

## Medium Priority Issues (Priority 3)

### MEDIUM-1: In-Memory Rate Limiting Does Not Survive Restarts

- **File**: `lib/rate-limit.ts`
- **Category**: Rate Limiting
- **Description**: Rate limiting uses a global in-memory `Map`. In a multi-instance deployment (multiple containers/processes), each instance maintains its own store, effectively multiplying the rate limit by the number of instances. Additionally, a server restart resets all rate limits.
- **Impact**: Rate limits can be bypassed in scaled deployments.
- **Fix**: Consider Redis-backed rate limiting (e.g., `@upstash/ratelimit`) for production multi-instance deployments.

### MEDIUM-2: Hardcoded Fallback Secrets in Development Mode

- **Files**:
  - `modules/auth/session.ts:14`: `'dev-session-secret-change-in-production'`
  - `modules/redemptions/tokens.ts:3`: `'dev-secret-change-me'`
- **Category**: Cryptographic Security
- **Description**: Both files use hardcoded fallback strings when environment variables are missing. While `session.ts` throws in production, `tokens.ts` does NOT check for production mode, meaning `NEXTAUTH_SECRET` could silently use the default in production if misconfigured.
- **Impact**: If `NEXTAUTH_SECRET` is missing in production, redemption tokens would be signed with a publicly known key.
- **Fix**: Add production guard in `tokens.ts`:
```typescript
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET environment variable is required in production')
}
```

### MEDIUM-3: SQL Query in getNearbyOffers Uses $queryRaw (Safe but Fragile)

- **File**: `modules/offers/service.ts:149-163`
- **Category**: SQL Injection (Informational)
- **Description**: The `getNearbyOffers` function uses Prisma's `$queryRaw` with tagged template literals. This is SAFE because Prisma parameterizes tagged template values automatically (template variables `${lat}`, `${lng}`, etc. become bind parameters). However, this pattern is fragile -- if any developer refactors this to use string concatenation or `$queryRawUnsafe`, it becomes vulnerable.
- **Impact**: Currently safe. Risk of regression if modified incorrectly.
- **Fix**: Add a prominent comment explaining the safety guarantee:
```typescript
// SECURITY: This uses Prisma's tagged template literal which automatically
// parameterizes all ${} values. DO NOT convert to $queryRawUnsafe or string concat.
```

### MEDIUM-4: Yandex Maps API Key Exposed as NEXT_PUBLIC Environment Variable

- **File**: `.env:4`
- **Category**: Secrets Exposure
- **Description**: `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` contains a real API key (`6bcc5d98-b76f-4b10-965c-28ded0f0a4c0`). The `NEXT_PUBLIC_` prefix means this key is bundled into client-side JavaScript and visible to anyone.
- **Impact**: The API key can be extracted and abused (billing to your Yandex account, quota exhaustion).
- **Fix**: Restrict the key in Yandex developer console to your domain only. This is expected for map APIs but ensure HTTP referrer restrictions are configured.

### MEDIUM-5: Session Data Stored Entirely in Cookie (No Server-Side Revocation)

- **File**: `modules/auth/session.ts`
- **Category**: Session Management
- **Description**: The session is a signed cookie containing userId, email, and role. While `getSession()` validates against the database (checking `isActive`), the session cannot be individually revoked without deactivating the entire user account. There is no session ID stored server-side.
- **Impact**: If a session token is stolen, it cannot be revoked until the 7-day expiry or user deactivation. Changing `SESSION_SECRET` invalidates ALL sessions.
- **Fix**: For enhanced security, consider storing session IDs in a database table with a `revokedAt` column, allowing per-session invalidation.

### MEDIUM-6: Reservation POST Endpoint Lacks Zod Validation

- **File**: `app/api/reservations/route.ts:25-78`
- **Category**: Input Validation
- **Description**: The POST handler validates fields manually with regex and range checks. While functional, it does not sanitize string inputs (guestName, guestPhone, note) for length limits, allowing arbitrarily long strings to be inserted into the database.
- **Impact**: Potential for database storage abuse or display-layer issues with extremely long strings.
- **Fix**: Add Zod schema with `.max()` constraints.

### MEDIUM-7: Console.error Used Instead of Logger

- **File**: `app/api/places/route.ts:79,162`
- **Category**: Code Quality / Information Disclosure
- **Description**: Two instances of `console.error` instead of the structured `logger.error` used everywhere else. Console output may leak stack traces in production environments.
- **Impact**: Inconsistent logging, potential information leakage in production logs.
- **Fix**: Replace with `logger.error('places.get.error', { error: String(error) })`.

---

## Low Priority Issues (Priority 4)

### LOW-1: Registration Schema Allows Empty firstName for CITIZEN

- **File**: `app/api/auth/register/route.ts:12`
- **Category**: Input Validation
- **Description**: The `firstName` field is marked `.optional()` in the Zod schema, but the handler later checks if it exists manually. The schema should enforce it directly.
- **Impact**: Inconsistent validation behavior.
- **Fix**: Change to `firstName: z.string().min(1, 'First name is required')` when `accountType === 'CITIZEN'`.

### LOW-2: Password Strength Requirements Could Be Stronger

- **File**: `lib/password.ts`
- **Category**: Authentication
- **Description**: Password requirements are: 8+ characters, at least one letter, at least one digit. There is no requirement for special characters or uppercase/lowercase mix. The weak password blocklist has only 10 entries.
- **Impact**: Users can create relatively weak passwords like `abcdefg1`.
- **Fix**: Consider requiring at least one uppercase letter, one lowercase letter, one digit, and using a more comprehensive blocklist (e.g., top 1000 passwords).

### LOW-3: No Account Lockout After Failed Login Attempts

- **File**: `modules/auth/service.ts`
- **Category**: Brute Force Protection
- **Description**: Failed login attempts are logged but do not trigger account-level lockout. Combined with the generous rate limit (HIGH-4), this allows sustained brute-force attempts.
- **Impact**: Extended brute-force window.
- **Fix**: Implement temporary account lockout after 5-10 failed attempts (e.g., 15-minute lockout).

---

## Positive Security Findings

The scan identified several well-implemented security patterns:

1. **Session HMAC with timing-safe comparison** (`modules/auth/session.ts:47`) - correctly uses `crypto.timingSafeEqual`
2. **Session cookie flags** - `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`
3. **Session validation against database** - checks `isActive` flag on every request
4. **Production-mandatory SESSION_SECRET** - throws if missing in production
5. **bcrypt password hashing** with cost factor 10
6. **Rate limiting on all API routes** via middleware
7. **Admin role checks on ALL /api/admin/* endpoints** - verified every admin route
8. **Zod validation on auth, admin, and business creation endpoints**
9. **Webhook idempotency checks** - duplicate payment detection in YoKassa handler
10. **Yandex OAuth CSRF state tokens** - properly generated and verified
11. **Prisma parameterized queries** - no SQL injection in `$queryRaw` (tagged template)
12. **No XSS vectors found** - zero usage of `dangerouslySetInnerHTML`, `.innerHTML`, or `document.write`
13. **Structured logging** - uses logger module consistently (two exceptions noted)
14. **No hardcoded credentials in source code** - all secrets from environment variables

---

## Metrics Summary

- **Security Vulnerabilities**: 2 critical, 4 high
- **Input Validation Issues**: 8 endpoints missing Zod
- **Authentication/Authorization Issues**: 1 (places endpoint)
- **Configuration Issues**: 3 (headers, .gitignore, health info leak)
- **Code Quality Issues**: 2 (console.error, fallback secrets)
- **Technical Debt Score**: Medium

---

## Task List

### Critical Tasks (Fix Immediately)
- [ ] **[CRITICAL-1]** Fix YoKassa webhook signature to use `crypto.timingSafeEqual` in `modules/payments/yokassa.ts:100`
- [ ] **[CRITICAL-2]** Add `.env` to `.gitignore` and audit git history for secrets

### High Priority Tasks (Fix Before Deployment)
- [ ] **[HIGH-1]** Add Zod validation to 8 POST endpoints (demand/create, demand/support, complaints, staff, family/members, reservations, create-session, offer reviews)
- [ ] **[HIGH-2]** Remove test business auto-creation in `app/api/places/route.ts` POST handler
- [ ] **[HIGH-3]** Add CSRF protection (Origin/Referer validation or token-based)
- [ ] **[HIGH-4]** Reduce login rate limit from 100 to 10 per 5 minutes
- [ ] **[HIGH-5]** Add security headers in `next.config.ts`
- [ ] **[HIGH-6]** Remove detailed configuration info from health endpoint for unauthenticated requests

### Medium Priority Tasks (Schedule for Sprint)
- [ ] **[MEDIUM-1]** Evaluate Redis-backed rate limiting for multi-instance deployment
- [ ] **[MEDIUM-2]** Add production guard for `NEXTAUTH_SECRET` in `modules/redemptions/tokens.ts`
- [ ] **[MEDIUM-3]** Add safety comment to `$queryRaw` in `getNearbyOffers`
- [ ] **[MEDIUM-4]** Configure Yandex Maps API key domain restrictions
- [ ] **[MEDIUM-5]** Consider server-side session store for individual session revocation
- [ ] **[MEDIUM-6]** Add Zod with length constraints to reservation POST
- [ ] **[MEDIUM-7]** Replace `console.error` with `logger.error` in places route

### Low Priority Tasks (Backlog)
- [ ] **[LOW-1]** Fix registration schema to require firstName properly
- [ ] **[LOW-2]** Strengthen password requirements
- [ ] **[LOW-3]** Implement account lockout after failed login attempts

---

## Recommendations

1. **Immediate Actions**:
   - Fix the webhook timing attack (CRITICAL-1) -- this is a payment security issue
   - Add `.env` to `.gitignore` (CRITICAL-2) -- prevents future accidental commits
   - Add security headers (HIGH-5) -- quick win, high impact

2. **Short-term Improvements** (1-2 weeks):
   - Add Zod to all POST endpoints (HIGH-1)
   - Remove test code from places route (HIGH-2)
   - Reduce login rate limit (HIGH-4)
   - Add CSRF protection (HIGH-3)

3. **Long-term Refactoring**:
   - Move to Redis-backed rate limiting
   - Implement server-side session store
   - Add account lockout mechanism
   - Set up automated dependency vulnerability scanning (e.g., `npm audit` in CI)

---

## File-by-File Risk Summary

### High-Risk Files
1. `modules/payments/yokassa.ts` - 1 critical (timing attack)
2. `app/api/places/route.ts` - 1 high (auth bypass), 1 medium (console.error)
3. `middleware.ts` - 1 high (generous rate limit)
4. `.gitignore` - 1 critical (missing .env)

### Files With Missing Zod Validation
1. `app/api/demand/create/route.ts`
2. `app/api/demand/support/route.ts`
3. `app/api/complaints/route.ts`
4. `app/api/business/staff/route.ts`
5. `app/api/family/members/route.ts`
6. `app/api/reservations/route.ts`
7. `app/api/redemptions/create-session/route.ts`
8. `app/api/offers/[id]/reviews/route.ts`

### Well-Secured Files
- `modules/auth/session.ts` - Properly implemented HMAC sessions
- `modules/auth/service.ts` - Good password handling
- All `app/api/admin/*` routes - Consistent admin guard checks
- `app/api/auth/login/route.ts` - Full Zod validation
- `app/api/business/register/route.ts` - Comprehensive Zod schema

---

*Report generated by security-scanner agent*
*No modifications made -- read-only analysis*
