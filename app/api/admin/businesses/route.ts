import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { BusinessStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') as BusinessStatus | null

  const businesses = await prisma.business.findMany({
    where: status ? { status } : {},
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      _count: { select: { places: true, offers: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ businesses })
}
