import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') || 'PENDING'

  const offers = await prisma.offer.findMany({
    where: { approvalStatus: status as any },
    include: {
      branch: { select: { id: true, title: true, address: true, city: true } },
      merchant: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ offers })
}
