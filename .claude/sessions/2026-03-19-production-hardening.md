# Session: Production Hardening — 2026-03-19

**Date**: 2026-03-19 05:00-05:30 UTC
**Agent**: Claude Opus 4.6 (picking up from Codex)
**Status**: Completed

## Context
Codex hit its usage limit mid-session while working on production readiness for echocity.filippmiller.com. It had completed:
- Demand-response bug fix (7479990)
- Health endpoint + env drift checker (e7cb025)
- .env.example docs (5f902b2)
- VAPID key generation and Coolify env sync
- Coolify env drift fix (NEXTAUTH_URL, NEXTAUTH_SECRET)
- Partial live matrix runs (145-148/150 with shared-state failures)

## Work Performed

### Phase 1: Clean Working Tree
- Added `playwright-report/` and `test-results/` to `.gitignore`
- Cleaned 56 dirty files from test artifacts
- **Commit**: `0448dba` — chore: gitignore test artifacts and clean working tree

### Phase 2: Fix Live Scenario Matrix (Root Cause)
- Identified root cause of persistent matrix failures: `ensureScenarioData()` was cleaning LOCAL database while API calls went to production — classic split-brain
- Added `REMOTE_DATABASE_URL` support to matrix runner with SSH tunnel approach
- Added pool timeout config for remote connections
- Established SSH tunnel to production postgres (port 54320 → Docker postgres container)
- Achieved **150/150** on live production matrix
- **Commit**: `a447877` — fix(matrix): use remote DB for live scenario cleanup

## Technical Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| SSH tunnel to Docker postgres IP | Direct and reliable, no need to expose ports on VPS | Could have exposed postgres port in Docker compose |
| `REMOTE_DATABASE_URL` env var | Clean separation, doesn't break local dev workflow | Could have auto-detected from BASE_URL |
| Pool timeout 30s for remote | SSH tunnel adds latency; default 10s was too tight | Could have increased connection_limit instead |
| Manual deploy stays as-is | Safer for production, webhook secrets all null | Could have configured GitHub webhooks |

## Testing Performed
- [x] Unit tests pass (167/167)
- [x] Live matrix 150/150 on production
- [x] Health endpoint returns 200 with all checks green
- [x] Env drift checker passes

## Commits
- `0448dba` — chore: gitignore test artifacts and clean working tree
- `a447877` — fix(matrix): use remote DB for live scenario cleanup

## Production Status
- Health: `GET /api/health → 200`, all checks green including pushConfigured
- Container: `e7cb025` running on Hetzner VPS
- Live matrix: 150/150
- Env drift: resolved (NEXTAUTH_URL, NEXTAUTH_SECRET, VAPID keys all synced)
