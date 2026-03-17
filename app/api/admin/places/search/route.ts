import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') || ''
  const take = Math.min(Number(req.nextUrl.searchParams.get('take')) || 10, 30)

  if (q.length < 2) {
    return NextResponse.json({ places: [] })
  }

  const places = await prisma.place.findMany({
    where: {
      isActive: true,
      title: { contains: q, mode: 'insensitive' },
      businessId: { not: null },
    },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      businessId: true,
      business: { select: { id: true, name: true } },
    },
    take,
    orderBy: { title: 'asc' },
  })

  return NextResponse.json({ places })
}
