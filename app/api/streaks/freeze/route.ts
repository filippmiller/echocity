import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/streaks/freeze — use a freeze token to save a broken streak.
 *
 * Freeze tokens earned = floor(streakLongest / 7)
 * Freeze tokens used = tracked in freezeTokensUsed DB field
 * Available = earned - used
 */
export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      streakCurrent: true,
      streakLongest: true,
      streakLastDate: true,
      freezeTokensUsed: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const freezeTokensEarned = Math.floor((user.streakLongest || 0) / 7)
  const freezeTokensAvailable = freezeTokensEarned - (user.freezeTokensUsed || 0)

  if (freezeTokensAvailable <= 0) {
    return NextResponse.json({ error: 'Нет доступных заморозок' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const lastDate = user.streakLastDate?.toISOString().split('T')[0] || null

  if (lastDate === today) {
    return NextResponse.json({ error: 'Стрик уже активен сегодня' }, { status: 400 })
  }

  if ((user.streakCurrent || 0) <= 0) {
    return NextResponse.json({ error: 'Нечего замораживать — стрик уже на нуле' }, { status: 400 })
  }

  const yesterday = new Date(Date.now() - 86400000)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastDate === yesterdayStr) {
    return NextResponse.json({ error: 'Стрик не под угрозой — вы были активны вчера' }, { status: 400 })
  }

  // Consume one freeze token (DB-tracked) and fill the gap
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      streakLastDate: yesterday,
      freezeTokensUsed: { increment: 1 },
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Стрик заморожен! Вы сохранили серию.',
    current: user.streakCurrent,
    freezeTokensRemaining: freezeTokensAvailable - 1,
  })
}
