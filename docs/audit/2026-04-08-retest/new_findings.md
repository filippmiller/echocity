# New Findings — EchoCity Re-Audit 2026-04-08

Issues discovered during the re-audit that were NOT part of the original 46 findings.

**New BLOCKER/CRITICAL issues: 0**

---

## MEDIUM Priority

### 1. Missing Footer on 8 Pages
**Severity:** MEDIUM
**Pages affected:** /search, /map, /for-businesses, /for-users, /favorites, /profile, /settings, /wallet, /missions
**Description:** These pages do not include the `<Footer />` component, meaning users on these pages cannot access legal links (Privacy Policy, Terms of Service) or site-wide footer navigation.
**Impact:** Legal compliance — 152-FZ requires privacy policy to be accessible from all pages.
**Fix:** Add `<Footer />` to layouts serving these pages, or ensure a shared layout wraps them.

### 2. Auth Pages Missing Legal Links in Footer
**Severity:** MEDIUM
**Pages affected:** /auth/login, /auth/register
**Description:** The auth layout has a minimal footer showing only copyright text. It lacks links to /privacy and /terms.
**Impact:** Users registering cannot review privacy policy before creating an account.
**Fix:** Add privacy/terms links to the auth layout footer.

### 3. No Terms/Privacy Acceptance on Registration
**Severity:** MEDIUM
**Description:** The registration form at /auth/register does not include a checkbox or explicit acceptance of Terms of Service and Privacy Policy.
**Impact:** Legal compliance — users should explicitly agree to terms before account creation.
**Fix:** Add a required checkbox: "Я принимаю Условия использования и Политику конфиденциальности" with links.

---

## LOW Priority

### 4. No "Forgot Password" on Login Page
**Severity:** LOW
**Pages affected:** /auth/login
**Description:** The email/password login form has no password recovery link or flow.
**Impact:** Users who forget their password have no self-service recovery option.
**Fix:** Add a "Забыли пароль?" link and implement password reset flow (email-based).

### 5. City Field is Free Text on Registration
**Severity:** LOW
**Pages affected:** /auth/register
**Description:** The city field on registration is a free-text input instead of a dropdown populated from the cities database.
**Impact:** Inconsistent data — users may enter city names in various formats.
**Fix:** Replace with a `<select>` populated from `/api/public/cities`.

### 6. Favorites Remove Buttons Hover-Only
**Severity:** LOW
**Pages affected:** /favorites
**Description:** The remove/unfavorite button on favorite items only appears on hover, making it inaccessible on touch devices.
**Impact:** Mobile users cannot remove favorites.
**Fix:** Always show the remove button, or use a swipe-to-delete pattern for mobile.

---

## OBSERVATION (Non-Issue)

### 7. Connection Pool Sensitivity Under Rapid Requests
**Severity:** OBSERVATION
**Description:** During API testing, rapid sequential requests (10+ within a few seconds) caused the server to become unresponsive for 30-45 seconds. Tests required 5-second spacing to avoid this.
**Impact:** Could affect production under concurrent load (multiple users hitting API simultaneously).
**Recommendation:** Review Prisma connection pool settings (`connection_limit` in DATABASE_URL). Consider adding `pgbouncer=true` if using connection pooling. Monitor in production.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKER | 0 |
| CRITICAL | 0 |
| MEDIUM | 3 |
| LOW | 3 |
| OBSERVATION | 1 |
| **Total** | **7** |
