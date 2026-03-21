import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      where: {
        // Only return active cities
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ cities })
  } catch (error) {
    logger.error('public.cities.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении списка городов' },
      { status: 500 }
    )
  }
}




