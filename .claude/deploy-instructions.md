# EchoCity — Deployment Instructions

> **⚠️ DEPLOY STATUS: BROKEN (as of 2026-04-09)**
> Both `https://echocity.vsedomatut.com/` and `/en` return HTTP 404.
> The Coolify container is running (domain resolves), but the app does not serve any routes.
> **Do not mark a deploy as successful until root cause is found.** Investigate: Next.js build output, Coolify reverse proxy routing, server logs.

## Quick Deploy

1. Push to `main` branch (Coolify auto-deploys)
2. Manual trigger:
   ```bash
   curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
     "https://coolify.vsedomatut.com/api/v1/deploy?uuid=ki5yt1xyoo1lgsbp5lv39p96&force=true"
   ```
3. Verify: `curl -s -o /dev/null -w "%{http_code}" https://echocity.vsedomatut.com/en`

## Build Command

```bash
npm run build   # prisma generate && next build (Next.js 15.5.13)
```

Requires these env vars even for local builds:
- `SESSION_SECRET` (min 32 chars)
- `NEXTAUTH_SECRET` (min 32 chars)
- `NEXTAUTH_URL`
- `DATABASE_URL`

## Deploy Target

| Field        | Value                                |
|--------------|--------------------------------------|
| Platform     | Laptop VPS via Coolify (vsedomatut)  |
| URL          | https://echocity.vsedomatut.com      |
| Coolify UUID | ki5yt1xyoo1lgsbp5lv39p96             |
| DB UUID      | b13rk5k1ix7mckiqotydobja (separate)  |
| Branch       | main                                 |
| Buildpack    | dockerfile (/Dockerfile)             |

## Environment Variables (names only)

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session signing secret (32+ chars)
- `NEXTAUTH_SECRET` — NextAuth.js secret (32+ chars)
- `NEXTAUTH_URL` — Canonical app URL

Optional:
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — Push notifications (warning if missing)

## Database

- PostgreSQL in separate Coolify resource
- User: `echocity`, DB: `echocity`
- Container: `b13rk5k1ix7mckiqotydobja`
- Access: `docker exec b13rk5k1ix7mckiqotydobja psql -U echocity -d echocity`
- Migrations: Prisma

## Verification Steps

1. Check app URL: `curl -s -o /dev/null -w "%{http_code}" https://echocity.vsedomatut.com/en`
2. SSH to server:
   ```bash
   ssh -o ProxyCommand="cloudflared access ssh --hostname ssh.vsedomatut.com" filip@ssh.vsedomatut.com
   ```
3. Container names: `ki5yt1xyoo1lgsbp5lv39p96-*`

## Known Issues (2026-04-09)

- Root path `/` returns 404 — may need route fix or redirect. `/en` also returns 404.
- Local build fails without SESSION_SECRET and NEXTAUTH_SECRET

## Troubleshooting

- **Build fails with SESSION_SECRET error**: Set both `SESSION_SECRET` and `NEXTAUTH_SECRET` as 32+ char strings
- **Multiple lockfile warning**: Set `outputFileTracingRoot` in `next.config.ts`
- **Push notifications warning**: Configure VAPID keys (non-blocking)

## Last Verified

- **Date**: 2026-04-09
- **Build**: PASSES (with dummy env vars)
- **Deploy**: REACHABLE (404 on root — needs investigation)
