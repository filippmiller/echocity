import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/group-deals/by-offer/[offerId]
 * Get active group deals for a specific offer (public — shows groups to join)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params

  const now = new Date()

  // Expire stale groups first
  await prisma.groupDeal.updateMany({
    where: {
      offerId,
      status: { in: ['OPEN', 'READY'] },
      expiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  const groupDeals = await prisma.groupDeal.findMany({
    where: {
      offerId,
      status: { in: ['OPEN', 'READY'] },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return NextResponse.json({ groupDeals })
}
