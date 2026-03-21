import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/demand/trending — public endpoint for trending demand requests
 * Returns top demands by support count for a given city
 */
export async function GET(req: NextRequest) {
  const cityName = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '10') || 10, 1), 30)

  const city = await prisma.city.findFirst({
    where: { name: cityName },
    select: { id: true },
  })

  if (!city) {
    return NextResponse.json({ demands: [] })
  }

  const demands = await prisma.demandRequest.findMany({
    where: {
      cityId: city.id,
      status: { in: ['OPEN', 'COLLECTING'] },
    },
    orderBy: { supportCount: 'desc' },
    take: limit,
    include: {
      place: { select: { id: true, title: true, address: true } },
      category: { select: { id: true, name: true } },
      city: { select: { name: true } },
      _count: { select: { supports: true, responses: true } },
    },
  })

  return NextResponse.json({
    demands: demands.map((d) => ({
      id: d.id,
      placeName: d.place?.title ?? d.placeName ?? 'Любое заведение',
      placeId: d.placeId,
      placeAddress: d.place?.address ?? null,
      categoryName: d.category?.name ?? null,
      cityName: d.city.name,
      supportCount: d.supportCount,
      responseCount: d._count.responses,
      status: d.status,
      createdAt: d.createdAt,
    })),
  })
}
