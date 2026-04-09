import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/cache'

const TEN_MINUTES = 10 * 60 * 1000

export async function GET() {
  const categories = await cached('categories', TEN_MINUTES, () =>
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        serviceTypes: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
      take: 200,
    })
  )

  return NextResponse.json({ categories }, {
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
  })
}
