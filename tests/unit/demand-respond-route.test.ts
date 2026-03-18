import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetSession,
  mockDemandRequestFindUnique,
  mockBusinessFindMany,
  mockPlaceFindFirst,
  mockOfferFindFirst,
  mockDemandResponseFindUnique,
  mockDemandResponseCreate,
  mockDemandRequestUpdateMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockDemandRequestFindUnique: vi.fn(),
  mockBusinessFindMany: vi.fn(),
  mockPlaceFindFirst: vi.fn(),
  mockOfferFindFirst: vi.fn(),
  mockDemandResponseFindUnique: vi.fn(),
  mockDemandResponseCreate: vi.fn(),
  mockDemandRequestUpdateMany: vi.fn(),
  mockTransaction: vi.fn(),
}))

vi.mock('@/modules/auth/session', () => ({
  getSession: mockGetSession,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    demandRequest: {
      findUnique: mockDemandRequestFindUnique,
    },
    business: {
      findMany: mockBusinessFindMany,
    },
    place: {
      findFirst: mockPlaceFindFirst,
    },
    offer: {
      findFirst: mockOfferFindFirst,
    },
    demandResponse: {
      findUnique: mockDemandResponseFindUnique,
    },
    $transaction: mockTransaction,
  },
}))

import { POST } from '@/app/api/business/demand/respond/route'

describe('business demand respond route', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetSession.mockResolvedValue({
      userId: 'owner-1',
      email: 'owner@example.com',
      role: 'BUSINESS_OWNER',
    })

    mockDemandRequestFindUnique.mockResolvedValue({
      id: 'demand-1',
      placeId: null,
      status: 'COLLECTING',
    })

    mockBusinessFindMany.mockResolvedValue([{ id: 'merchant-1' }])
    mockPlaceFindFirst.mockResolvedValue(null)
    mockOfferFindFirst.mockResolvedValue(null)
    mockDemandResponseFindUnique.mockResolvedValue(null)
    mockDemandResponseCreate.mockResolvedValue({
      id: 'response-1',
      demandRequestId: 'demand-1',
      merchantId: 'merchant-1',
      status: 'PENDING',
    })
    mockDemandRequestUpdateMany.mockResolvedValue({ count: 0 })
    mockTransaction.mockImplementation(async (callback: any) => callback({
      demandResponse: {
        create: mockDemandResponseCreate,
      },
      demandRequest: {
        updateMany: mockDemandRequestUpdateMany,
      },
    }))
  })

  it('creates a response when demand is already COLLECTING', async () => {
    const request = new NextRequest('http://localhost/api/business/demand/respond', {
      method: 'POST',
      body: JSON.stringify({
        demandRequestId: 'demand-1',
        message: 'We can help.',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.response.id).toBe('response-1')
    expect(mockDemandResponseCreate).toHaveBeenCalledWith({
      data: {
        demandRequestId: 'demand-1',
        merchantId: 'merchant-1',
        message: 'We can help.',
        offerId: null,
        status: 'PENDING',
      },
    })
    expect(mockDemandRequestUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'demand-1',
        status: 'OPEN',
      },
      data: {
        status: 'COLLECTING',
      },
    })
  })

  it('returns 409 when the same merchant already responded', async () => {
    mockDemandResponseFindUnique.mockResolvedValueOnce({ id: 'existing-response' })

    const request = new NextRequest('http://localhost/api/business/demand/respond', {
      method: 'POST',
      body: JSON.stringify({
        demandRequestId: 'demand-1',
        message: 'duplicate',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({ error: 'You have already responded to this demand' })
    expect(mockTransaction).not.toHaveBeenCalled()
  })
})
