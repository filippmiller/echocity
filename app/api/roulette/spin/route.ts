import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

// Simple in-memory rate limit: userId -> last spin date string
// Survives within a single server process; cleared on restart (acceptable for daily limit)
const spinLog = new Map<string, string>()

/**
 * GET /api/roulette/spin — spin the deal roulette
 * Returns a random active offer from the user's city.
 * Server-enforced: 1 spin per calendar day per user.
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти' }, { status: 401 })
  }

  const userId = session.userId
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // Server-side daily rate limit
  const lastSpin = spinLog.get(userId)
  if (lastSpin === todayStr) {
    return NextResponse.json(
      { error: 'Вы уже крутили сегодня. Приходите завтра!' },
      { status: 429 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { city: true },
  })

  const cityName = user?.city || 'Санкт-Петербург'

  // Get all active offers in user's city
  const offers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
      branch: { city: cityName, isActive: true },
    },
    include: {
      branch: { select: { title: true, address: true, nearestMetro: true } },
      merchant: { select: { name: true, isVerified: true } },
    },
  })

  if (offers.length === 0) {
    return NextResponse.json({ error: 'Нет доступных предложений для рулетки' }, { status: 404 })
  }

  // Record the spin BEFORE returning the result (prevents race conditions)
  spinLog.set(userId, todayStr)

  // Clean up old entries periodically (prevent memory leak)
  if (spinLog.size > 10000) {
    for (const [uid, date] of spinLog) {
      if (date !== todayStr) spinLog.delete(uid)
    }
  }

  // Pick a random offer
  const randomIndex = Math.floor(Math.random() * offers.length)
  const offer = offers[randomIndex]

  // Calculate expiry (4 hours from now)
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000)

  return NextResponse.json({
    offer: {
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      benefitType: offer.benefitType,
      benefitValue: Number(offer.benefitValue),
      imageUrl: offer.imageUrl,
      branchName: offer.branch.title,
      branchAddress: offer.branch.address,
      nearestMetro: offer.branch.nearestMetro,
      isVerified: offer.merchant.isVerified,
      visibility: offer.visibility,
      offerType: offer.offerType,
    },
    expiresAt: expiresAt.toISOString(),
    spunAt: now.toISOString(),
  })
}
