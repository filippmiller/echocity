import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { getBusinessAccessSummary } from '@/lib/business-access'
import { canScanRedemptions } from '@/lib/permissions'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { merchantIds, access } = await getBusinessAccessSummary(session)
  if (!canScanRedemptions(access)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const where: { merchantId: { in: string[] }; scannedByUserId?: string; redeemedAt?: { gte: Date } } = {
    merchantId: { in: merchantIds },
  }

  // Cashiers only see their own scans from today
  if (access === 'cashier') {
    where.scannedByUserId = session.userId
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    where.redeemedAt = { gte: todayStart }
  }

  const redemptions = await prisma.redemption.findMany({
    where,
    include: {
      offer: { select: { title: true, benefitType: true, benefitValue: true } },
      user: { select: { firstName: true } },
      branch: { select: { title: true } },
    },
    orderBy: { redeemedAt: 'desc' },
    take: access === 'cashier' ? 200 : 100,
  })

  return NextResponse.json({ redemptions })
}
