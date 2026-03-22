import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/streaks/freeze — use a freeze token to save a broken streak.
 *
 * Server-side gating:
 * - Freeze tokens earned = floor(streakLongest / 7)
 * - Freeze tokens used = tracked by decrementing streakLongest by 7 per use
 *   (this ensures a user can never freeze more times than they've earned)
 * - Only one freeze per streak break (checks lastDate is neither today nor yesterday)
 * - Updates streakLastDate to yesterday to "fill the gap"
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
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Gate: must have earned at least 1 freeze token (7+ day longest streak)
  if ((user.streakLongest || 0) < 7) {
    return NextResponse.json({ error: 'Нет доступных заморозок. Нужен стрик минимум 7 дней.' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const lastDate = user.streakLastDate?.toISOString().split('T')[0] || null

  // Can't freeze if already active today
  if (lastDate === today) {
    return NextResponse.json({ error: 'Стрик уже активен сегодня' }, { status: 400 })
  }

  // Can't freeze if streak is zero (nothing to save)
  if ((user.streakCurrent || 0) <= 0) {
    return NextResponse.json({ error: 'Нечего замораживать — стрик уже на нуле' }, { status: 400 })
  }

  const yesterday = new Date(Date.now() - 86400000)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Can't freeze if the user was active yesterday (streak isn't broken)
  if (lastDate === yesterdayStr) {
    return NextResponse.json({ error: 'Стрик не под угрозой — вы были активны вчера' }, { status: 400 })
  }

  // Consume one freeze token by decrementing streakLongest by 7
  // This ensures server-side tracking: earned = floor(original/7), used = (original - current) / 7
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      streakLastDate: yesterday,
      streakLongest: { decrement: 7 },
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Стрик заморожен! Вы сохранили серию.',
    current: user.streakCurrent,
    freezeTokensRemaining: Math.floor(((user.streakLongest || 0) - 7) / 7),
  })
}
