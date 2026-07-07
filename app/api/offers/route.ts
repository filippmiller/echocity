import { NextRequest, NextResponse } from 'next/server'
import { getActiveOffersByCity } from '@/modules/offers/service'
import { getTrendingOfferIds } from '@/modules/offers/trending'
import { getEstimatedSavings } from '@/lib/offer-utils'
import { isOfferActiveNow, isBlackoutDate } from '@/lib/schedule-utils'
import { BenefitType, OfferVisibility } from '@prisma/client'

const VALID_BENEFIT_TYPES = Object.values(BenefitType)
const VALID_VISIBILITIES = Object.values(OfferVisibility)

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const rawVisibility = req.nextUrl.searchParams.get('visibility')
  const visibility = rawVisibility && VALID_VISIBILITIES.includes(rawVisibility as OfferVisibility)
    ? rawVisibility
    : undefined
  const category = req.nextUrl.searchParams.get('category') || undefined
  const metro = req.nextUrl.searchParams.get('metro') || undefined
  const districtSlug = req.nextUrl.searchParams.get('district') || undefined
  const rawBenefitType = req.nextUrl.searchParams.get('benefitType')
  const benefitType = rawBenefitType && VALID_BENEFIT_TYPES.includes(rawBenefitType as BenefitType)
    ? rawBenefitType
    : undefined
  const activeNow = req.nextUrl.searchParams.get('activeNow') === 'true'
  const userLat = req.nextUrl.searchParams.get('lat')
  const userLng = req.nextUrl.searchParams.get('lng')
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '50') || 50, 1), 100)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0') || 0, 0)

  const [rawOffers, trendingIds] = await Promise.all([
    getActiveOffersByCity(city, { visibility, category, metro, districtSlug, benefitType, limit, offset }),
    getTrendingOfferIds(city),
  ])

  const trendingSet = new Set(trendingIds)
  const now = Date.now()

  let filtered = rawOffers as any[]

  if (activeNow) {
    filtered = filtered.filter((offer) => isOfferActiveNow(offer.schedules ?? []))
  }

  const lat = userLat ? parseFloat(userLat) : null
  const lng = userLng ? parseFloat(userLng) : null
  const hasUserLocation = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)

  // Enrich response with computed fields + ranking score
  const offers = filtered
    .map((offer: any) => {
      const redemptionCount = offer._count?.redemptions ?? 0
      const reviewCount = offer._count?.offerReviews ?? 0
      const publishedReviews = (offer.offerReviews ?? []).filter((r: any) => r.rating != null)
      const avgRating = publishedReviews.length > 0
        ? Number((publishedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / publishedReviews.length).toFixed(1))
        : null
      const isTrending = trendingSet.has(offer.id)
      const isFlash = offer.offerType === 'FLASH'
      const ageHours = (now - new Date(offer.createdAt).getTime()) / 3_600_000
      const schedules = (offer.schedules ?? []).map((s: any) => ({
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        isBlackout: s.isBlackout ?? false,
      }))
      const offerOpenNow = isOfferActiveNow(schedules)
      const blackedOut = isBlackoutDate(offer.blackoutDates ?? [])
      const branchLat = offer.branch?.lat ?? null
      const branchLng = offer.branch?.lng ?? null
      const estimatedSavings = getEstimatedSavings(offer.benefitType, Number(offer.benefitValue), offer.metadata)

      let distanceKm: number | null = null
      if (hasUserLocation && branchLat != null && branchLng != null) {
        distanceKm = haversineKm(lat, lng, branchLat, branchLng)
      }

      // Ranking score: engagement + relevance + proximity + trust + value
      // - Recency: newer offers get a boost (decays over 72h)
      // - Redemptions: each redemption adds weight
      // - Reviews: verified reviews are high-signal engagement
      // - Trending: recent velocity bonus
      // - Flash: urgency bonus
      // - Active now: strongly boost currently available offers
      // - Verified merchant: trust signal
      // - Estimated savings: high ruble value is relevant
      // - Distance: closer offers score higher (only when user location known)
      const recencyScore = Math.max(0, 1 - ageHours / 72) * 30
      const redemptionScore = Math.min(redemptionCount * 2, 30)
      const reviewScore = Math.min(reviewCount * 5, 20)
      const trendingBonus = isTrending ? 15 : 0
      const flashBonus = isFlash ? 10 : 0
      const activeNowBonus = offerOpenNow && !blackedOut ? 20 : 0
      const verifiedBonus = offer.merchant?.isVerified ? 8 : 0
      const savingsBonus = estimatedSavings ? Math.min(estimatedSavings / 20, 15) : 0
      const distanceBonus = distanceKm != null ? Math.max(0, 10 - distanceKm * 2) : 0
      const engagementScore =
        recencyScore +
        redemptionScore +
        reviewScore +
        trendingBonus +
        flashBonus +
        activeNowBonus +
        verifiedBonus +
        savingsBonus +
        distanceBonus

      return {
        ...offer,
        expiresAt: offer.endAt?.toISOString() ?? null,
        redemptionCount,
        maxRedemptions: offer.limits?.totalLimit ?? null,
        isFlash,
        isTrending,
        schedules,
        nearestMetro: offer.branch?.nearestMetro ?? null,
        isVerified: offer.merchant?.isVerified ?? false,
        reviewCount,
        avgRating,
        branchLat,
        branchLng,
        branchAddress: offer.branch?.address ?? null,
        distance: distanceKm,
        engagementScore: Math.round(engagementScore),
      }
    })
    .sort((a: any, b: any) => b.engagementScore - a.engagementScore)

  return NextResponse.json({ offers })
}
