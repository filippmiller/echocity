import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/cache'

const FIVE_MINUTES = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get('cityId')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  const cacheKey = `collections:${cityId || 'all'}:${limit}`
  const collections = await cached(cacheKey, FIVE_MINUTES, () =>
    prisma.collection.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        ...(cityId ? { OR: [{ cityId }, { cityId: null }] } : {}),
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          take: 10,
        },
      },
      orderBy: { sortOrder: 'asc' },
      take: limit,
    })
  )

  return NextResponse.json({ collections }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
