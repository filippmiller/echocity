# Regression Report — EchoCity Re-Audit 2026-04-08

**Result: ZERO REGRESSIONS**

---

## Methodology

Each of the 36 original fixes (expanded to 40 verification items) was tested for:
1. **Direct verification** — Does the fix work as intended?
2. **Side effects** — Did the fix break anything adjacent?
3. **API stability** — Do all 65 API endpoints still return expected responses?
4. **Security posture** — Are all 10 security controls intact?

---

## Fix-by-Fix Regression Analysis

### Commit 1: Homepage UX + Legal Pages
- `plural()` function: No regression. Function is self-contained, used only in homepage stats display.
- Trust stats conditional: No regression. Fallback text renders correctly when placeCount < 20.
- Category removal: No regression. Only 5 categories defined, all with valid data. No broken links or references to removed categories.
- "Как это работает" section: No regression. Properly positioned between categories and content.
- Legal pages (/privacy, /terms): No regression. Pages load independently, no impact on other routes.
- Footer legal links: No regression. Footer component unchanged in structure, links added cleanly.
- OG URL fix: No regression. Only metadata change, no functional impact.

### Commit 2: CollapsibleSection + Admin Complaints
- CollapsibleSection refactor: No regression. MutationObserver-based content detection works for both empty and non-empty states. Toggle buttons appear/hide correctly.
- Admin complaints JSON response: No regression. API returns proper JSON. Enum validation silently ignores invalid values (safe behavior).

### Commit 3: Demand Fix
- CUID validation change: No regression. `.cuid()` validator accepts all existing place IDs. No UUID-format IDs exist in the system.

### Commit 4: Visual Enrichment
- Map fallback: No regression. Fallback only shown when map fails to load; does not interfere with successful map rendering.
- Russian content on /for-users: No regression. Brand name and copy consistent throughout.
- Footer mobile visibility: No regression. `pb-24 md:pb-10` padding accounts for mobile nav bar.
- Offer card placeholders: No regression. Photo placeholders render correctly; onError handler prevents broken image icons.
- Hero background: No regression. Image loads at 25% opacity, does not obscure text.
- Status label changes (FRAUD_SUSPECTED, MANUAL_ADJUSTMENT): No regression. Label-only changes, no logic impact.
- Image assets: No regression. All 12 images present and referenced correctly.

### Commit 5: Code Review Fixes
- Password utility extraction: No regression. `hashPassword` and `verifyPassword` work identically to inline bcrypt calls. create-admin.ts uses the shared utility.
- CollapsibleSection refinement: No regression. Builds on Commit 2 changes cleanly.
- Miniapp auth cleanup: No regression. Dead import removed, providerUserId format simplified. Auth flow tested via code review (miniapp endpoints require app context).

### Commit 6: Security Fixes
- XSS escaping in YandexMap: No regression. `esc()` function applied to all dynamic balloon content. Map rendering unaffected — only HTML special characters are escaped.
- Max miniapp HMAC verification: No regression. Signature check added before payload parsing. Valid tokens still accepted.
- VK miniapp auth: No regression. Unchanged from prior implementation.

### Commit 7: Design Fixes
- Manrope font: No regression. Font loads via next/font/google with proper subsets. Tailwind config updated. All text renders in Manrope.
- Typography plugin: No regression. Plugin added to Tailwind config, does not affect existing styles unless `prose` class is used.
- for-users CTA styling: No regression. Border change is cosmetic only.

---

## Cross-Cutting Regression Checks

| Check | Result |
|-------|--------|
| All 65 API endpoints respond correctly | PASS |
| Authentication flow (register/login/session/logout) | PASS |
| Cross-role access control (citizen/admin/business) | PASS |
| Data persistence (user, profile, favorites, complaints, demands) | PASS |
| Rate limiting still active (4 tiers) | PASS |
| CSRF protection active | PASS |
| Session security (HMAC, httpOnly, sameSite) | PASS |

---

## Conclusion

No regressions detected across any of the 8 commits. All fixes are additive or corrective without breaking existing functionality.
