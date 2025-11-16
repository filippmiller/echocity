import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params

    // Check if place exists
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    })

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    // Get published reviews
    const reviews = await prisma.review.findMany({
      where: {
        placeId,
        isPublished: true,
        isDeleted: false,
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 reviews for now
    })

    // Format response with author name
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      visitDate: review.visitDate,
      createdAt: review.createdAt,
      authorName:
        review.user.profile?.fullName ||
        review.user.email.split('@')[0] ||
        'Анонимный пользователь',
    }))

    return NextResponse.json({ reviews: formattedReviews })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении отзывов' },
      { status: 500 }
    )
  }
}


