import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/offers/hot — "What's Hot Right Now" aggregation
 * Returns offers with urgency signals: flash deals, expiring soon, high recent activity, almost sold out
 */
export async function GET(req: NextRequest) {
  const cityName = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const now = new Date()

  // Parallel queries for different "hot" signals
  const [flashDeals, expiringSoon, recentlyRedeemed, almostGone] = await Promise.all([
    // 1. Flash deals active right now
    prisma.offer.findMany({
      where: {
        offerType: 'FLASH',
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gt: now } }],
        branch: { city: cityName, isActive: true },
      },
      include: {
        branch: { select: { title: true, address: true, nearestMetro: true } },
        merchant: { select: { name: true, isVerified: true } },
        _count: { select: { redemptions: true } },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),

    // 2. Offers expiring within the next 6 hours
    prisma.offer.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        branch: { city: cityName, isActive: true },
        endAt: {
          gt: now,
          lte: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        },
      },
      include: {
        branch: { select: { title: true, address: true, nearestMetro: true } },
        merchant: { select: { name: true, isVerified: true } },
        _count: { select: { redemptions: true } },
      },
      take: 3,
      orderBy: { endAt: 'asc' },
    }),

    // 3. Most redeemed in the last 2 hours
    prisma.redemption.groupBy({
      by: ['offerId'],
      where: {
        status: 'SUCCESS',
        redeemedAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        offer: {
          lifecycleStatus: 'ACTIVE',
          approvalStatus: 'APPROVED',
          branch: { city: cityName, isActive: true },
        },
      },
      _count: { offerId: true },
      orderBy: { _count: { offerId: 'desc' } },
      take: 3,
    }),

    // 4. Offers with > 80% of total limit used
    prisma.offer.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        branch: { city: cityName, isActive: true },
        limits: { totalLimit: { gt: 0 } },
      },
      include: {
        branch: { select: { title: true, address: true, nearestMetro: true } },
        merchant: { select: { name: true, isVerified: true } },
        limits: true,
        _count: { select: { redemptions: true } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Fetch full offer details for recently redeemed
  const recentOfferIds = recentlyRedeemed.map((r) => r.offerId)
  const recentOffers = recentOfferIds.length > 0
    ? await prisma.offer.findMany({
        where: { id: { in: recentOfferIds } },
        include: {
          branch: { select: { title: true, address: true, nearestMetro: true } },
          merchant: { select: { name: true, isVerified: true } },
          _count: { select: { redemptions: true } },
        },
      })
    : []

  // Filter "almost gone" to offers actually near their limit
  const almostGoneFiltered = almostGone.filter((o) => {
    const total = o.limits?.totalLimit ?? 0
    const used = o._count.redemptions
    return total > 0 && used / total >= 0.8
  })

  // Serialize a unified format
  const serialize = (offer: any, hotReason: string) => ({
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle,
    benefitType: offer.benefitType,
    benefitValue: Number(offer.benefitValue),
    offerType: offer.offerType,
    visibility: offer.visibility,
    imageUrl: offer.imageUrl,
    branchName: offer.branch?.title ?? '',
    branchAddress: offer.branch?.address ?? '',
    nearestMetro: offer.branch?.nearestMetro ?? null,
    isVerified: offer.merchant?.isVerified ?? false,
    redemptionCount: offer._count?.redemptions ?? 0,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    expiresAt: offer.endAt?.toISOString() ?? null,
    isFlash: offer.offerType === 'FLASH',
    hotReason,
  })

  // Deduplicate by offer ID, keeping earliest reason
  const seen = new Set<string>()
  const hotOffers: ReturnType<typeof serialize>[] = []

  const addIfNew = (offer: any, reason: string) => {
    if (!seen.has(offer.id)) {
      seen.add(offer.id)
      hotOffers.push(serialize(offer, reason))
    }
  }

  flashDeals.forEach((o) => addIfNew(o, 'flash'))
  expiringSoon.forEach((o) => addIfNew(o, 'expiring'))
  recentOffers.forEach((o) => addIfNew(o, 'popular_now'))
  almostGoneFiltered.slice(0, 3).forEach((o) => addIfNew(o, 'almost_gone'))

  return NextResponse.json({ hotOffers })
}
