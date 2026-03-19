import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockQueryRaw } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}))

describe('health route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.NODE_ENV = 'production'
    process.env.SESSION_SECRET = 'session-secret'
    process.env.NEXTAUTH_SECRET = 'redemption-secret'
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public'
    process.env.VAPID_PRIVATE_KEY = 'private'
    process.env.VAPID_SUBJECT = 'mailto:ops@example.com'
  })

  it('returns 200 when required checks are healthy', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const { GET } = await import('@/app/api/health/route')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.checks.database).toBe(true)
    expect(body.checks.sessionSecret).toBe(true)
    expect(body.checks.redemptionSecret).toBe(true)
    expect(body.checks.pushConfigured).toBe(true)
  })

  it('returns 503 when database is unavailable', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('db down'))
    const { GET } = await import('@/app/api/health/route')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.ok).toBe(false)
    expect(body.checks.database).toBe(false)
    expect(body.databaseError).toContain('db down')
  })
})
