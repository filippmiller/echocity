'use client'

import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Optional override — e.g. admin shell wants a different fallback than consumer. */
  fallback?: ReactNode
  /** Scope tag attached to error reports so we can see which tree crashed. */
  scope?: string
}

type State = { hasError: boolean; digest?: string }

/**
 * Top-level client error boundary. Catches uncaught render errors from the
 * tree below it so we render a branded fallback instead of a raw Next.js
 * "Application error" screen, and reports the crash to GlitchTip
 * (loaded lazily so its absence never breaks the boundary itself).
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    // Lazy import — observability module may not exist yet in early sprints;
    // swallowing keeps the boundary functional even if telemetry is broken.
    void (async () => {
      try {
        const mod = await import('@/lib/observability')
        if (typeof (mod as { reportError?: unknown }).reportError === 'function') {
          await (mod as { reportError: (e: unknown, ctx?: unknown) => Promise<void> | void }).reportError(
            error,
            { scope: this.props.scope, componentStack: info.componentStack },
          )
        }
      } catch {
        // Deliberately empty.
      }
    })()
    // Always log to stderr in a shape a collector can ingest later.
    console.error(
      JSON.stringify({
        at: 'error-boundary',
        scope: this.props.scope ?? 'unscoped',
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        ts: new Date().toISOString(),
      }),
    )
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-12 text-center"
      >
        <h1 className="text-2xl font-semibold">Что-то пошло не так</h1>
        <p className="text-muted-foreground">
          Мы уже получили уведомление и разбираемся. Попробуйте обновить страницу или вернитесь через несколько минут.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              this.setState({ hasError: false })
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className="rounded-md border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Обновить
          </button>
          <a
            href="/offers"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            К предложениям
          </a>
        </div>
      </div>
    )
  }
}
