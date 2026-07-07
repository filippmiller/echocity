import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET /api/districts?cityId=... or ?citySlug=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const citySlug = searchParams.get('citySlug')

    let city = null
    if (cityId) {
      city = await prisma.city.findUnique({ where: { id: cityId } })
    } else if (citySlug) {
      city = await prisma.city.findUnique({ where: { slug: citySlug } })
    }

    if (!city) {
      return NextResponse.json({ districts: [] })
    }

    const districts = await prisma.district.findMany({
      where: { cityId: city.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, lat: true, lng: true },
    })

    return NextResponse.json({ districts })
  } catch (error) {
    logger.error('districts.get.error', { error: String(error) })
    return NextResponse.json({ error: 'Ошибка при получении районов' }, { status: 500 })
  }
}
