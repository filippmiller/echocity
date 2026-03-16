import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '20') || 20, 1), 100)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0') || 0, 0)

  const redemptions = await prisma.redemption.findMany({
    where: { userId: session.userId },
    include: {
      offer: { select: { id: true, title: true, benefitType: true, benefitValue: true, imageUrl: true } },
      branch: { select: { id: true, title: true, address: true } },
    },
    orderBy: { redeemedAt: 'desc' },
    take: limit,
    skip: offset,
  })

  return NextResponse.json({ redemptions })
}
