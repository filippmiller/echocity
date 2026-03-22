import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/streaks — get current streak info including freeze tokens (DB-backed)
 */
export async function GET() {
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

  const today = new Date().toISOString().split('T')[0]
  const lastDate = user.streakLastDate?.toISOString().split('T')[0] || null
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const currentStreak = user.streakCurrent || 0

  // Three mutually exclusive states
  const engagedToday = lastDate === today
  const isAtRisk = !engagedToday && lastDate === yesterday && currentStreak > 0
  const isBroken = !engagedToday && lastDate !== yesterday && currentStreak > 0

  return NextResponse.json({
    current: currentStreak,
    longest: user.streakLongest || 0,
    lastDate,
    freezeTokens: freezeTokensAvailable,
    isAtRisk,
    isBroken,
    engagedToday,
  })
}
