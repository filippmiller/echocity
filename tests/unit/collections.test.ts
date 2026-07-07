import { describe, it, expect, vi, beforeEach } from 'vitest'

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
} from '@/modules/collections/curated'

describe('modules/collections/curated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
