import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/streaks — get current streak info including freeze tokens
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
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Calculate freeze tokens: 1 per 7-day milestone achieved
  const freezeTokensEarned = Math.floor((user.streakLongest || 0) / 7)

  // Check if streak is at risk (hasn't engaged today)
  const today = new Date().toISOString().split('T')[0]
  const lastDate = user.streakLastDate?.toISOString().split('T')[0] || null
  const isAtRisk = lastDate !== today && (user.streakCurrent || 0) > 0

  // Check if streak was actually broken (missed yesterday too)
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const isBroken = lastDate !== today && lastDate !== yesterday && (user.streakCurrent || 0) > 0

  return NextResponse.json({
    current: user.streakCurrent || 0,
    longest: user.streakLongest || 0,
    lastDate,
    freezeTokens: freezeTokensEarned,
    isAtRisk,
    isBroken,
    engagedToday: lastDate === today,
  })
}
