import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [cities, franchises, places] = await Promise.all([
      prisma.city.findMany({
        include: {
          franchise: {
            select: { id: true, status: true },
          },
          _count: {
            select: { places: true },
          },
        },
      }),
      prisma.franchise.findMany({
        include: {
          ownerUser: {
            select: { id: true },
          },
        },
      }),
      prisma.place.findMany({
        where: { cityId: { not: null } },
        select: {
          id: true,
          cityId: true,
          cityRelation: { select: { id: true } },
        },
      }),
    ])

    const citiesWithoutFranchise = cities
      .filter((city) => city.franchiseId && !city.franchise)
      .map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
        franchiseId: city.franchiseId,
      }))

    const franchisesWithoutOwner = franchises
      .filter((franchise) => !franchise.ownerUser)
      .map((franchise) => ({
        id: franchise.id,
        code: franchise.code,
        name: franchise.name,
        ownerUserId: franchise.ownerUserId,
      }))

    const placesWithInvalidCity = places
      .filter((place) => place.cityId && !place.cityRelation)
      .map((place) => ({
        id: place.id,
        cityId: place.cityId,
      }))

    const orphanedCities = cities
      .filter((city) => city._count.places === 0)
      .map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
      }))

    const report = {
      citiesWithoutFranchise,
      franchisesWithoutOwner,
      placesWithInvalidCity,
      orphanedCities,
      summary: {
        totalCities: cities.length,
        totalFranchises: franchises.length,
        totalPlaces: places.length,
        citiesWithoutFranchiseCount: citiesWithoutFranchise.length,
        franchisesWithoutOwnerCount: franchisesWithoutOwner.length,
        placesWithInvalidCityCount: placesWithInvalidCity.length,
        orphanedCitiesCount: orphanedCities.length,
      },
    }

    return NextResponse.json(report)
  } catch (error) {
    logger.error('admin.consistency.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при построении отчёта о консистентности' },
      { status: 500 }
    )
  }
}
