# Observability & Uptime

This document describes the production observability plumbing that is checked into the repo. External alert routing (Sentry project, uptime monitor, on-call channel) is **not** verified by this codebase and must be configured separately.

## Health endpoint

- **URL**: `GET https://<app>/api/health`
- **Behavior**:
  - Returns `200 { ok: true, durationMs }` when the database is reachable.
  - Returns `503 { ok: false, durationMs }` when the database is down.
  - Detailed checks are only returned to authenticated `ADMIN` sessions.
- **Monitoring recommendation**: Point an external uptime monitor (e.g. UptimeRobot, Pingdom, Better Uptime) at this endpoint with a 1–5 minute interval. Alert when status is not 200 or `ok` is false.

## Readiness endpoint

- **URL**: `GET https://<app>/api/admin/readiness` (admin only)
- **Behavior**: Reports missing required environment variables, migration status, and whether Sentry DSN is configured.

## Error capture (Sentry)

Sentry is initialized only when a DSN is present. No DSN means the app runs normally without error reporting.

### Required env vars

- `SENTRY_DSN` — server/edge DSN.
- `NEXT_PUBLIC_SENTRY_DSN` — client DSN (can be the same as `SENTRY_DSN`).
- `NEXT_PUBLIC_BUILD_SHA` or `BUILD_SHA` — release tag (defaults to `dev`).
- `NODE_ENV` — environment tag.
- `SENTRY_TRACES_SAMPLE_RATE` — optional sample rate for performance traces (default `0.1`).

### Files

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.ts` wraps the config with `withSentryConfig` only when `@sentry/nextjs` is installed.

## Critical failure logs

Structured `logger.error` events are emitted for operator alerting:

- `auth.login.critical_failure` — emitted from `app/api/auth/login/route.ts` on `INVALID_CREDENTIALS` or `ACCOUNT_LOCKED` responses. Route to the on-call channel when the rate spikes.
- `payment.critical_failure` — emitted from `app/api/payments/yokassa/webhook/route.ts` and `modules/payments/yokassa.ts` on invalid signatures, missing webhook secrets in production, and `payment.canceled` events that record a `FAILED` payment.

These logs go to stdout/stderr by default and should be scraped by your log aggregator (e.g. Coolify/Loki, Datadog, CloudWatch).

## Alert routing (external setup required)

1. **Sentry alerts**: Create a Sentry project, set `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, and configure alert rules to post to the on-call channel (e.g. Telegram, Slack, PagerDuty) for new issues or error-rate spikes.
2. **Uptime alerts**: Configure an external monitor against `/api/health` and alert when it returns non-200.
3. **Auth/payment critical logs**: Configure your log aggregator to watch for `auth.login.critical_failure` and `payment.critical_failure` and route them to the on-call channel.

## Triage runbook

1. **Health endpoint down**: Check database connectivity, `DATABASE_URL`, and recent deployments. If the public endpoint is down but the app loads, verify the uptime monitor URL and headers.
2. **Sentry alert spike**: Look at the release tag (`NEXT_PUBLIC_BUILD_SHA`). If the spike correlates with a deploy, consider rolling back.
3. **`auth.login.critical_failure` spike**: Check for brute-force attempts or lockouts. Verify rate limits and consider temporarily blocking offending IPs.
4. **`payment.critical_failure`**: Verify `YOKASSA_WEBHOOK_SECRET` is set in production, check webhook signature logic, and confirm payment records in the database match YoKassa dashboard.
5. **Readiness incomplete**: Use `/api/admin/readiness` to identify missing env vars and run `prisma migrate deploy` if migrations are pending.

## Honest limitations

- The codebase cannot verify that Sentry, uptime monitors, or on-call channels are actually configured.
- Critical logs are written to stdout/stderr; alerting depends on external log scraping and routing.
- Health checks are synchronous HTTP probes; they do not cover background jobs unless those jobs update a heartbeat.
