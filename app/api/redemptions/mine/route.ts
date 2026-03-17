import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const offerId = req.nextUrl.searchParams.get('offerId') || undefined
  const unreviewedOnly = req.nextUrl.searchParams.get('unreviewedOnly') === '1'

  const redemptions = await prisma.redemption.findMany({
    where: {
      userId: session.userId,
      status: 'SUCCESS',
      ...(offerId ? { offerId } : {}),
      ...(unreviewedOnly ? { offerReview: null } : {}),
    },
    include: {
      offer: { select: { title: true } },
      branch: { select: { title: true } },
      offerReview: { select: { id: true } },
    },
    orderBy: { redeemedAt: 'desc' },
  })

  return NextResponse.json({
    redemptions: redemptions.map((r) => ({
      id: r.id,
      offerId: r.offerId,
      offerTitle: r.offer.title,
      branchName: r.branch.title,
      redeemedAt: r.redeemedAt.toISOString(),
      hasReview: r.offerReview !== null,
    })),
  })
}
