import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPrisma, mockGetSession } = vi.hoisted(() => ({
  mockPrisma: {
    offerView: {
      create: vi.fn(),
    },
  },
  mockGetSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/modules/auth/session', () => ({ getSession: mockGetSession }))

import { POST } from '@/app/api/analytics/offer-view/route'

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/analytics/offer-view', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/analytics/offer-view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.offerView.create.mockResolvedValue({ id: 'view-1' })
  })

  it('tracks a view for an authenticated user', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', role: 'CITIZEN' })

    const response = await POST(createRequest({ offerId: 'offer-1', source: 'list' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockPrisma.offerView.create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer-1',
        userId: 'user-1',
        source: 'list',
      },
    })
  })

  it('tracks an anonymous view when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(createRequest({ offerId: 'offer-2' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockPrisma.offerView.create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer-2',
        userId: null,
        source: 'list',
      },
    })
  })

  it('returns 400 for invalid input', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(createRequest({ source: 'list' }))

    expect(response.status).toBe(400)
    expect(mockPrisma.offerView.create).not.toHaveBeenCalled()
  })
})
