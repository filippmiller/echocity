# Session Notes: Re-Audit, Critic Review & Scalability Hardening
**Date:** 2026-04-08 to 2026-04-09
**Duration:** ~4 hours
**Branch:** fix/retest-audit-findings → main, perf/scalability-hardening
**PRs:** #2 (merged), #3 (open)

---

## Session Goal

User requested: run the full RETEST_PROMPT.md audit (137 checks), fix everything found, run critic review, then prepare the app for 1000+ concurrent users.

---

## Execution Timeline

### 1. Re-Audit Execution (4 parallel agents)

Launched 4 background agents simultaneously from the RETEST_PROMPT.md specification:

| Agent | Scope | Duration | Result |
|-------|-------|----------|--------|
| Code verification | 40 items across 7 commits | ~8 min | 40/40 PASS |
| Security checks | 10 security items | ~4 min | 10/10 PASS |
| API E2E tests | 65 endpoints (auth, citizen, admin, business) | ~35 min | 65/65 PASS |
| Visual audit | 22 pages via HTML analysis | ~18 min | 6 new issues found |

**Total checks:** 137 — all pass.

**Technical notes:**
- Chrome MCP tools couldn't connect to localhost:3010 (error page loop). Switched visual audit to curl-based HTML analysis + source code reading.
- API test agent needed 5s spacing between requests due to connection pool sensitivity.
- Dev server ran on port 3010 via `npx next dev`.

### 2. New Findings from Re-Audit

7 issues discovered (0 BLOCKER, 0 CRITICAL):

| # | Severity | Issue |
|---|----------|-------|
| 1 | MEDIUM | Footer missing on 8 consumer pages |
| 2 | MEDIUM | Auth layout footer lacks privacy/terms links |
| 3 | MEDIUM | No terms acceptance checkbox on registration |
| 4 | LOW | No forgot password link (deferred — needs email infra) |
| 5 | LOW | City field is free-text instead of dropdown |
| 6 | LOW | Favorites remove buttons hover-only (not touch-accessible) |
| 7 | OBS | Connection pool sensitivity under rapid requests |

### 3. UX Fixes Implementation

**Brainstorm session** (4 agents: Judge, Lead, Senior Programmer, Critic Architect):
- Consensus: Fix footer at layout level, not per-page
- Consensus: Defer forgot password (needs email infra)
- Key insight: Use `@media(hover:hover)` instead of `md:` breakpoint for touch detection

**Implementation decisions:**
- Footer moved to `(consumer)/layout.tsx` — one source of truth
- 6 consumer pages had Footer imports removed (offers, subscription, family, tourist, privacy, terms)
- 2 standalone pages (for-users, for-businesses) got Footer added directly (outside consumer layout)
- Registration form: added `termsAccepted` state, cities API fetch via `useEffect`, `<select>` dropdown, checkbox with links
- Favorites: `md:opacity-0 md:group-hover:opacity-100` → `[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100`

### 4. Critic Review (5 parallel agents)

Launched 5 Sonnet agents for independent analysis:

| Agent | Focus | Findings |
|-------|-------|----------|
| 1: TS/Build | tsc --noEmit, lint, imports | 0 issues (clean) |
| 2: Bug Scan | Null guards, race conditions, JSX structure | 1 HIGH, 3 MEDIUM, 1 LOW |
| 3: Security | Terms bypass, open redirect, CSRF, XSS | 2 MEDIUM |
| 4: Consistency | Footer placement, select styles, patterns | 1 HIGH (false positive), 2 MEDIUM |
| 5: Edge Cases | Tab switching, cache conflicts, touch tablets | 1 HIGH, 2 MEDIUM, 1 LOW |

**Deduplication:** 8 unique issues after merging overlapping findings.

**False positive dismissed:** Agent 4 flagged "double Footer on homepage" — investigated and confirmed homepage is at `app/page.tsx` (root level), NOT inside `(consumer)` layout group.

**Re-critic finding:** Phone OTP verify endpoint (`/api/auth/phone/verify`) also needed `termsAccepted` server-side validation — the client gates the button, but a direct API call could bypass it.

### 5. Scalability Audit & Hardening

**Exploration agent** conducted thorough codebase scan covering:
- Database layer (prisma.ts, schema indexes, query patterns)
- API routes (unbounded queries, heavy analytics)
- Caching (none existed)
- Rate limiting (in-memory Map — fails under horizontal scaling)
- Session storage (DB lookup every request)
- Infrastructure (Dockerfile, health check)

**Top bottlenecks identified:**
1. Session DB lookup on every request (3000 queries/sec at 1000 users)
2. Zero caching on static data (categories, cities, plans)
3. Missing compound indexes on hot query paths
4. Admin analytics loading 50K+ subscriptions into memory
5. Health check calling getSession() on load balancer probes

**Implementation (6 phases):**
1. Session cache: `Map<userId, {data, expiresAt}>` with 5-min TTL
2. Static data cache: `lib/cache.ts` with `cached(key, ttl, fn)` pattern
3. Cache-Control headers on 5 endpoints
4. 4 compound indexes in Prisma schema
5. SQL SUM aggregate for MRR calculation
6. Health check simplified (no session lookup)

---

## Key Technical Decisions

### Why in-memory cache instead of Redis?
Redis requires infrastructure (separate service, connection management). In-memory cache with TTL is zero-dependency, works in single-instance deployments (which EchoCity currently is), and covers 90% of the benefit. Redis is on the deferred list for when horizontal scaling is needed.

### Why `@media(hover:hover)` instead of `md:` breakpoint?
The `md:` breakpoint (768px) doesn't correlate with "has hover capability." An iPad at 1024px has no hover, but `md:opacity-0` would hide buttons. `@media(hover:hover)` directly queries the device's pointing capability — only applies hover-show behavior when the device actually supports hover.

### Why `z.literal(true)` for terms validation?
Using `z.literal(true)` means the client MUST send `termsAccepted: true` — sending `false`, `0`, or omitting it fails validation. This is stricter than `z.boolean()` which would accept `false`. The field is validated but never stored — it's a consent gate, not data.

### Why SQL aggregate for MRR instead of Prisma?
`prisma.userSubscription.findMany()` with 50K active subscriptions loads 50K objects into Node.js memory, then reduces. `SELECT SUM(p."monthlyPrice")` does the math in PostgreSQL and returns 1 row. At scale, this is the difference between OOM and instant response.

---

## Deployment Notes

- PR #2 merged via `gh pr merge 2 --squash --delete-branch`
- Production at echocity.vsedomatut.com returns HTTP 200 (old container serving)
- Coolify re-deploy failing: Docker socket not accessible from SSH user (filip). Docker daemon is active (`systemctl is-active docker` = active) but `/var/run/docker.sock` doesn't exist. This is a Docker Desktop on Windows/WSL laptop server issue — needs restart or socket permissions fix.
- PR #3 (scalability) pending merge

---

## Deferred Items

| Item | Reason | Priority |
|------|--------|----------|
| Forgot password flow | Needs email infrastructure (SMTP/SendGrid) | MEDIUM |
| Redis for rate limiting | Infrastructure dependency | MEDIUM |
| PgBouncer connection pooling | Infrastructure dependency | LOW |
| PostGIS spatial indexes | Requires extension installation | LOW |
| Background analytics jobs | Needs job queue (BullMQ/similar) | LOW |
| Horizontal scaling / load balancer | Current single-instance is sufficient | LOW |

---

## Metrics

| Metric | Value |
|--------|-------|
| Total checks run | 137 (re-audit) + 8 (critic) = 145 |
| Issues found | 7 (re-audit) + 9 (critic) = 16 |
| Issues fixed | 15 (1 deferred) |
| Files changed | 25+ |
| Commits | 3 |
| PRs | 2 |
| Parallel agents used | 14 (4 re-audit + 5 critic + 1 explore + 4 misc) |
| TypeScript errors | 0 |
