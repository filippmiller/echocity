import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    offer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    collection: {
      upsert: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

import {
  CURATED_COLLECTIONS,
  getCuratedCollections,
  getCuratedCollectionBySlug,
  upsertCuratedCollections,
  getLunchOffers,
  getTonightOffers,
  getAfterWorkOffers,
} from '@/modules/collections/curated'

describe('modules/collections/curated', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('CURATED_COLLECTIONS', () => {
    it('defines three curated collection configs', () => {
      expect(Object.keys(CURATED_COLLECTIONS)).toHaveLength(3)
      expect(CURATED_COLLECTIONS.coffee.slug).toBe('coffee-nearby')
      expect(CURATED_COLLECTIONS.lunch.slug).toBe('lunch-under-500')
      expect(CURATED_COLLECTIONS.evening.slug).toBe('tonight-plans')
    })
  })

  describe('getCuratedCollections', () => {
    it('returns collections with live offer counts', async () => {
      mockPrisma.offer.findMany
        .mockResolvedValueOnce([{ id: 'offer-1' }, { id: 'offer-2' }])
        .mockResolvedValueOnce([{ id: 'offer-3' }])
        .mockResolvedValueOnce([])

      const result = await getCuratedCollections('Санкт-Петербург')

      expect(result).toHaveLength(2)
      expect(result[0].slug).toBe('coffee-nearby')
      expect(result[0].itemCount).toBe(2)
      expect(result[1].slug).toBe('lunch-under-500')
      expect(result[1].itemCount).toBe(1)
      expect(mockPrisma.offer.findMany).toHaveBeenCalledTimes(3)
    })

    it('filters out empty collections', async () => {
      mockPrisma.offer.findMany.mockResolvedValue([])
      const result = await getCuratedCollections()
      expect(result).toHaveLength(0)
    })
  })

  describe('getCuratedCollectionBySlug', () => {
    it('resolves offers for a known curated slug', async () => {
      mockPrisma.offer.findMany
        .mockResolvedValueOnce([{ id: 'offer-1' }]) // coffee count
        .mockResolvedValueOnce([]) // lunch count
        .mockResolvedValueOnce([]) // evening count
        .mockResolvedValueOnce([
          {
            id: 'offer-1',
            title: 'Кофе',
            branch: { title: 'Кофейня', address: 'Невский 1', city: 'Санкт-Петербург' },
            merchant: { name: 'Кофейня' },
            limits: null,
            _count: { redemptions: 0, offerReviews: 0 },
          },
        ])

      const result = await getCuratedCollectionBySlug('coffee-nearby')

      expect(result.title).toBe('Кофе рядом')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].data.id).toBe('offer-1')
    })

    it('throws for an unknown slug', async () => {
      mockPrisma.offer.findMany.mockResolvedValue([])
      await expect(getCuratedCollectionBySlug('unknown')).rejects.toThrow('Unknown curated collection slug')
    })
  })

  describe('upsertCuratedCollections', () => {
    it('upserts all three curated collections', async () => {
      mockPrisma.collection.upsert.mockResolvedValue({})
      await upsertCuratedCollections()
      expect(mockPrisma.collection.upsert).toHaveBeenCalledTimes(3)
      const calls = mockPrisma.collection.upsert.mock.calls
      expect(calls.some((c: any) => c[0].where.slug === 'coffee-nearby')).toBe(true)
      expect(calls.some((c: any) => c[0].where.slug === 'lunch-under-500')).toBe(true)
      expect(calls.some((c: any) => c[0].where.slug === 'tonight-plans')).toBe(true)
    })
  })

  describe('time-of-day helpers', () => {
    const makeOffer = (overrides: any = {}) => ({
      id: 'offer-1',
      title: 'Offer',
      subtitle: null,
      offerType: 'REGULAR',
      visibility: 'PUBLIC',
      benefitType: 'PERCENT',
      benefitValue: 10,
      imageUrl: null,
      endAt: null,
      schedules: [],
      blackoutDates: [],
      branch: {
        id: 'branch-1',
        title: 'Branch',
        address: 'Address',
        city: 'Санкт-Петербург',
        lat: null,
        lng: null,
        nearestMetro: null,
        placeType: 'CAFE',
      },
      merchant: { id: 'merchant-1', name: 'Merchant', isVerified: false },
      limits: null,
      _count: { redemptions: 0, offerReviews: 0 },
      ...overrides,
    })

    it('getLunchOffers returns active lunch offers on weekdays 12:00–15:00', async () => {
      // Monday 13:00 MSK → 10:00 UTC
      vi.setSystemTime(new Date('2024-01-08T10:00:00Z'))
      mockPrisma.offer.findMany.mockResolvedValue([
        makeOffer({
          id: 'lunch-1',
          schedules: [{ weekday: 0, startTime: '12:00', endTime: '15:00' }],
        }),
      ])

      const result = await getLunchOffers('Санкт-Петербург')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('lunch-1')
      expect(mockPrisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branch: expect.objectContaining({
              city: 'Санкт-Петербург',
              OR: [
                { placeType: { in: ['CAFE', 'RESTAURANT'] } },
                { category: { in: ['CAFE', 'RESTAURANT'] } },
              ],
            }),
          }),
        })
      )
    })

    it('getLunchOffers returns empty outside the lunch window', async () => {
      // Monday 23:00 MSK → 20:00 UTC
      vi.setSystemTime(new Date('2024-01-08T20:00:00Z'))
      mockPrisma.offer.findMany.mockResolvedValue([])

      const result = await getLunchOffers()

      expect(result).toHaveLength(0)
      expect(mockPrisma.offer.findMany).not.toHaveBeenCalled()
    })

    it('getTonightOffers returns active evening offers on weekdays 17:00–23:00', async () => {
      // Thursday 19:00 MSK → 16:00 UTC
      vi.setSystemTime(new Date('2024-01-11T16:00:00Z'))
      mockPrisma.offer.findMany.mockResolvedValue([
        makeOffer({
          id: 'tonight-1',
          branch: { ...makeOffer().branch, placeType: 'BAR' },
          schedules: [{ weekday: 3, startTime: '17:00', endTime: '23:00' }],
        }),
      ])

      const result = await getTonightOffers('Санкт-Петербург', 'tsentralnyy')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('tonight-1')
      expect(mockPrisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branch: expect.objectContaining({
              city: 'Санкт-Петербург',
              district: { slug: 'tsentralnyy' },
            }),
          }),
        })
      )
    })

    it('getAfterWorkOffers filters out offers outside Mon–Fri', async () => {
      // Saturday 18:00 MSK → 15:00 UTC
      vi.setSystemTime(new Date('2024-01-13T15:00:00Z'))
      mockPrisma.offer.findMany.mockResolvedValue([])

      const result = await getAfterWorkOffers('Санкт-Петербург')

      expect(result).toHaveLength(0)
      expect(mockPrisma.offer.findMany).not.toHaveBeenCalled()
    })

    it('excludes offers that are not active now', async () => {
      // Tuesday 18:00 MSK → 15:00 UTC
      vi.setSystemTime(new Date('2024-01-09T15:00:00Z'))
      mockPrisma.offer.findMany.mockResolvedValue([
        makeOffer({
          id: 'inactive-1',
          schedules: [{ weekday: 1, startTime: '12:00', endTime: '15:00' }],
        }),
      ])

      const result = await getAfterWorkOffers()

      expect(result).toHaveLength(0)
    })

    it('excludes offers on blackout dates', async () => {
      // Wednesday 18:00 MSK → 15:00 UTC
      vi.setSystemTime(new Date('2024-01-10T15:00:00Z'))
      mockPrisma.offer.findMany.mockResolvedValue([
        makeOffer({
          id: 'blackout-1',
          branch: { ...makeOffer().branch, placeType: 'BAR' },
          schedules: [{ weekday: 2, startTime: '17:00', endTime: '23:00' }],
          blackoutDates: [{ date: new Date('2024-01-10T15:00:00Z') }],
        }),
      ])

      const result = await getTonightOffers()

      expect(result).toHaveLength(0)
    })
  })
})
