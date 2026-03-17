import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { getUserBadges } from '@/modules/gamification/service'
import { logger } from '@/lib/logger'

// GET /api/gamification/badges
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [userBadges, allBadges] = await Promise.all([
      getUserBadges(session.userId),
      prisma.badge.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const earnedCodes = new Set(userBadges.map((b) => b.code))

    const badges = allBadges.map((badge) => ({
      id: badge.id,
      code: badge.code,
      title: badge.title,
      description: badge.description,
      iconEmoji: badge.iconEmoji,
      category: badge.category,
      earned: earnedCodes.has(badge.code),
      earnedAt: userBadges.find((ub) => ub.code === badge.code)?.earnedAt ?? null,
    }))

    return NextResponse.json({
      badges,
      earnedCount: userBadges.length,
      totalCount: allBadges.length,
    })
  } catch (error) {
    logger.error('gamification.badges.get.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении значков' },
      { status: 500 }
    )
  }
}
