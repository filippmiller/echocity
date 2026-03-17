import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const take = Math.min(Number(searchParams.get('limit') || 20), 50)

  // Get all businesses owned by this user
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  if (merchantIds.length === 0) {
    return NextResponse.json({ demands: [], nextCursor: null })
  }

  // Get all place IDs belonging to merchant's businesses
  const places = await prisma.place.findMany({
    where: { businessId: { in: merchantIds }, isActive: true },
    select: { id: true },
  })
  const placeIds = places.map((p) => p.id)

  if (placeIds.length === 0) {
    return NextResponse.json({ demands: [], nextCursor: null })
  }

  // Fetch demand requests targeting merchant's places
  const demands = await prisma.demandRequest.findMany({
    where: {
      placeId: { in: placeIds },
      status: { in: ['OPEN', 'COLLECTING'] },
    },
    include: {
      place: {
        select: { id: true, title: true, address: true, city: true },
      },
      category: {
        select: { id: true, name: true },
      },
      responses: {
        where: { merchantId: { in: merchantIds } },
        include: {
          offer: {
            select: { id: true, title: true },
          },
        },
      },
      _count: {
        select: { supports: true },
      },
    },
    orderBy: { supportCount: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  let nextCursor: string | null = null
  if (demands.length > take) {
    const last = demands.pop()!
    nextCursor = last.id
  }

  return NextResponse.json({ demands, nextCursor })
}
