import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetSuspiciousReviewSignals, mockGetSession } = vi.hoisted(() => ({
  mockGetSuspiciousReviewSignals: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock('@/modules/reviews/antifraud', () => ({
  getSuspiciousReviewSignals: mockGetSuspiciousReviewSignals,
}))
vi.mock('@/modules/auth/session', () => ({ getSession: mockGetSession }))

import { GET } from '@/app/api/admin/reviews/suspicious/route'

function createRequest(search = ''): NextRequest {
  return new NextRequest(`http://localhost/api/admin/reviews/suspicious${search}`, {
    method: 'GET',
  })
}

const baseSignals = {
  rejectedPlaceReviews: { count: 0, items: [] },
  rejectedOfferReviews: { count: 0, items: [] },
  highVelocityUsers: { count: 0, items: [] },
  auditRejections: { count: 0, items: [] },
  webhookReviewFailures: { count: 0, items: [] },
  checkedAt: new Date().toISOString(),
}

describe('GET /api/admin/reviews/suspicious', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSuspiciousReviewSignals.mockResolvedValue(baseSignals)
  })

  it('returns suspicious signals for an admin', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(baseSignals)
    expect(mockGetSuspiciousReviewSignals).toHaveBeenCalledWith({
      velocityWindowHours: 24,
      velocityThreshold: 5,
      sampleLimit: 50,
    })
  })

  it('parses query parameters', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })

    const response = await GET(createRequest('?windowHours=12&threshold=3&limit=10'))
    await response.json()

    expect(mockGetSuspiciousReviewSignals).toHaveBeenCalledWith({
      velocityWindowHours: 12,
      velocityThreshold: 3,
      sampleLimit: 10,
    })
  })

  it('clamps out-of-range query parameters', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })

    const response = await GET(createRequest('?windowHours=0&threshold=200&limit=0'))
    await response.json()

    expect(mockGetSuspiciousReviewSignals).toHaveBeenCalledWith({
      velocityWindowHours: 1,
      velocityThreshold: 100,
      sampleLimit: 1,
    })
  })

  it('returns 401 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', role: 'CITIZEN' })

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
    expect(mockGetSuspiciousReviewSignals).not.toHaveBeenCalled()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 500 when signal aggregation throws', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })
    mockGetSuspiciousReviewSignals.mockRejectedValue(new Error('db down'))

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toContain('подозрительных отзывах')
  })
})
