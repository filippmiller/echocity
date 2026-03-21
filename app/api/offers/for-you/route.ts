import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/offers/for-you — personalized offer recommendations
 * Based on user's redemption history: category affinity + location preference
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ offers: [], reason: 'not_authenticated' })
  }

  const cityName = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const now = new Date()

  // Get user's recent redemption history (last 90 days)
  const recentRedemptions = await prisma.redemption.findMany({
    where: {
      userId: session.userId,
      status: 'SUCCESS',
      redeemedAt: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
    },
    include: {
      offer: {
        include: {
          branch: { select: { placeType: true, nearestMetro: true } },
        },
      },
    },
    orderBy: { redeemedAt: 'desc' },
    take: 50,
  })

  if (recentRedemptions.length === 0) {
    return NextResponse.json({ offers: [], reason: 'no_history' })
  }

  // Build category affinity scores
  const categoryScores: Record<string, number> = {}
  const metroPreference: Record<string, number> = {}
  const redeemedOfferIds = new Set<string>()

  recentRedemptions.forEach((r) => {
    redeemedOfferIds.add(r.offerId)
    const placeType = r.offer.branch?.placeType
    if (placeType) {
      categoryScores[placeType] = (categoryScores[placeType] || 0) + 1
    }
    const metro = r.offer.branch?.nearestMetro
    if (metro) {
      metroPreference[metro] = (metroPreference[metro] || 0) + 1
    }
  })

  // Get top categories and metros
  const topCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat)

  const topMetros = Object.entries(metroPreference)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([m]) => m)

  // Find offers matching user preferences, excluding already redeemed
  const recommendations = await prisma.offer.findMany({
    where: {
      id: { notIn: [...redeemedOfferIds] },
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
      branch: {
        city: cityName,
        isActive: true,
        OR: [
          ...(topCategories.length > 0 ? [{ placeType: { in: topCategories as any } }] : []),
          ...(topMetros.length > 0 ? [{ nearestMetro: { in: topMetros } }] : []),
        ],
      },
    },
    include: {
      branch: { select: { id: true, title: true, address: true, city: true, nearestMetro: true, placeType: true } },
      merchant: { select: { id: true, name: true, isVerified: true } },
      schedules: true,
      limits: true,
      _count: { select: { redemptions: true, offerReviews: true } },
    },
    take: 30,
    orderBy: { createdAt: 'desc' },
  })

  // Score and rank by relevance
  const scored = recommendations.map((offer: any) => {
    let score = 0
    const placeType = offer.branch?.placeType
    if (placeType && categoryScores[placeType]) {
      score += categoryScores[placeType] * 10 // Category affinity
    }
    const metro = offer.branch?.nearestMetro
    if (metro && metroPreference[metro]) {
      score += metroPreference[metro] * 5 // Location preference
    }
    score += (offer._count?.redemptions ?? 0) * 0.5 // Social proof
    score += (offer._count?.offerReviews ?? 0) * 2 // Review quality signal
    return { ...offer, relevanceScore: score }
  })

  scored.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)

  const topOffers = scored.slice(0, 6).map((offer: any) => ({
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle,
    offerType: offer.offerType,
    visibility: offer.visibility,
    benefitType: offer.benefitType,
    benefitValue: Number(offer.benefitValue),
    imageUrl: offer.imageUrl,
    branchName: offer.branch?.title ?? '',
    branchAddress: offer.branch?.address ?? '',
    nearestMetro: offer.branch?.nearestMetro ?? null,
    isVerified: offer.merchant?.isVerified ?? false,
    redemptionCount: offer._count?.redemptions ?? 0,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    expiresAt: offer.endAt?.toISOString() ?? null,
    isFlash: offer.offerType === 'FLASH',
    reviewCount: offer._count?.offerReviews ?? 0,
    schedules: (offer.schedules ?? []).map((s: any) => ({
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  }))

  return NextResponse.json({
    offers: topOffers,
    reason: 'personalized',
    affinities: topCategories,
  })
}
