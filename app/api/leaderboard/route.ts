import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leaderboard — neighborhood leaderboard
 * Returns top savers, reviewers, and redeemers for a city
 */
export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10') || 10, 20)

  // Get start of current month for monthly cycle
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Top savers this month
  const topSavers = await prisma.userSavings.groupBy({
    by: ['userId'],
    where: {
      savedAt: { gte: monthStart },
    },
    _sum: { savedAmount: true },
    orderBy: { _sum: { savedAmount: 'desc' } },
    take: limit,
  })

  // Top redeemers this month
  const topRedeemers = await prisma.redemption.groupBy({
    by: ['userId'],
    where: {
      status: 'SUCCESS',
      redeemedAt: { gte: monthStart },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  // Top reviewers this month
  const topReviewers = await prisma.offerReview.groupBy({
    by: ['userId'],
    where: {
      isPublished: true,
      createdAt: { gte: monthStart },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  // Fetch user details for all unique user IDs
  const allUserIds = [
    ...new Set([
      ...topSavers.map((s) => s.userId),
      ...topRedeemers.map((r) => r.userId),
      ...topReviewers.map((r) => r.userId),
    ]),
  ]

  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, firstName: true, lastName: true, city: true, profile: { select: { avatarUrl: true } } },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  const formatUser = (userId: string) => {
    const u = userMap.get(userId)
    return {
      id: userId,
      name: u ? [u.firstName, u.lastName?.[0]].filter(Boolean).join(' ') || 'Пользователь' : 'Пользователь',
      avatarUrl: u?.profile?.avatarUrl ?? null,
      city: u?.city ?? null,
    }
  }

  return NextResponse.json({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    savers: topSavers.map((s, i) => ({
      rank: i + 1,
      ...formatUser(s.userId),
      value: Math.floor((s._sum?.savedAmount ?? 0) / 100),
      unit: '₽',
    })),
    redeemers: topRedeemers.map((r, i) => ({
      rank: i + 1,
      ...formatUser(r.userId),
      value: r._count.id,
      unit: 'скидок',
    })),
    reviewers: topReviewers.map((r, i) => ({
      rank: i + 1,
      ...formatUser(r.userId),
      value: r._count.id,
      unit: 'отзывов',
    })),
  })
}
