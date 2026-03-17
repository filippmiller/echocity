import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(10, 'Текст отзыва должен содержать минимум 10 символов'),
  visitDate: z.string().datetime().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if place exists
    const place = await prisma.place.findUnique({
      where: { id: id },
    })

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createReviewSchema.parse(body)

    const review = await prisma.review.create({
      data: {
        placeId: id,
        userId: session.userId,
        rating: validated.rating,
        title: validated.title,
        body: validated.body,
        visitDate: validated.visitDate ? new Date(validated.visitDate) : null,
        isPublished: true,
        isDeleted: false,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        visitDate: true,
        createdAt: true,
      },
    })

    logger.info('review.created', {
      reviewId: review.id,
      placeId: id,
      userId: session.userId,
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('review.create.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при создании отзыва' },
      { status: 500 }
    )
  }
}


