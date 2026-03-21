import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

// GET /api/user/stats - Return user statistics
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      redemptionCount,
      favoritesCount,
      user,
      savingsAgg,
      activeSubscription,
    ] = await Promise.all([
      prisma.redemption.count({
        where: { userId: session.userId, status: 'SUCCESS' },
      }),
      prisma.favorite.count({
        where: { userId: session.userId },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          createdAt: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.userSavings.aggregate({
        where: { userId: session.userId },
        _sum: { savedAmount: true },
      }),
      prisma.userSubscription.findFirst({
        where: {
          userId: session.userId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
        include: {
          plan: {
            select: { code: true, name: true },
          },
        },
        orderBy: { startAt: 'desc' },
      }),
    ])

    const savedTotal = savingsAgg._sum.savedAmount || 0

    return NextResponse.json({
      redemptionCount,
      favoritesCount,
      memberSince: user?.createdAt || null,
      savedTotal,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      city: user?.city || '',
      avatarUrl: user?.profile?.avatarUrl || null,
      subscription: activeSubscription
        ? {
            planCode: activeSubscription.plan.code,
            planName: activeSubscription.plan.name,
            status: activeSubscription.status,
            endAt: activeSubscription.endAt,
          }
        : null,
    })
  } catch (error) {
    logger.error('user.stats.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при загрузке статистики' },
      { status: 500 }
    )
  }
}
