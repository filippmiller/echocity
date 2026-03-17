import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get('cityId')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  const collections = await prisma.collection.findMany({
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

  return NextResponse.json({ collections })
}
