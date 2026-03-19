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
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SESSION_SECRET', 'session-secret')
    vi.stubEnv('NEXTAUTH_SECRET', 'redemption-secret')
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private')
    vi.stubEnv('VAPID_SUBJECT', 'mailto:ops@example.com')
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
    expect(body.databaseError).toBe('Connection failed')
  })

  it('exposes raw error in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockQueryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED 127.0.0.1:5432'))
    const { GET } = await import('@/app/api/health/route')

    const response = await GET()
    const body = await response.json()

    expect(body.databaseError).toContain('ECONNREFUSED')
  })

  it('returns 503 when session secret is missing', async () => {
    vi.stubEnv('SESSION_SECRET', '')
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const { GET } = await import('@/app/api/health/route')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.ok).toBe(false)
    expect(body.checks.sessionSecret).toBe(false)
    expect(body.checks.database).toBe(true)
  })
})
