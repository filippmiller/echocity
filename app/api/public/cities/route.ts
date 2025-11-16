import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    console.error('Cities error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка городов' },
      { status: 500 }
    )
  }
}


