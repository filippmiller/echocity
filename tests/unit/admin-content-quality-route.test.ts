import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetContentQualityReport, mockGetSession } = vi.hoisted(() => ({
  mockGetContentQualityReport: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock('@/modules/admin/content-quality', () => ({
  getContentQualityReport: mockGetContentQualityReport,
}))
vi.mock('@/modules/auth/session', () => ({ getSession: mockGetSession }))

import { GET } from '@/app/api/admin/content-quality/route'

function createRequest(search = ''): NextRequest {
  return new NextRequest(`http://localhost/api/admin/content-quality${search}`, { method: 'GET' })
}

const baseReport = {
  offersWithoutImages: { count: 0, items: [] },
  placesWithoutSchedule: { count: 0, items: [] },
  offersWithoutSavingsData: { count: 0, items: [] },
  pendingBusinesses: { count: 0, items: [] },
  emptyCityInventory: { count: 0, items: [] },
  checkedAt: new Date().toISOString(),
}

describe('GET /api/admin/content-quality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetContentQualityReport.mockResolvedValue(baseReport)
  })

  it('returns the report for an admin', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(baseReport)
    expect(mockGetContentQualityReport).toHaveBeenCalledWith(20)
  })

  it('respects the limit query parameter', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })

    const response = await GET(createRequest('?limit=50'))
    await response.json()

    expect(mockGetContentQualityReport).toHaveBeenCalledWith(50)
  })

  it('caps the limit at 100', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })

    const response = await GET(createRequest('?limit=500'))
    await response.json()

    expect(mockGetContentQualityReport).toHaveBeenCalledWith(100)
  })

  it('returns 401 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', role: 'CITIZEN' })

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
    expect(mockGetContentQualityReport).not.toHaveBeenCalled()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 500 when the report throws', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })
    mockGetContentQualityReport.mockRejectedValue(new Error('db down'))

    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toContain('качестве контента')
  })
})
