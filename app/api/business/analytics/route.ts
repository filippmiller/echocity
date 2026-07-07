import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { getBusinessAccessSummary } from '@/lib/business-access'
import { canViewAnalytics } from '@/lib/permissions'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { merchantIds, access } = await getBusinessAccessSummary(session)
  if (!canViewAnalytics(access)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (merchantIds.length === 0) {
    return NextResponse.json({
      hourlyHeatmap: [],
      offerPerformance: [],
      customerRetention: { totalCustomers: 0, returningCustomers: 0, retentionRate: 0 },
      weeklyTrend: [],
      savingsGenerated: 0,
      demandStats: { totalDemands: 0, respondedCount: 0, conversionRate: 0 },
      viewsPerOffer: [],
      savesPerOffer: [],
      conversionRate: 0,
      topOffersByViews: [],
      overallViews: 0,
      overallSaves: 0,
    })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  // Run all base queries in parallel
  const [
    redemptionsThisMonth,
    allOffers,
    offerRedemptionCounts,
    offerRatings,
    allTimeRedemptionsByUser,
    savingsAggregate,
    totalDemands,
    respondedDemands,
    fulfilledDemands,
  ] = await Promise.all([
    // All redemptions this month (for hourly heatmap and weekly trend)
    prisma.redemption.findMany({
      where: {
        merchantId: { in: merchantIds },
        status: 'SUCCESS',
        redeemedAt: { gte: fourWeeksAgo },
      },
      select: { redeemedAt: true, userId: true },
    }),

    // All active offers for this merchant
    prisma.offer.findMany({
      where: { merchantId: { in: merchantIds } },
      select: { id: true, title: true, benefitType: true, benefitValue: true },
    }),

    // Redemption counts per offer
    prisma.redemption.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),

    // Average ratings per offer
    prisma.offerReview.groupBy({
      by: ['offerId'],
      _avg: { rating: true },
      _count: { id: true },
      where: {
        offer: { merchantId: { in: merchantIds } },
        isPublished: true,
      },
    }),

    // All-time redemptions grouped by user (for retention)
    prisma.redemption.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),

    // Total savings given
    prisma.redemption.aggregate({
      _sum: { discountAmount: true },
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),

    // Demand stats
    prisma.demandRequest.count({
      where: {
        place: { businessId: { in: merchantIds } },
      },
    }),
    prisma.demandResponse.count({
      where: { merchantId: { in: merchantIds } },
    }),
    prisma.demandRequest.count({
      where: {
        place: { businessId: { in: merchantIds } },
        status: 'FULFILLED',
      },
    }),
  ])

  const offerIds = allOffers.map((offer) => offer.id)

  // Offer impression/save counts depend on the merchant's offer IDs
  const [offerViewCounts, offerSaveCounts, overallViews, overallSaves] =
    offerIds.length > 0
      ? await Promise.all([
          prisma.offerView.groupBy({
            by: ['offerId'],
            _count: true,
            where: { offerId: { in: offerIds } },
          }),
          prisma.offerSave.groupBy({
            by: ['offerId'],
            _count: true,
            where: { offerId: { in: offerIds } },
          }),
          prisma.offerView.count({
            where: { offerId: { in: offerIds } },
          }),
          prisma.offerSave.count({
            where: { offerId: { in: offerIds } },
          }),
        ])
      : [[], [], 0, 0]

  // === Hourly heatmap (last 30 days) ===
  const hourlyMap: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0

  const monthRedemptions = redemptionsThisMonth.filter(
    (r) => r.redeemedAt >= monthStart
  )
  for (const r of monthRedemptions) {
    const hour = r.redeemedAt.getHours()
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1
  }

  const hourlyHeatmap = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourlyMap[h] || 0,
  }))

  // === Offer performance ===
  const redemptionCountMap = new Map(
    offerRedemptionCounts.map((r) => [r.offerId, r._count.id])
  )
  const ratingMap = new Map(
    offerRatings.map((r) => [r.offerId, { avg: r._avg.rating, count: r._count.id }])
  )
  const viewCountMap = new Map(
    offerViewCounts.map((r) => [r.offerId, r._count])
  )
  const saveCountMap = new Map(
    offerSaveCounts.map((r) => [r.offerId, r._count])
  )

  const offerPerformance = allOffers
    .map((offer) => {
      const redemptions = redemptionCountMap.get(offer.id) || 0
      const views = viewCountMap.get(offer.id) || 0
      const saves = saveCountMap.get(offer.id) || 0
      const ratingData = ratingMap.get(offer.id)
      return {
        offerId: offer.id,
        title: offer.title,
        redemptions,
        views,
        saves,
        conversionRate: views > 0 ? Math.round((redemptions / views) * 1000) / 10 : 0,
        avgRating: ratingData?.avg ? Math.round(ratingData.avg * 10) / 10 : null,
        reviewCount: ratingData?.count || 0,
        benefitType: offer.benefitType,
        benefitValue: Number(offer.benefitValue),
      }
    })
    .sort((a, b) => b.redemptions - a.redemptions)
    .slice(0, 10)

  const viewsPerOffer = allOffers
    .map((offer) => ({
      offerId: offer.id,
      title: offer.title,
      views: viewCountMap.get(offer.id) || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  const savesPerOffer = allOffers
    .map((offer) => ({
      offerId: offer.id,
      title: offer.title,
      saves: saveCountMap.get(offer.id) || 0,
    }))
    .sort((a, b) => b.saves - a.saves)
    .slice(0, 10)

  const topOffersByViews = viewsPerOffer.slice(0, 5)
  const conversionRate = overallViews > 0
    ? Math.round((offerRedemptionCounts.reduce((sum, r) => sum + r._count.id, 0) / overallViews) * 1000) / 10
    : 0

  // === Customer retention ===
  const totalCustomers = allTimeRedemptionsByUser.length
  const returningCustomers = allTimeRedemptionsByUser.filter(
    (u) => u._count.id > 1
  ).length
  const retentionRate =
    totalCustomers > 0
      ? Math.round((returningCustomers / totalCustomers) * 100)
      : 0

  // === Weekly trend (last 4 weeks) ===
  const weeklyTrend: { weekLabel: string; count: number }[] = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - w * 7)
    weekEnd.setHours(23, 59, 59, 999)

    const count = redemptionsThisMonth.filter(
      (r) => r.redeemedAt >= weekStart && r.redeemedAt <= weekEnd
    ).length

    const startDay = weekStart.getDate()
    const startMonth = weekStart.getMonth() + 1
    weeklyTrend.push({
      weekLabel: `${startDay}.${String(startMonth).padStart(2, '0')}`,
      count,
    })
  }

  // === Savings generated ===
  const savingsGenerated = savingsAggregate._sum.discountAmount
    ? Math.round(Number(savingsAggregate._sum.discountAmount) * 100)
    : 0

  // === Demand stats ===
  const demandConversionRate =
    totalDemands > 0 ? Math.round((fulfilledDemands / totalDemands) * 100) : 0

  return NextResponse.json({
    hourlyHeatmap,
    offerPerformance,
    customerRetention: {
      totalCustomers,
      returningCustomers,
      retentionRate,
    },
    weeklyTrend,
    savingsGenerated,
    demandStats: {
      totalDemands,
      respondedCount: respondedDemands,
      conversionRate: demandConversionRate,
    },
    viewsPerOffer,
    savesPerOffer,
    conversionRate,
    topOffersByViews,
    overallViews,
    overallSaves,
  })
}
