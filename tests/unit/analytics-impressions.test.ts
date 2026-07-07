import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    offerView: {
      create: vi.fn(),
    },
    offerSave: {
      createMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { trackOfferView, trackOfferSave } from '@/modules/analytics/impressions'

describe('analytics/impressions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks an offer view with userId and source', async () => {
    mockPrisma.offerView.create.mockResolvedValue({ id: 'view-1' })

    await trackOfferView('offer-1', { userId: 'user-1', source: 'detail' })

    expect(mockPrisma.offerView.create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer-1',
        userId: 'user-1',
        source: 'detail',
      },
    })
  })

  it('tracks an anonymous offer view', async () => {
    mockPrisma.offerView.create.mockResolvedValue({ id: 'view-2' })

    await trackOfferView('offer-2')

    expect(mockPrisma.offerView.create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer-2',
        userId: null,
        source: 'unknown',
      },
    })
  })

  it('tracks an offer save idempotently', async () => {
    mockPrisma.offerSave.createMany.mockResolvedValue({ count: 1 })

    await trackOfferSave('offer-1', { userId: 'user-1', source: 'favorite' })

    expect(mockPrisma.offerSave.createMany).toHaveBeenCalledWith({
      data: [
        {
          offerId: 'offer-1',
          userId: 'user-1',
          source: 'favorite',
        },
      ],
      skipDuplicates: true,
    })
  })
})
