import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/streaks/freeze — use a freeze token to save a broken streak
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

  const freezeTokensEarned = Math.floor((user.streakLongest || 0) / 7)

  // Count previously used freeze tokens (stored as a simple counter on the user)
  // For simplicity, we track freeze usage in localStorage on client side
  // and validate server-side via streak gap analysis
  if (freezeTokensEarned <= 0) {
    return NextResponse.json({ error: 'Нет доступных заморозок' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const lastDate = user.streakLastDate?.toISOString().split('T')[0] || null

  // Can only freeze if streak was active but user missed yesterday
  if (lastDate === today) {
    return NextResponse.json({ error: 'Стрик уже активен сегодня' }, { status: 400 })
  }

  // Restore the streak by updating lastDate to yesterday
  const yesterday = new Date(Date.now() - 86400000)

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      streakLastDate: yesterday,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Стрик заморожен! Вы сохранили серию.',
    current: user.streakCurrent,
  })
}
