import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { getOrCreateUserXP } from '@/modules/gamification/service'
import { logger } from '@/lib/logger'

// GET /api/gamification/profile
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [userXp, missionStats, badgeCount] = await Promise.all([
      getOrCreateUserXP(session.userId),
      prisma.userMission.groupBy({
        by: ['status'],
        where: { userId: session.userId },
        _count: true,
      }),
      prisma.userBadge.count({ where: { userId: session.userId } }),
    ])

    const activeMissions =
      missionStats.find((s) => s.status === 'ACTIVE')?._count ?? 0
    const completedMissions =
      missionStats.find((s) => s.status === 'COMPLETED')?._count ?? 0

    // Calculate XP needed for next level
    // level = floor(sqrt(totalXp / 100)) + 1
    // To reach level L, need: (L-1)^2 * 100 XP
    const nextLevelXp = userXp.level * userXp.level * 100
    const prevLevelXp = (userXp.level - 1) * (userXp.level - 1) * 100
    const levelProgress = nextLevelXp > prevLevelXp
      ? ((userXp.totalXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100
      : 100

    return NextResponse.json({
      totalXp: userXp.totalXp,
      level: userXp.level,
      nextLevelXp,
      prevLevelXp,
      levelProgress: Math.min(Math.round(levelProgress), 100),
      activeMissions,
      completedMissions,
      badgeCount,
    })
  } catch (error) {
    logger.error('gamification.profile.get.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении профиля геймификации' },
      { status: 500 }
    )
  }
}
