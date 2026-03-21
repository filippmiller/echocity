import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/offers/[id]/activity — recent redemption activity for social proof
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: offerId } = await params
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [recentCount, lastRedemption] = await Promise.all([
    prisma.redemption.count({
      where: { offerId, status: 'SUCCESS', redeemedAt: { gte: since } },
    }),
    prisma.redemption.findFirst({
      where: { offerId, status: 'SUCCESS' },
      orderBy: { redeemedAt: 'desc' },
      select: { redeemedAt: true },
    }),
  ])

  const lastRedeemedMinutesAgo = lastRedemption
    ? Math.floor((Date.now() - new Date(lastRedemption.redeemedAt).getTime()) / 60000)
    : null

  return NextResponse.json({ recentCount, lastRedeemedMinutesAgo })
}
