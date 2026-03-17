import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { OfferApprovalStatus } from '@prisma/client'

const VALID_STATUSES: OfferApprovalStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawStatus = req.nextUrl.searchParams.get('status') || 'PENDING'
  const status = VALID_STATUSES.includes(rawStatus as OfferApprovalStatus)
    ? (rawStatus as OfferApprovalStatus)
    : 'PENDING'

  const take = Math.min(
    Number(req.nextUrl.searchParams.get('take')) || 50,
    200
  )

  const offers = await prisma.offer.findMany({
    where: { approvalStatus: status },
    include: {
      branch: { select: { id: true, title: true, address: true, city: true } },
      merchant: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
    take,
  })

  return NextResponse.json({ offers })
}
