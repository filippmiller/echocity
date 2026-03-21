import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockQueryRaw } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
}))

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}))

vi.mock('@/modules/auth/session', () => ({
  getSession: mockGetSession,
}))

function makeRequest(opts?: { withSession?: boolean }) {
  const headers: Record<string, string> = {}
  if (opts?.withSession) {
    headers.cookie = 'cityecho_session=fake-session-value'
  }
  return new NextRequest('http://localhost:3000/api/health', { headers })
}

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
    mockGetSession.mockResolvedValue(null)
  })

  it('returns minimal response for unauthenticated requests', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const { GET } = await import('@/app/api/health/route')

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.durationMs).toBeDefined()
    // Should NOT expose detailed checks to public
    expect(body.checks).toBeUndefined()
    expect(body.environment).toBeUndefined()
  })

  it('returns detailed response for admin users', async () => {
    mockGetSession.mockResolvedValue({ userId: '1', role: 'ADMIN', email: 'a@b.com' })
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const { GET } = await import('@/app/api/health/route')

    const response = await GET(makeRequest({ withSession: true }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.checks.database).toBe(true)
    expect(body.checks.sessionSecret).toBe(true)
    expect(body.checks.redemptionSecret).toBe(true)
    expect(body.checks.pushConfigured).toBe(true)
    expect(body.environment).toBeDefined()
  })

  it('returns 503 when database is unavailable', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('db down'))
    const { GET } = await import('@/app/api/health/route')

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.ok).toBe(false)
  })

  it('returns 503 for admin when session secret is missing', async () => {
    mockGetSession.mockResolvedValue({ userId: '1', role: 'ADMIN', email: 'a@b.com' })
    vi.stubEnv('SESSION_SECRET', '')
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const { GET } = await import('@/app/api/health/route')

    const response = await GET(makeRequest({ withSession: true }))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.ok).toBe(false)
    expect(body.checks.sessionSecret).toBe(false)
    expect(body.checks.database).toBe(true)
  })
})
