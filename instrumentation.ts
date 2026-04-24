// Tracks whether we have already installed unhandled-error hooks so HMR-driven
// re-registrations in dev don't attach duplicate listeners.
let globalHooksInstalled = false

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  installGlobalErrorHooks()

  const { initCronJobs } = await import('@/lib/cron')
  initCronJobs()

  // Seed gamification data (idempotent upserts)
  const { seedMissionsAndBadges } = await import('@/modules/gamification/seed-missions')
  seedMissionsAndBadges().catch((e) => {
    console.error('Failed to seed missions/badges:', e)
  })
}

function installGlobalErrorHooks() {
  if (globalHooksInstalled) return
  globalHooksInstalled = true

  const report = async (kind: 'unhandledRejection' | 'uncaughtException', err: unknown) => {
    const payload = {
      at: 'process',
      kind,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      ts: new Date().toISOString(),
    }
    // Structured-log first — always succeeds, cheapest signal.
    console.error(JSON.stringify(payload))
    // Then best-effort report to GlitchTip / Sentry-compatible collector.
    try {
      const mod = await import('@/lib/observability')
      if (typeof (mod as any).reportError === 'function') {
        await (mod as any).reportError(err, { kind })
      }
    } catch {
      // Swallow: telemetry must not shadow the original fault.
    }
  }

  process.on('unhandledRejection', (reason) => {
    void report('unhandledRejection', reason)
  })

  process.on('uncaughtException', (err) => {
    void report('uncaughtException', err)
    // 15s graceful-shutdown window so in-flight HTTP/DB work finishes,
    // then exit non-zero so the process supervisor (pm2 / Coolify / systemd) restarts us.
    setTimeout(() => {
      console.error(
        JSON.stringify({
          at: 'process',
          kind: 'shutdown',
          reason: 'uncaughtException',
          ts: new Date().toISOString(),
        }),
      )
      process.exit(1)
    }, 15_000).unref()
  })
}
