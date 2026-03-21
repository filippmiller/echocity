import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ places: [], offers: [] })
    }

    const q = query.trim()

    // Search places and offers in parallel
    const [places, offers] = await Promise.all([
      // Places search (same logic as /api/public/search)
      prisma.place.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
            { descriptionShort: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          reviews: {
            where: { isPublished: true, isDeleted: false },
            select: { rating: true },
          },
          _count: {
            select: {
              reviews: {
                where: { isPublished: true, isDeleted: false },
              },
            },
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),

      // Offers search
      prisma.offer.findMany({
        where: {
          lifecycleStatus: 'ACTIVE',
          approvalStatus: 'APPROVED',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { subtitle: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          branch: {
            select: {
              title: true,
              address: true,
            },
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Format places
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
      }
    })

    // Format offers
    const formattedOffers = offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      benefitType: offer.benefitType,
      benefitValue: Number(offer.benefitValue),
      visibility: offer.visibility,
      imageUrl: offer.imageUrl,
      offerType: offer.offerType,
      branchTitle: offer.branch?.title || null,
      branchAddress: offer.branch?.address || null,
    }))

    return NextResponse.json({ places: formattedPlaces, offers: formattedOffers })
  } catch (error) {
    logger.error('search.combined.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при поиске' },
      { status: 500 }
    )
  }
}
