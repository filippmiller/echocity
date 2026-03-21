import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/offers/top-rated — offers with the best verified reviews
 */
export async function GET(req: NextRequest) {
  const cityName = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '6') || 6, 20)
  const now = new Date()

  // Find offers with reviews, ordered by average rating then review count
  const offersWithReviews = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
      branch: { city: cityName, isActive: true },
      offerReviews: { some: { isPublished: true } },
    },
    include: {
      branch: { select: { title: true, address: true, nearestMetro: true } },
      merchant: { select: { name: true, isVerified: true } },
      limits: true,
      schedules: true,
      offerReviews: {
        where: { isPublished: true },
        select: { rating: true },
      },
      _count: { select: { redemptions: true, offerReviews: true } },
    },
    take: 50, // Get more, then rank by rating
  })

  // Calculate average rating and sort
  const scored = offersWithReviews
    .map((offer) => {
      const ratings = offer.offerReviews.map((r) => r.rating)
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0
      return { offer, avgRating, reviewCount: ratings.length }
    })
    .filter((o) => o.reviewCount >= 2) // Minimum 2 reviews for credibility
    .sort((a, b) => {
      // Sort by rating first, then by review count for tiebreaking
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
      return b.reviewCount - a.reviewCount
    })
    .slice(0, limit)

  const topRated = scored.map(({ offer, avgRating, reviewCount }) => ({
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
    redemptionCount: offer._count.redemptions,
    reviewCount,
    avgRating,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    expiresAt: offer.endAt?.toISOString() ?? null,
    isFlash: offer.offerType === 'FLASH',
    schedules: (offer.schedules ?? []).map((s: any) => ({
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  }))

  return NextResponse.json({ offers: topRated })
}
