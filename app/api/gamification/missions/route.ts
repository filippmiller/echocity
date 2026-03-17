import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getUserMissions, getAvailableMissions } from '@/modules/gamification/service'
import { logger } from '@/lib/logger'

// GET /api/gamification/missions
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [userMissions, availableMissions] = await Promise.all([
      getUserMissions(session.userId),
      getAvailableMissions(),
    ])

    const active = userMissions.filter((m) => m.status === 'ACTIVE')
    const completed = userMissions.filter((m) => m.status === 'COMPLETED')

    return NextResponse.json({
      missions: userMissions,
      active,
      completed,
      totalAvailable: availableMissions.length,
    })
  } catch (error) {
    logger.error('gamification.missions.get.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении миссий' },
      { status: 500 }
    )
  }
}
