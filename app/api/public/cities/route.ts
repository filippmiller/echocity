import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cached } from '@/lib/cache'

const TEN_MINUTES = 10 * 60 * 1000

export async function GET() {
  try {
    const cities = await cached('public:cities', TEN_MINUTES, () =>
      prisma.city.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    )

    return NextResponse.json({ cities }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    })
  } catch (error) {
    logger.error('public.cities.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении списка городов' },
      { status: 500 }
    )
  }
}




