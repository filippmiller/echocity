import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { checkAndProgressMissions, checkBadgeEligibility } from '@/modules/gamification/service'

/**
 * GET /api/offers/[id]/reviews — list published reviews for an offer (public, paginated)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: offerId } = await params
  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const skip = (page - 1) * limit

  const [reviews, total, avgResult] = await Promise.all([
    prisma.offerReview.findMany({
      where: { offerId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.offerReview.count({ where: { offerId, isPublished: true } }),
    prisma.offerReview.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { offerId, isPublished: true },
    }),
  ])

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      photoUrls: r.photoUrls,
      createdAt: r.createdAt,
      authorName: [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || 'Пользователь',
    })),
    total,
    page,
    limit,
    avgRating: avgResult._avg.rating ? Math.round(avgResult._avg.rating * 10) / 10 : null,
    reviewCount: avgResult._count.rating,
  })
}

/**
 * POST /api/offers/[id]/reviews — create a review (auth required, must have redeemed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  const { id: offerId } = await params
  const body = await request.json()
  const { redemptionId, rating, comment, photoUrls } = body

  // Validate rating
  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Оценка должна быть от 1 до 5' },
      { status: 400 }
    )
  }

  // Validate redemptionId provided
  if (!redemptionId || typeof redemptionId !== 'string') {
    return NextResponse.json(
      { error: 'Необходимо указать redemptionId' },
      { status: 400 }
    )
  }

  // Verify user owns this redemption and it's for this offer
  const redemption = await prisma.redemption.findUnique({
    where: { id: redemptionId },
    select: { userId: true, offerId: true, status: true },
  })

  if (!redemption) {
    return NextResponse.json(
      { error: 'Использование не найдено' },
      { status: 404 }
    )
  }

  if (redemption.userId !== session.userId) {
    return NextResponse.json(
      { error: 'Вы не можете оставить отзыв на чужое использование' },
      { status: 403 }
    )
  }

  if (redemption.offerId !== offerId) {
    return NextResponse.json(
      { error: 'Это использование не относится к данному предложению' },
      { status: 400 }
    )
  }

  if (redemption.status !== 'SUCCESS') {
    return NextResponse.json(
      { error: 'Можно оставить отзыв только на успешное использование' },
      { status: 400 }
    )
  }

  // Check for duplicate review on this redemption
  const existing = await prisma.offerReview.findUnique({
    where: { redemptionId },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Вы уже оставили отзыв на это использование' },
      { status: 409 }
    )
  }

  // Validate photoUrls if provided
  const validatedPhotoUrls: string[] = []
  if (Array.isArray(photoUrls)) {
    for (const url of photoUrls.slice(0, 3)) {
      if (typeof url === 'string' && url.startsWith('http')) {
        validatedPhotoUrls.push(url)
      }
    }
  }

  // Create the review
  const review = await prisma.offerReview.create({
    data: {
      offerId,
      userId: session.userId,
      redemptionId,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
      photoUrls: validatedPhotoUrls,
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  })

  // Non-blocking gamification progress
  checkAndProgressMissions(session.userId, 'review').catch(() => {})
  checkBadgeEligibility(session.userId).catch(() => {})

  return NextResponse.json(
    {
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        photoUrls: review.photoUrls,
        createdAt: review.createdAt,
        authorName: [review.user.firstName, review.user.lastName].filter(Boolean).join(' ') || 'Пользователь',
      },
    },
    { status: 201 }
  )
}
