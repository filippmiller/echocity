import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrismaClient, type MockPrismaClient } from '../mocks/prisma'

let mockPrisma: MockPrismaClient

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

import { getPersonalizedOffers, getForYouSection } from '@/modules/recommendations/engine'

describe('recommendations/engine', () => {
  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
    vi.clearAllMocks()
  })

  function makeOffer(overrides: Record<string, any> = {}) {
    return {
      id: overrides.id ?? 'offer-1',
      title: overrides.title ?? 'Test Offer',
      subtitle: overrides.subtitle ?? null,
      offerType: overrides.offerType ?? 'PERCENT_DISCOUNT',
      visibility: overrides.visibility ?? 'PUBLIC',
      benefitType: overrides.benefitType ?? 'PERCENT',
      benefitValue: overrides.benefitValue ?? 10,
      imageUrl: overrides.imageUrl ?? null,
      endAt: overrides.endAt ?? null,
      redemptionChannel: overrides.redemptionChannel ?? 'IN_STORE',
      merchantId: overrides.merchantId ?? 'merchant-1',
      branchId: overrides.branchId ?? 'branch-1',
      createdAt: overrides.createdAt ?? new Date(),
      branch: {
        id: overrides.branchId ?? 'branch-1',
        title: overrides.branchTitle ?? 'Test Branch',
        address: overrides.branchAddress ?? '123 Test St',
        city: overrides.city ?? 'Moscow',
        placeType: overrides.placeType ?? 'RESTAURANT',
      },
      merchant: {
        id: overrides.merchantId ?? 'merchant-1',
        name: overrides.merchantName ?? 'Test Merchant',
      },
      limits: overrides.limits ?? null,
    }
  }

  describe('scoring logic', () => {
    it('scores higher for offers matching user preferred business types (+10)', async () => {
      // User has redeemed from RESTAURANT places
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([
          { merchantId: 'merchant-1', offerId: 'offer-old', branch: { placeType: 'RESTAURANT' } },
        ]) // buildPreferenceProfile - recent redemptions
        .mockResolvedValueOnce([]) // todayRedemptions

      mockPrisma.favorite.findMany.mockResolvedValue([])

      const restaurantOffer = makeOffer({ id: 'rest-1', placeType: 'RESTAURANT', benefitValue: 10 })
      const cafeOffer = makeOffer({ id: 'cafe-1', placeType: 'CAFE', benefitValue: 10 })

      mockPrisma.offer.findMany.mockResolvedValue([restaurantOffer, cafeOffer])

      const results = await getPersonalizedOffers('u1', 'Moscow', 10)

      // Restaurant offer should score higher (type match +10)
      const restScore = results.find((r) => r.id === 'rest-1')!.score
      const cafeScore = results.find((r) => r.id === 'cafe-1')!.score
      expect(restScore).toBeGreaterThan(cafeScore)
    })

    it('scores higher for returning merchant offers (+5)', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([
          { merchantId: 'merchant-A', offerId: 'old', branch: { placeType: 'CAFE' } },
        ])
        .mockResolvedValueOnce([])

      mockPrisma.favorite.findMany.mockResolvedValue([])

      const returningOffer = makeOffer({ id: 'ret-1', merchantId: 'merchant-A', placeType: 'SPA', benefitValue: 10 })
      const newOffer = makeOffer({ id: 'new-1', merchantId: 'merchant-B', placeType: 'SPA', benefitValue: 10 })

      mockPrisma.offer.findMany.mockResolvedValue([returningOffer, newOffer])

      const results = await getPersonalizedOffers('u1', 'Moscow', 10)

      const retScore = results.find((r) => r.id === 'ret-1')!.score
      const newScore = results.find((r) => r.id === 'new-1')!.score
      expect(retScore).toBeGreaterThan(newScore)
    })

    it('scores higher for favorite branch offers (+3)', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      mockPrisma.favorite.findMany.mockResolvedValue([
        { entityType: 'PLACE', entityId: 'branch-fav' },
      ])

      const favOffer = makeOffer({ id: 'fav-1', branchId: 'branch-fav', benefitValue: 10 })
      const normalOffer = makeOffer({ id: 'norm-1', branchId: 'branch-other', benefitValue: 10 })

      mockPrisma.offer.findMany.mockResolvedValue([favOffer, normalOffer])

      const results = await getPersonalizedOffers('u1', 'Moscow', 10)

      const favScore = results.find((r) => r.id === 'fav-1')!.score
      const normScore = results.find((r) => r.id === 'norm-1')!.score
      expect(favScore).toBeGreaterThan(normScore)
    })

    it('penalizes offers already redeemed today (-5)', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([]) // buildPreferenceProfile
        .mockResolvedValueOnce([{ offerId: 'redeemed-1' }]) // todayRedemptions

      mockPrisma.favorite.findMany.mockResolvedValue([])

      const redeemedOffer = makeOffer({ id: 'redeemed-1', benefitValue: 10 })
      const freshOffer = makeOffer({ id: 'fresh-1', benefitValue: 10 })

      mockPrisma.offer.findMany.mockResolvedValue([redeemedOffer, freshOffer])

      const results = await getPersonalizedOffers('u1', 'Moscow', 10)

      const redeemedScore = results.find((r) => r.id === 'redeemed-1')!.score
      const freshScore = results.find((r) => r.id === 'fresh-1')!.score
      expect(freshScore).toBeGreaterThan(redeemedScore)
    })

    it('boosts FLASH offers ending within 4 hours (+8)', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      mockPrisma.favorite.findMany.mockResolvedValue([])

      const soonEndAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      const flashOffer = makeOffer({
        id: 'flash-1',
        offerType: 'FLASH',
        endAt: soonEndAt,
        benefitValue: 10,
      })
      const regularOffer = makeOffer({
        id: 'regular-1',
        offerType: 'PERCENT_DISCOUNT',
        benefitValue: 10,
      })

      mockPrisma.offer.findMany.mockResolvedValue([flashOffer, regularOffer])

      const results = await getPersonalizedOffers('u1', 'Moscow', 10)

      const flashScore = results.find((r) => r.id === 'flash-1')!.score
      const regularScore = results.find((r) => r.id === 'regular-1')!.score
      expect(flashScore).toBeGreaterThan(regularScore)
    })

    it('results are sorted by score descending', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([
          { merchantId: 'merchant-A', offerId: 'old', branch: { placeType: 'RESTAURANT' } },
        ])
        .mockResolvedValueOnce([])

      mockPrisma.favorite.findMany.mockResolvedValue([
        { entityType: 'PLACE', entityId: 'branch-fav' },
      ])

      const offers = [
        makeOffer({ id: 'low', placeType: 'SPA', merchantId: 'merchant-X', benefitValue: 5 }),
        makeOffer({ id: 'high', placeType: 'RESTAURANT', merchantId: 'merchant-A', branchId: 'branch-fav', benefitValue: 20 }),
        makeOffer({ id: 'mid', placeType: 'RESTAURANT', merchantId: 'merchant-B', benefitValue: 10 }),
      ]

      mockPrisma.offer.findMany.mockResolvedValue(offers)

      const results = await getPersonalizedOffers('u1', 'Moscow', 10)

      // Verify descending score order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score)
      }

      // The highest scored should be first
      expect(results[0].id).toBe('high')
    })

    it('respects the limit parameter', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      mockPrisma.favorite.findMany.mockResolvedValue([])

      const offers = Array.from({ length: 10 }, (_, i) =>
        makeOffer({ id: `offer-${i}`, benefitValue: (i + 1) * 5 }),
      )

      mockPrisma.offer.findMany.mockResolvedValue(offers)

      const results = await getPersonalizedOffers('u1', 'Moscow', 3)
      expect(results.length).toBe(3)
    })
  })

  describe('getForYouSection', () => {
    it('returns personalized offers when user is logged in', async () => {
      mockPrisma.redemption.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      mockPrisma.favorite.findMany.mockResolvedValue([])
      mockPrisma.offer.findMany.mockResolvedValue([makeOffer()])

      const result = await getForYouSection('u1', 'Moscow')
      expect(result.isPersonalized).toBe(true)
    })

    it('returns trending (non-personalized) offers when user is null', async () => {
      // getTrendingOffers path — groupBy returns empty, falls back to newest
      mockPrisma.redemption.groupBy.mockResolvedValue([])
      mockPrisma.offer.findMany.mockResolvedValue([makeOffer()])

      const result = await getForYouSection(null, 'Moscow')
      expect(result.isPersonalized).toBe(false)
    })
  })
})
