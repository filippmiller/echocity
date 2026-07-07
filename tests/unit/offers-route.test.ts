import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetActiveOffersByCity, mockGetTrendingOfferIds } = vi.hoisted(() => ({
  mockGetActiveOffersByCity: vi.fn(),
  mockGetTrendingOfferIds: vi.fn(),
}))

vi.mock('@/modules/offers/service', () => ({
  getActiveOffersByCity: mockGetActiveOffersByCity,
}))

vi.mock('@/modules/offers/trending', () => ({
  getTrendingOfferIds: mockGetTrendingOfferIds,
}))

import { GET } from '@/app/api/offers/route'

function makeOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'offer-1',
    title: 'Test offer',
    subtitle: null,
    offerType: 'PERCENT_DISCOUNT',
    visibility: 'PUBLIC',
    benefitType: 'PERCENT',
    benefitValue: 20,
    imageUrl: null,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    endAt: null,
    schedules: [],
    blackoutDates: [],
    metadata: {},
    branch: {
      title: 'Branch',
      address: 'Addr',
      city: 'Санкт-Петербург',
      lat: 59.93,
      lng: 30.33,
      nearestMetro: null,
    },
    merchant: { name: 'Merchant', isVerified: false },
    offerReviews: [],
    _count: { redemptions: 0, offerReviews: 0 },
    limits: null,
    ...overrides,
  }
}

function createRequest(url: string): NextRequest {
  return new NextRequest(url)
}

describe('GET /api/offers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTrendingOfferIds.mockResolvedValue([])
  })

  it('returns offers and defaults to recommended sort', async () => {
    mockGetActiveOffersByCity.mockResolvedValue([makeOffer({ id: 'a' }), makeOffer({ id: 'b' })])

    const response = await GET(createRequest('http://localhost/api/offers'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.offers).toHaveLength(2)
    expect(json.sort).toBe('recommended')
    expect(mockGetActiveOffersByCity).toHaveBeenCalledWith(
      'Санкт-Петербург',
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
  })

  it('ignores invalid sort and falls back to recommended', async () => {
    mockGetActiveOffersByCity.mockResolvedValue([makeOffer()])

    const response = await GET(createRequest('http://localhost/api/offers?sort=unknown'))
    const json = await response.json()

    expect(json.sort).toBe('recommended')
  })

  it('sorts by newest (createdAt desc)', async () => {
    const older = makeOffer({ id: 'older', createdAt: new Date('2026-01-01T00:00:00Z') })
    const newer = makeOffer({ id: 'newer', createdAt: new Date('2026-01-03T00:00:00Z') })
    mockGetActiveOffersByCity.mockResolvedValue([older, newer])

    const response = await GET(createRequest('http://localhost/api/offers?sort=newest'))
    const json = await response.json()

    expect(json.sort).toBe('newest')
    expect(json.offers[0].id).toBe('newer')
    expect(json.offers[1].id).toBe('older')
  })

  it('sorts by endingSoon (endAt asc, nulls last)', async () => {
    const noEnd = makeOffer({ id: 'no-end' })
    const endsLater = makeOffer({ id: 'ends-later', endAt: new Date('2026-01-05T00:00:00Z') })
    const endsSooner = makeOffer({ id: 'ends-sooner', endAt: new Date('2026-01-02T00:00:00Z') })
    mockGetActiveOffersByCity.mockResolvedValue([noEnd, endsLater, endsSooner])

    const response = await GET(createRequest('http://localhost/api/offers?sort=endingSoon'))
    const json = await response.json()

    expect(json.sort).toBe('endingSoon')
    expect(json.offers[0].id).toBe('ends-sooner')
    expect(json.offers[1].id).toBe('ends-later')
    expect(json.offers[2].id).toBe('no-end')
  })

  it('sorts by nearest when lat/lng provided', async () => {
    const far = makeOffer({ id: 'far', branch: { ...makeOffer().branch, lat: 60.0, lng: 30.5 } })
    const near = makeOffer({ id: 'near', branch: { ...makeOffer().branch, lat: 59.931, lng: 30.330 } })
    mockGetActiveOffersByCity.mockResolvedValue([far, near])

    const response = await GET(createRequest('http://localhost/api/offers?sort=nearest&lat=59.93&lng=30.33'))
    const json = await response.json()

    expect(json.sort).toBe('nearest')
    expect(json.offers[0].id).toBe('near')
    expect(json.offers[1].id).toBe('far')
  })

  it('sorts by rating then reviewCount', async () => {
    const lowRatingHighReviews = makeOffer({
      id: 'low-rating',
      offerReviews: [{ rating: 3 }, { rating: 3 }, { rating: 3 }],
      _count: { redemptions: 0, offerReviews: 3 },
    })
    const highRatingLowReviews = makeOffer({
      id: 'high-rating',
      offerReviews: [{ rating: 5 }],
      _count: { redemptions: 0, offerReviews: 1 },
    })
    const highRatingHighReviews = makeOffer({
      id: 'top',
      offerReviews: [{ rating: 5 }, { rating: 5 }, { rating: 5 }],
      _count: { redemptions: 0, offerReviews: 3 },
    })
    mockGetActiveOffersByCity.mockResolvedValue([lowRatingHighReviews, highRatingLowReviews, highRatingHighReviews])

    const response = await GET(createRequest('http://localhost/api/offers?sort=rating'))
    const json = await response.json()

    expect(json.sort).toBe('rating')
    expect(json.offers[0].id).toBe('top')
    expect(json.offers[1].id).toBe('high-rating')
    expect(json.offers[2].id).toBe('low-rating')
  })

  it('respects limit and offset parameters', async () => {
    mockGetActiveOffersByCity.mockResolvedValue([makeOffer()])

    await GET(createRequest('http://localhost/api/offers?limit=2&offset=10'))

    expect(mockGetActiveOffersByCity).toHaveBeenCalledWith(
      'Санкт-Петербург',
      expect.objectContaining({ limit: 2, offset: 10 }),
    )
  })

  it('clamps limit between 1 and 100', async () => {
    mockGetActiveOffersByCity.mockResolvedValue([makeOffer()])

    await GET(createRequest('http://localhost/api/offers?limit=0'))
    await GET(createRequest('http://localhost/api/offers?limit=200'))

    // limit=0 falls back to the default (50), then is clamped to [1, 100]
    expect(mockGetActiveOffersByCity).toHaveBeenNthCalledWith(
      1,
      'Санкт-Петербург',
      expect.objectContaining({ limit: 50 }),
    )
    expect(mockGetActiveOffersByCity).toHaveBeenNthCalledWith(
      2,
      'Санкт-Петербург',
      expect.objectContaining({ limit: 100 }),
    )
  })

  it('passes validated filter params to service', async () => {
    mockGetActiveOffersByCity.mockResolvedValue([makeOffer()])

    await GET(
      createRequest(
        'http://localhost/api/offers?city=Москва&visibility=FREE_FOR_ALL&category=coffee&benefitType=PERCENT&activeNow=true',
      ),
    )

    expect(mockGetActiveOffersByCity).toHaveBeenCalledWith(
      'Москва',
      expect.objectContaining({
        visibility: 'FREE_FOR_ALL',
        category: 'coffee',
        benefitType: 'PERCENT',
      }),
    )
  })
})
