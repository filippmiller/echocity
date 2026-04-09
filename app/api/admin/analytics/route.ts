import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Run all queries in parallel for efficiency
  const [
    // Overview
    totalUsers,
    activeUsers,
    totalBusinesses,
    approvedBusinesses,
    totalPlaces,
    activeOffers,
    totalRedemptions,

    // Growth — this week
    newUsersThisWeek,
    newBusinessesThisWeek,
    newOffersThisWeek,

    // Growth — last week (for comparison)
    newUsersLastWeek,
    newBusinessesLastWeek,
    newOffersLastWeek,

    // Growth — this month
    newUsersThisMonth,
    newBusinessesThisMonth,
    newOffersThisMonth,

    // Engagement
    redemptionsToday,
    redemptionsThisWeek,
    redemptionsLastWeek,
    redemptionsThisMonth,
    uniqueRedeemingUsersThisWeek,
    uniqueRedeemingUsersThisMonth,
    totalRedemptionsThisMonth,

    // Revenue
    totalRevenue,
    revenueThisMonth,
    activeSubscribers,
    canceledThisMonth,

    // Demand
    openDemands,
    fulfilledDemands,
    totalDemands,

    // Quality
    openComplaints,
    openFraudFlags,
    resolvedComplaints,

    // Recent activity
    recentRedemptions,

    // Total savings distributed
    totalSavings,
  ] = await Promise.all([
    // === OVERVIEW ===
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    prisma.business.count(),
    prisma.business.count({ where: { status: 'APPROVED' } }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.offer.count({ where: { lifecycleStatus: 'ACTIVE' } }),
    prisma.redemption.count({ where: { status: 'SUCCESS' } }),

    // === GROWTH — THIS WEEK ===
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.business.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.offer.count({ where: { createdAt: { gte: weekStart } } }),

    // === GROWTH — LAST WEEK ===
    prisma.user.count({ where: { createdAt: { gte: lastWeekStart, lt: weekStart } } }),
    prisma.business.count({ where: { createdAt: { gte: lastWeekStart, lt: weekStart } } }),
    prisma.offer.count({ where: { createdAt: { gte: lastWeekStart, lt: weekStart } } }),

    // === GROWTH — THIS MONTH ===
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.business.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.offer.count({ where: { createdAt: { gte: monthStart } } }),

    // === ENGAGEMENT ===
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: todayStart } } }),
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: weekStart } } }),
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: lastWeekStart, lt: weekStart } } }),
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: monthStart } } }),
    prisma.redemption.groupBy({
      by: ['userId'],
      where: { status: 'SUCCESS', redeemedAt: { gte: weekStart } },
    }),
    prisma.redemption.groupBy({
      by: ['userId'],
      where: { status: 'SUCCESS', redeemedAt: { gte: monthStart } },
    }),
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: monthStart } } }),

    // === REVENUE ===
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', paidAt: { gte: monthStart } },
    }),
    prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.userSubscription.count({ where: { status: 'CANCELED', canceledAt: { gte: monthStart } } }),

    // === DEMAND ===
    prisma.demandRequest.count({ where: { status: 'OPEN' } }),
    prisma.demandRequest.count({ where: { status: 'FULFILLED' } }),
    prisma.demandRequest.count(),

    // === QUALITY ===
    prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
    prisma.fraudFlag.count({ where: { status: 'OPEN' } }),
    prisma.complaint.findMany({
      where: { status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: 'desc' },
    }),

    // === RECENT ACTIVITY ===
    prisma.redemption.findMany({
      where: { status: 'SUCCESS' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        offer: { select: { title: true } },
        branch: { select: { title: true } },
      },
      orderBy: { redeemedAt: 'desc' },
      take: 5,
    }),

    // === SAVINGS ===
    prisma.userSavings.aggregate({ _sum: { savedAmount: true } }),
  ])

  // Calculate average resolution time in hours
  let avgResolutionHours = 0
  if (resolvedComplaints.length > 0) {
    const totalMs = resolvedComplaints.reduce((sum, c) => {
      if (!c.resolvedAt) return sum
      return sum + (c.resolvedAt.getTime() - c.createdAt.getTime())
    }, 0)
    avgResolutionHours = Math.round(totalMs / resolvedComplaints.length / (1000 * 60 * 60))
  }

  // Unique redeeming users counts
  const uniqueRedeemersWeek = uniqueRedeemingUsersThisWeek.length
  const uniqueRedeemersMonth = uniqueRedeemingUsersThisMonth.length

  // Avg redemptions per user this month
  const avgRedemptionsPerUser =
    uniqueRedeemersMonth > 0
      ? Math.round((totalRedemptionsThisMonth / uniqueRedeemersMonth) * 10) / 10
      : 0

  // MRR estimate: aggregate active subscription plan prices
  const mrrResult = await prisma.$queryRaw<[{ total: bigint | null }]>`
    SELECT COALESCE(SUM(p."monthlyPrice"), 0) as total
    FROM "UserSubscription" s
    JOIN "SubscriptionPlan" p ON s."planId" = p."id"
    WHERE s."status" = 'ACTIVE'
  `
  const mrrKopecks = Number(mrrResult[0]?.total ?? 0)

  // Demand conversion rate
  const demandConversionRate =
    totalDemands > 0 ? Math.round((fulfilledDemands / totalDemands) * 100) : 0

  // Growth percentage helpers
  const pct = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const analytics = {
    overview: {
      totalUsers,
      activeUsers,
      totalBusinesses,
      approvedBusinesses,
      totalPlaces,
      activeOffers,
      totalRedemptions,
    },
    growth: {
      usersThisWeek: newUsersThisWeek,
      usersLastWeek: newUsersLastWeek,
      usersThisMonth: newUsersThisMonth,
      usersGrowthPct: pct(newUsersThisWeek, newUsersLastWeek),

      businessesThisWeek: newBusinessesThisWeek,
      businessesLastWeek: newBusinessesLastWeek,
      businessesThisMonth: newBusinessesThisMonth,
      businessesGrowthPct: pct(newBusinessesThisWeek, newBusinessesLastWeek),

      offersThisWeek: newOffersThisWeek,
      offersLastWeek: newOffersLastWeek,
      offersThisMonth: newOffersThisMonth,
      offersGrowthPct: pct(newOffersThisWeek, newOffersLastWeek),

      redemptionsThisWeek: redemptionsThisWeek,
      redemptionsLastWeek: redemptionsLastWeek,
      redemptionsGrowthPct: pct(redemptionsThisWeek, redemptionsLastWeek),
    },
    engagement: {
      redemptionsToday,
      redemptionsThisWeek,
      redemptionsThisMonth,
      uniqueRedeemersWeek: uniqueRedeemersWeek,
      avgRedemptionsPerUser,
      totalSavingsKopecks: totalSavings._sum.savedAmount ?? 0,
    },
    revenue: {
      totalRevenueKopecks: totalRevenue._sum.amount ?? 0,
      revenueThisMonthKopecks: revenueThisMonth._sum.amount ?? 0,
      activeSubscribers,
      mrrKopecks,
      canceledThisMonth,
    },
    demand: {
      openDemands,
      fulfilledDemands,
      totalDemands,
      conversionRate: demandConversionRate,
    },
    quality: {
      openComplaints,
      openFraudFlags,
      avgResolutionHours,
    },
    recentRedemptions: recentRedemptions.map((r) => ({
      id: r.id,
      userName: [r.user.firstName, r.user.lastName].filter(Boolean).join(' '),
      offerTitle: r.offer.title,
      placeName: r.branch.title,
      redeemedAt: r.redeemedAt,
    })),
  }

  return NextResponse.json(analytics)
}
