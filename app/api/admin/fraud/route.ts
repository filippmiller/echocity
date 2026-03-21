import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { FraudFlagStatus } from '@prisma/client'

const VALID_FRAUD_STATUSES: FraudFlagStatus[] = ['OPEN', 'REVIEWED', 'DISMISSED']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statusParam = req.nextUrl.searchParams.get('status') || 'OPEN'
  const status: FraudFlagStatus = VALID_FRAUD_STATUSES.includes(statusParam as FraudFlagStatus)
    ? (statusParam as FraudFlagStatus)
    : 'OPEN'

  const flags = await prisma.fraudFlag.findMany({
    where: { status },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return NextResponse.json({ flags })
}
