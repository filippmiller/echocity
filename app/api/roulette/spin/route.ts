import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/roulette/spin — spin the deal roulette
 * Returns a random active offer from the user's city
 * Time-limited: deal expires 4 hours after spin
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { city: true },
  })

  const cityName = user?.city || 'Санкт-Петербург'
  const now = new Date()

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
