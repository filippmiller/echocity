import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  const redemptions = await prisma.redemption.findMany({
    where: { merchantId: { in: merchantIds } },
    include: {
      offer: { select: { title: true, benefitType: true, benefitValue: true } },
      user: { select: { firstName: true } },
      branch: { select: { title: true } },
    },
    orderBy: { redeemedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ redemptions })
}
