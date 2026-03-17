import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'BUSINESS_OWNER' && session.role !== 'MERCHANT_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let merchantIds: string[] = []

  if (session.role === 'BUSINESS_OWNER') {
    const businesses = await prisma.business.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    })
    merchantIds = businesses.map((b) => b.id)
  } else {
    // MERCHANT_STAFF — get businesses they're staff of
    const staffRecords = await prisma.merchantStaff.findMany({
      where: { userId: session.userId, isActive: true },
      select: { merchantId: true },
    })
    merchantIds = staffRecords.map((s) => s.merchantId)
  }

  if (merchantIds.length === 0) {
    return NextResponse.json({
      hourlyHeatmap: [],
      offerPerformance: [],
      customerRetention: { totalCustomers: 0, returningCustomers: 0, retentionRate: 0 },
      weeklyTrend: [],
      savingsGenerated: 0,
      demandStats: { totalDemands: 0, respondedCount: 0, conversionRate: 0 },
    })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  // Run all queries in parallel
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

  const offerPerformance = allOffers
    .map((offer) => {
      const redemptions = redemptionCountMap.get(offer.id) || 0
      const ratingData = ratingMap.get(offer.id)
      return {
        offerId: offer.id,
        title: offer.title,
        redemptions,
        avgRating: ratingData?.avg ? Math.round(ratingData.avg * 10) / 10 : null,
        reviewCount: ratingData?.count || 0,
        benefitType: offer.benefitType,
        benefitValue: Number(offer.benefitValue),
      }
    })
    .sort((a, b) => b.redemptions - a.redemptions)
    .slice(0, 10)

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
  })
}
