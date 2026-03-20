import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

// Moscow timezone offset is UTC+3
function getMoscowToday(): string {
  const now = new Date()
  const moscowOffset = 3 * 60 // minutes
  const localOffset = now.getTimezoneOffset() // minutes behind UTC (negative if ahead)
  const moscowTime = new Date(now.getTime() + (moscowOffset + localOffset) * 60 * 1000)
  const y = moscowTime.getFullYear()
  const m = String(moscowTime.getMonth() + 1).padStart(2, '0')
  const d = String(moscowTime.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateToString(date: Date): string {
  // Convert a stored UTC date to Moscow date string
  const moscowOffset = 3 * 60
  const moscowTime = new Date(date.getTime() + (moscowOffset - date.getTimezoneOffset()) * 60 * 1000)
  const y = moscowTime.getFullYear()
  const m = String(moscowTime.getMonth() + 1).padStart(2, '0')
  const dDay = String(moscowTime.getDate()).padStart(2, '0')
  return `${y}-${m}-${dDay}`
}

function moscowTodayAsUTC(): Date {
  // Store Moscow "today" as a UTC date at midnight Moscow time
  const todayStr = getMoscowToday()
  return new Date(`${todayStr}T00:00:00+03:00`)
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { streakCurrent: true, streakLongest: true, streakLastDate: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    streakCurrent: user.streakCurrent,
    streakLongest: user.streakLongest,
    streakLastDate: user.streakLastDate,
  })
}

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { streakCurrent: true, streakLongest: true, streakLastDate: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const todayStr = getMoscowToday()
  const lastDateStr = user.streakLastDate ? dateToString(user.streakLastDate) : null

  // Already counted today — no change needed
  if (lastDateStr === todayStr) {
    return NextResponse.json({
      streakCurrent: user.streakCurrent,
      streakLongest: user.streakLongest,
      streakLastDate: user.streakLastDate,
      updated: false,
    })
  }

  let newStreak = 1

  if (lastDateStr) {
    // Calculate yesterday in Moscow time
    const todayDate = new Date(`${todayStr}T00:00:00+03:00`)
    const yesterday = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayStr = dateToString(yesterday)

    if (lastDateStr === yesterdayStr) {
      // Consecutive day — extend streak
      newStreak = user.streakCurrent + 1
    } else {
      // Gap — reset streak
      newStreak = 1
    }
  }

  const newLongest = Math.max(user.streakLongest, newStreak)
  const newLastDate = moscowTodayAsUTC()

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      streakCurrent: newStreak,
      streakLongest: newLongest,
      streakLastDate: newLastDate,
    },
    select: { streakCurrent: true, streakLongest: true, streakLastDate: true },
  })

  return NextResponse.json({
    streakCurrent: updated.streakCurrent,
    streakLongest: updated.streakLongest,
    streakLastDate: updated.streakLastDate,
    updated: true,
  })
}
