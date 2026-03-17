import { prisma } from '@/lib/prisma'
import type { BusinessType } from '@prisma/client'

interface PreferenceProfile {
  preferredTypes: BusinessType[]
  preferredMerchantIds: string[]
  favoritePlaceIds: string[]
  favoriteOfferIds: string[]
}

interface ScoredOffer {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  endAt: string | null
  redemptionChannel: string
  branch: {
    id: string
    title: string
    address: string
    city: string
    placeType: BusinessType
  }
  merchant: {
    id: string
    name: string
  }
  maxRedemptions: number | null
  score: number
}

/**
 * Build a preference profile from the user's redemption history and favorites.
 */
async function buildPreferenceProfile(userId: string): Promise<PreferenceProfile> {
  // 1. Fetch user's last 50 redemptions with branch placeType and merchantId
  const recentRedemptions = await prisma.redemption.findMany({
    where: { userId, status: 'SUCCESS' },
    orderBy: { redeemedAt: 'desc' },
    take: 50,
    select: {
      merchantId: true,
      offerId: true,
      branch: { select: { placeType: true } },
    },
  })

  // Count per type
  const typeCounts = new Map<BusinessType, number>()
  const merchantCounts = new Map<string, number>()
  for (const r of recentRedemptions) {
    const t = r.branch.placeType
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1)
    merchantCounts.set(r.merchantId, (merchantCounts.get(r.merchantId) || 0) + 1)
  }

  // Sort types by count, take top 3
  const preferredTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type)

  // Merchants the user has redeemed from
  const preferredMerchantIds = [...merchantCounts.keys()]

  // 2. Fetch user's favorites
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { entityType: true, entityId: true },
  })

  const favoritePlaceIds = favorites
    .filter((f) => f.entityType === 'PLACE')
    .map((f) => f.entityId)

  const favoriteOfferIds = favorites
    .filter((f) => f.entityType === 'OFFER')
    .map((f) => f.entityId)

  return { preferredTypes, preferredMerchantIds, favoritePlaceIds, favoriteOfferIds }
}

/**
 * Get personalized offers for a logged-in user, scored by relevance.
 */
export async function getPersonalizedOffers(
  userId: string,
  city: string,
  limit: number = 20,
): Promise<ScoredOffer[]> {
  const profile = await buildPreferenceProfile(userId)

  // Fetch active, approved offers in the user's city
  const offers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      branch: { city, isActive: true },
    },
    include: {
      branch: {
        select: { id: true, title: true, address: true, city: true, placeType: true },
      },
      merchant: { select: { id: true, name: true } },
      limits: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200, // fetch a broad pool to score from
  })

  // Check which offers the user already redeemed today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const todayRedemptions = await prisma.redemption.findMany({
    where: {
      userId,
      status: 'SUCCESS',
      redeemedAt: { gte: startOfDay },
    },
    select: { offerId: true },
  })
  const redeemedTodayIds = new Set(todayRedemptions.map((r) => r.offerId))

  // Find the max benefitValue for scaling
  const maxBenefitValue = Math.max(
    ...offers.map((o) => Number(o.benefitValue)),
    1, // avoid division by zero
  )

  const now = Date.now()
  const fourHoursMs = 4 * 60 * 60 * 1000

  // Score each offer
  const scored: ScoredOffer[] = offers.map((offer) => {
    let score = 0

    // +10 if branch placeType matches top 3 preferred types
    if (profile.preferredTypes.includes(offer.branch.placeType)) {
      score += 10
    }

    // +5 if merchant was previously redeemed from (returning customer)
    if (profile.preferredMerchantIds.includes(offer.merchantId)) {
      score += 5
    }

    // +3 if branch is in user's favorites
    if (profile.favoritePlaceIds.includes(offer.branchId)) {
      score += 3
    }

    // +8 if FLASH and ending within 4 hours (urgency)
    if (offer.offerType === 'FLASH' && offer.endAt) {
      const timeLeft = new Date(offer.endAt).getTime() - now
      if (timeLeft > 0 && timeLeft <= fourHoursMs) {
        score += 8
      }
    }

    // +2 for higher benefitValue (scaled 0-2)
    const benefitNum = Number(offer.benefitValue)
    score += (benefitNum / maxBenefitValue) * 2

    // -5 if user already redeemed this exact offer today
    if (redeemedTodayIds.has(offer.id)) {
      score -= 5
    }

    return {
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      offerType: offer.offerType,
      visibility: offer.visibility,
      benefitType: offer.benefitType,
      benefitValue: Number(offer.benefitValue),
      imageUrl: offer.imageUrl,
      endAt: offer.endAt?.toISOString() ?? null,
      redemptionChannel: offer.redemptionChannel,
      branch: {
        id: offer.branch.id,
        title: offer.branch.title,
        address: offer.branch.address,
        city: offer.branch.city,
        placeType: offer.branch.placeType,
      },
      merchant: {
        id: offer.merchant.id,
        name: offer.merchant.name,
      },
      maxRedemptions: offer.limits?.totalLimit ?? null,
      score,
    }
  })

  // Sort by score descending, return top `limit`
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

/**
 * Get the "For You" section data.
 * Personalized if user is logged in, trending otherwise.
 */
export async function getForYouSection(
  userId: string | null,
  city: string,
): Promise<{ offers: ScoredOffer[]; isPersonalized: boolean }> {
  if (!userId) {
    const trending = await getTrendingOffers(city, 10)
    return { offers: trending, isPersonalized: false }
  }

  const offers = await getPersonalizedOffers(userId, city, 10)
  return { offers, isPersonalized: true }
}

/**
 * Get trending offers — most redeemed in the last 7 days.
 */
export async function getTrendingOffers(
  city: string,
  limit: number = 10,
): Promise<ScoredOffer[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Get redemption counts per offer in the last 7 days
  const redemptionCounts = await prisma.redemption.groupBy({
    by: ['offerId'],
    where: {
      status: 'SUCCESS',
      redeemedAt: { gte: sevenDaysAgo },
      offer: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        branch: { city, isActive: true },
      },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  if (redemptionCounts.length === 0) {
    // Fallback: return newest active offers
    const newest = await prisma.offer.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        branch: { city, isActive: true },
      },
      include: {
        branch: {
          select: { id: true, title: true, address: true, city: true, placeType: true },
        },
        merchant: { select: { id: true, name: true } },
        limits: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return newest.map((offer) => ({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      offerType: offer.offerType,
      visibility: offer.visibility,
      benefitType: offer.benefitType,
      benefitValue: Number(offer.benefitValue),
      imageUrl: offer.imageUrl,
      endAt: offer.endAt?.toISOString() ?? null,
      redemptionChannel: offer.redemptionChannel,
      branch: {
        id: offer.branch.id,
        title: offer.branch.title,
        address: offer.branch.address,
        city: offer.branch.city,
        placeType: offer.branch.placeType,
      },
      merchant: {
        id: offer.merchant.id,
        name: offer.merchant.name,
      },
      maxRedemptions: offer.limits?.totalLimit ?? null,
      score: 0,
    }))
  }

  const offerIds = redemptionCounts.map((r) => r.offerId)
  const countMap = new Map(redemptionCounts.map((r) => [r.offerId, r._count.id]))

  const offers = await prisma.offer.findMany({
    where: { id: { in: offerIds } },
    include: {
      branch: {
        select: { id: true, title: true, address: true, city: true, placeType: true },
      },
      merchant: { select: { id: true, name: true } },
      limits: true,
    },
  })

  // Sort by redemption count
  const sorted = offers
    .map((offer) => ({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      offerType: offer.offerType,
      visibility: offer.visibility,
      benefitType: offer.benefitType,
      benefitValue: Number(offer.benefitValue),
      imageUrl: offer.imageUrl,
      endAt: offer.endAt?.toISOString() ?? null,
      redemptionChannel: offer.redemptionChannel,
      branch: {
        id: offer.branch.id,
        title: offer.branch.title,
        address: offer.branch.address,
        city: offer.branch.city,
        placeType: offer.branch.placeType,
      },
      merchant: {
        id: offer.merchant.id,
        name: offer.merchant.name,
      },
      maxRedemptions: offer.limits?.totalLimit ?? null,
      score: countMap.get(offer.id) || 0,
    }))
    .sort((a, b) => b.score - a.score)

  return sorted
}

/**
 * Get similar offers to a given offer.
 * Matches by placeType, offerType, and similar benefitValue range.
 */
export async function getSimilarOffers(
  offerId: string,
  limit: number = 5,
): Promise<ScoredOffer[]> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      branch: { select: { city: true, placeType: true } },
    },
  })

  if (!offer) return []

  const benefitNum = Number(offer.benefitValue)
  const lowerBound = benefitNum * 0.5
  const upperBound = benefitNum * 1.5

  const similar = await prisma.offer.findMany({
    where: {
      id: { not: offerId },
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      branch: {
        city: offer.branch.city,
        isActive: true,
      },
      OR: [
        { branch: { placeType: offer.branch.placeType } },
        { offerType: offer.offerType },
      ],
      benefitValue: { gte: lowerBound, lte: upperBound },
    },
    include: {
      branch: {
        select: { id: true, title: true, address: true, city: true, placeType: true },
      },
      merchant: { select: { id: true, name: true } },
      limits: true,
    },
    take: limit * 3, // over-fetch, then score and trim
  })

  // Score similarity
  const scored = similar.map((s) => {
    let score = 0
    if (s.branch.placeType === offer.branch.placeType) score += 3
    if (s.offerType === offer.offerType) score += 2
    // Closer benefitValue = higher score
    const diff = Math.abs(Number(s.benefitValue) - benefitNum)
    score += Math.max(0, 2 - (diff / Math.max(benefitNum, 1)) * 2)

    return {
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      offerType: s.offerType,
      visibility: s.visibility,
      benefitType: s.benefitType,
      benefitValue: Number(s.benefitValue),
      imageUrl: s.imageUrl,
      endAt: s.endAt?.toISOString() ?? null,
      redemptionChannel: s.redemptionChannel,
      branch: {
        id: s.branch.id,
        title: s.branch.title,
        address: s.branch.address,
        city: s.branch.city,
        placeType: s.branch.placeType,
      },
      merchant: {
        id: s.merchant.id,
        name: s.merchant.name,
      },
      maxRedemptions: s.limits?.totalLimit ?? null,
      score,
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
