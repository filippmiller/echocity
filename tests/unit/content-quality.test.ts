import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockOfferFindMany, mockPlaceFindMany, mockBusinessFindMany, mockCityFindMany } = vi.hoisted(
  () => ({
    mockOfferFindMany: vi.fn(),
    mockPlaceFindMany: vi.fn(),
    mockBusinessFindMany: vi.fn(),
    mockCityFindMany: vi.fn(),
  })
)

vi.mock('@/lib/prisma', () => ({
  prisma: {
    offer: { findMany: mockOfferFindMany },
    place: { findMany: mockPlaceFindMany },
    business: { findMany: mockBusinessFindMany },
    city: { findMany: mockCityFindMany },
  },
}))

import { getContentQualityReport } from '@/modules/admin/content-quality'

describe('admin/content-quality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOfferFindMany.mockResolvedValue([])
    mockPlaceFindMany.mockResolvedValue([])
    mockBusinessFindMany.mockResolvedValue([])
    mockCityFindMany.mockResolvedValue([])
  })

  it('returns zero counts when all checks pass', async () => {
    const report = await getContentQualityReport()

    expect(report.offersWithoutImages.count).toBe(0)
    expect(report.placesWithoutSchedule.count).toBe(0)
    expect(report.offersWithoutSavingsData.count).toBe(0)
    expect(report.pendingBusinesses.count).toBe(0)
    expect(report.emptyCityInventory.count).toBe(0)
    expect(report.checkedAt).toBeDefined()
  })

  it('flags offers without images', async () => {
    mockOfferFindMany.mockResolvedValue([
      {
        id: 'offer-1',
        title: 'Offer without image',
        benefitType: 'FIXED_AMOUNT',
        benefitValue: 100,
        imageUrl: null,
        metadata: { originalValue: 500 },
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
        merchant: { id: 'merchant-1', name: 'Merchant A' },
      },
    ])

    const report = await getContentQualityReport()

    expect(report.offersWithoutImages.count).toBe(1)
    expect(report.offersWithoutImages.items[0].id).toBe('offer-1')
  })

  it('flags places without schedule', async () => {
    mockPlaceFindMany.mockResolvedValue([
      { id: 'place-1', title: 'No schedule', city: 'СПб', openingHours: null },
      { id: 'place-2', title: 'Empty schedule', city: 'МСК', openingHours: {} },
      {
        id: 'place-3',
        title: 'Has schedule',
        city: 'СПб',
        openingHours: { mon: '10:00-22:00' },
      },
    ])

    const report = await getContentQualityReport()

    expect(report.placesWithoutSchedule.count).toBe(2)
    expect(report.placesWithoutSchedule.items.map((i) => i.id)).toEqual([
      'place-1',
      'place-2',
    ])
  })

  it('flags offers whose savings cannot be estimated', async () => {
    mockOfferFindMany.mockResolvedValue([
      {
        id: 'offer-percent-missing-original',
        title: 'Percent without original value',
        benefitType: 'PERCENT',
        benefitValue: 20,
        imageUrl: 'https://example.com/image.jpg',
        metadata: {},
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
        merchant: { id: 'merchant-1', name: 'Merchant A' },
      },
      {
        id: 'offer-fixed-amount',
        title: 'Fixed amount',
        benefitType: 'FIXED_AMOUNT',
        benefitValue: 100,
        imageUrl: 'https://example.com/image.jpg',
        metadata: {},
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
        merchant: { id: 'merchant-2', name: 'Merchant B' },
      },
    ])

    const report = await getContentQualityReport()

    expect(report.offersWithoutSavingsData.count).toBe(1)
    expect(report.offersWithoutSavingsData.items[0].id).toBe('offer-percent-missing-original')
  })

  it('lists pending businesses', async () => {
    mockBusinessFindMany.mockResolvedValue([
      {
        id: 'business-1',
        name: 'Pending Business',
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
      },
    ])

    const report = await getContentQualityReport()

    expect(report.pendingBusinesses.count).toBe(1)
    expect(report.pendingBusinesses.items[0].name).toBe('Pending Business')
  })

  it('flags cities with no active places', async () => {
    mockCityFindMany.mockResolvedValue([
      { id: 'city-1', name: 'Empty city', slug: 'empty', _count: { places: 0 } },
      { id: 'city-2', name: 'Populated city', slug: 'populated', _count: { places: 5 } },
    ])

    const report = await getContentQualityReport()

    expect(report.emptyCityInventory.count).toBe(1)
    expect(report.emptyCityInventory.items[0].id).toBe('city-1')
  })

  it('respects the sample limit', async () => {
    mockOfferFindMany.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({
        id: `offer-${i}`,
        title: `Offer ${i}`,
        benefitType: 'FIXED_AMOUNT',
        benefitValue: 100,
        imageUrl: null,
        metadata: {},
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
        merchant: { id: `merchant-${i}`, name: `Merchant ${i}` },
      }))
    )

    const report = await getContentQualityReport(10)

    expect(report.offersWithoutImages.count).toBe(25)
    expect(report.offersWithoutImages.items).toHaveLength(10)
  })
})
