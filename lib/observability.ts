/**
 * Observability stub — the v1 ship target is GlitchTip (self-hosted Sentry-compatible).
 *
 * This file exists now so static imports from `ErrorBoundary.tsx` and `instrumentation.ts`
 * resolve at type-check time. Sprint D.2 will replace the stub body with real wiring:
 *   - `@sentry/nextjs` client init against `NEXT_PUBLIC_GLITCHTIP_DSN`
 *   - server-side `captureException` + breadcrumb enrichment
 *   - requestId correlation pulled from AsyncLocalStorage (see Sprint C.3)
 *
 * For now, `reportError` is a JSON-stderr fallback so production still emits a
 * machine-parseable signal even before GlitchTip is live. Never throws.
 */

export type ReportContext = {
  /** e.g. "admin-shell", "consumer-checkout" — added as a tag on the event. */
  scope?: string
  /** React componentStack string when invoked from ErrorBoundary. */
  componentStack?: string
  /** "unhandledRejection" | "uncaughtException" when invoked from instrumentation. */
  kind?: string
  /** Freeform extra metadata. Must be JSON-serialisable. */
  [key: string]: unknown
}

export function reportError(err: unknown, ctx: ReportContext = {}): void {
  try {
    const payload = {
      at: 'observability',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
      ctx,
      ts: new Date().toISOString(),
    }
    console.error(JSON.stringify(payload))
  } catch {
    // Never let telemetry shadow the original fault.
  }
}

/**
 * Reserved for Sprint D.2 — breadcrumb trail for a request before a potential
 * error. No-op for now.
 */
export function addBreadcrumb(_message: string, _data?: Record<string, unknown>): void {
  // Intentionally empty — stub.
}

/**
 * Reserved for Sprint D.2 — tag the current request/user context so errors
 * reported downstream carry identity.
 */
export function setUserContext(_user: { id?: string; email?: string }): void {
  // Intentionally empty — stub.
}
