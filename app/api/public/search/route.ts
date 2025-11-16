import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const cityId = searchParams.get('cityId')
    const serviceTypeId = searchParams.get('serviceTypeId')

    // Build where clause
    const where: any = {
      isActive: true,
      OR: [
        { isPublished: true },
        { isApproved: true },
      ],
    }

    if (cityId) {
      where.cityId = cityId
    }

    if (query) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { descriptionShort: { contains: query, mode: 'insensitive' } },
      ]
    }

    // If searching by service type, filter places that have this service
    if (serviceTypeId) {
      where.services = {
        some: {
          serviceTypeId,
          isActive: true,
        },
      }
    }

    const places = await prisma.place.findMany({
      where,
      include: {
        services: {
          where: {
            isActive: true,
            ...(serviceTypeId ? { serviceTypeId } : {}),
          },
          include: {
            serviceType: {
              select: {
                name: true,
              },
            },
          },
          take: 5,
        },
        reviews: {
          where: {
            isPublished: true,
            isDeleted: false,
          },
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: {
              where: {
                isPublished: true,
                isDeleted: false,
              },
            },
          },
        },
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format response with average rating
    const formattedPlaces = places.map((place) => {
      const reviews = place.reviews || []
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null

      return {
        id: place.id,
        name: place.title || 'Без названия',
        address: place.addressLine1 || place.address,
        city: place.city,
        placeType: place.placeType,
        averageRating,
        reviewCount: place._count.reviews,
        services: place.services.map((s) => ({
          name: s.name || s.serviceType.name,
          price: s.price ? Number(s.price) : null,
        })),
      }
    })

    return NextResponse.json({ places: formattedPlaces })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Ошибка при поиске' },
      { status: 500 }
    )
  }
}


