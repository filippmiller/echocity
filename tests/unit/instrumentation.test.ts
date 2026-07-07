import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInit = vi.fn()
const mockCaptureRequestError = vi.fn()

vi.mock('@sentry/nextjs', () => ({
  init: mockInit,
  captureRequestError: mockCaptureRequestError,
}))

describe('instrumentation', () => {
  beforeEach(() => {
    vi.resetModules()
    mockInit.mockClear()
    mockCaptureRequestError.mockClear()
    delete process.env.SENTRY_DSN
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    delete process.env.NEXT_RUNTIME
  })

  async function loadInstrumentation() {
    const mod = await import('@/instrumentation')
    return mod
  }

  it('imports server config when NEXT_RUNTIME is nodejs', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/0'
    const { register } = await loadInstrumentation()
    await register()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('imports edge config when NEXT_RUNTIME is edge', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/0'
    const { register } = await loadInstrumentation()
    await register()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('does not initialize Sentry when SENTRY_DSN is missing', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    const { register } = await loadInstrumentation()
    await register()
    expect(mockInit).not.toHaveBeenCalled()
  })

  it('exports onRequestError wired to Sentry.captureRequestError', async () => {
    const { onRequestError } = await loadInstrumentation()
    expect(onRequestError).toBe(mockCaptureRequestError)
  })
})
