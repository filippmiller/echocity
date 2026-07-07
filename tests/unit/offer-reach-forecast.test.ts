import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    offer: {
      findMany: vi.fn(),
    },
    offerView: {
      groupBy: vi.fn(),
    },
    offerSave: {
      groupBy: vi.fn(),
    },
    redemption: {
      groupBy: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import {
  forecastOfferReach,
  formatEstimateRange,
} from '@/modules/analytics/offer-reach-forecast'

describe('analytics/offer-reach-forecast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fallback when city or category is missing', async () => {
    const result = await forecastOfferReach({
      city: '',
      category: 'CAFE',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 10,
    })
    expect(result.basedOnHistory).toBe(false)
    expect(result.confidence).toBe('low')
    expect(result.estimatedViews).toBeNull()
    expect(result.explanation).toContain('Укажите город')
  })

  it('returns fallback when fewer than 3 similar offers exist', async () => {
    mockPrisma.offer.findMany.mockResolvedValue([{ id: 'offer-1' }])

    const result = await forecastOfferReach({
      city: 'Санкт-Петербург',
      category: 'CAFE',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 10,
    })

    expect(result.basedOnHistory).toBe(false)
    expect(result.confidence).toBe('low')
    expect(result.estimatedViews).toBeNull()
    expect(result.explanation).toContain('Недостаточно данных')
  })

  it('computes conservative forecast from historical averages', async () => {
    mockPrisma.offer.findMany.mockResolvedValue([
      { id: 'offer-1' },
      { id: 'offer-2' },
      { id: 'offer-3' },
    ])
    mockPrisma.offerView.groupBy.mockResolvedValue([
      { offerId: 'offer-1', _count: { id: 100 } },
      { offerId: 'offer-2', _count: { id: 200 } },
      { offerId: 'offer-3', _count: { id: 300 } },
    ])
    mockPrisma.offerSave.groupBy.mockResolvedValue([
      { offerId: 'offer-1', _count: { id: 10 } },
      { offerId: 'offer-2', _count: { id: 20 } },
      { offerId: 'offer-3', _count: { id: 30 } },
    ])
    mockPrisma.redemption.groupBy.mockResolvedValue([
      { offerId: 'offer-1', _count: { id: 5 } },
      { offerId: 'offer-2', _count: { id: 10 } },
      { offerId: 'offer-3', _count: { id: 15 } },
    ])

    const result = await forecastOfferReach({
      city: 'Санкт-Петербург',
      category: 'CAFE',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 10,
    })

    expect(result.basedOnHistory).toBe(true)
    expect(result.confidence).toBe('medium')
    // Averages: views=200, saves=20, redemptions=10; conservatism factor 0.7
    expect(result.estimatedViews).toBe(140)
    expect(result.estimatedSaves).toBe(14)
    expect(result.estimatedRedemptions).toBe(7)
    expect(result.explanation).toContain('3 похожих')
  })

  it('falls back to looser match when strict match has too few offers', async () => {
    mockPrisma.offer.findMany
      .mockResolvedValueOnce([{ id: 'offer-1' }]) // strict
      .mockResolvedValueOnce([
        { id: 'offer-1' },
        { id: 'offer-2' },
        { id: 'offer-3' },
      ]) // loose
    mockPrisma.offerView.groupBy.mockResolvedValue([])
    mockPrisma.offerSave.groupBy.mockResolvedValue([])
    mockPrisma.redemption.groupBy.mockResolvedValue([])

    const result = await forecastOfferReach({
      city: 'Санкт-Петербург',
      category: 'CAFE',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 10,
    })

    expect(result.basedOnHistory).toBe(true)
    expect(result.explanation).toContain('в той же категории и городе')
  })

  it('excludes merchant own offers when merchantId is provided', async () => {
    mockPrisma.offer.findMany.mockResolvedValue([
      { id: 'offer-1' },
      { id: 'offer-2' },
      { id: 'offer-3' },
    ])
    mockPrisma.offerView.groupBy.mockResolvedValue([])
    mockPrisma.offerSave.groupBy.mockResolvedValue([])
    mockPrisma.redemption.groupBy.mockResolvedValue([])

    await forecastOfferReach({
      city: 'Санкт-Петербург',
      category: 'CAFE',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 10,
      merchantId: 'merchant-1',
    })

    const callArg = mockPrisma.offer.findMany.mock.calls[0][0]
    expect(callArg.where.merchantId).toEqual({ not: 'merchant-1' })
  })

  describe('formatEstimateRange', () => {
    it('returns null for null or non-positive values', () => {
      expect(formatEstimateRange(null)).toBeNull()
      expect(formatEstimateRange(0)).toBeNull()
      expect(formatEstimateRange(-5)).toBeNull()
    })

    it('formats a value as a conservative range', () => {
      expect(formatEstimateRange(100)).toBe('60–140')
    })
  })
})
