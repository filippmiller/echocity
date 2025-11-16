import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params

    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: {
        id: true,
        title: true,
        city: true,
        address: true,
        phone: true,
        placeType: true,
      },
    })

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    return NextResponse.json({ place })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении информации о месте' },
      { status: 500 }
    )
  }
}


