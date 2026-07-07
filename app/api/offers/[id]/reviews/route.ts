import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { checkAndProgressMissions, checkBadgeEligibility } from '@/modules/gamification/service'
import { awardReviewCoins } from '@/modules/reviews/rewards'
import { getAllowedStoragePrefixes, hasRecentReview, isOwnStorageUrl } from '@/lib/reviews'
import { createAuditEntry } from '@/lib/audit'

const reviewSchema = z.object({
  redemptionId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(5000).optional(),
  photoUrls: z.array(z.string().url()).max(3).optional(),
})

const DAY_MS = 24 * 60 * 60 * 1000

async function logReviewRejection(
  actorId: string,
  actorRole: string,
  offerId: string,
  reason: string,
  metadata: Record<string, unknown>,
  req: NextRequest
) {
  try {
    await createAuditEntry({
      actorId,
      actorRole,
      action: 'REJECT',
      entityType: 'OFFER_REVIEW',
      entityId: offerId,
      metadata: { reason, ...metadata },
      req,
    })
  } catch {
    // Audit failure must not block the response
  }
}

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
        redemption: { select: { status: true } },
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
      // Verified marker is computed server-side from the linked redemption status.
      isVerifiedVisit: r.redemption.status === 'SUCCESS',
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

  let body: z.infer<typeof reviewSchema>
  try {
    body = reviewSchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { redemptionId, rating, comment, photoUrls } = body

  // Verify user owns this redemption and it's for this offer
  const redemption = await prisma.redemption.findUnique({
    where: { id: redemptionId },
    select: { userId: true, offerId: true, status: true },
  })

  if (!redemption) {
    return NextResponse.json({ error: 'Использование не найдено' }, { status: 404 })
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
    await logReviewRejection(
      session.userId,
      session.role,
      offerId,
      'MISSING_REDEMPTION_EVIDENCE',
      { redemptionId, redemptionStatus: redemption.status },
      request
    )
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

  // Anti-fraud: one review per offer per 24 hours
  const latestReview = await prisma.offerReview.findFirst({
    where: { offerId, userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  if (hasRecentReview(latestReview, new Date(), DAY_MS)) {
    await logReviewRejection(
      session.userId,
      session.role,
      offerId,
      'RATE_LIMIT_ABUSE',
      { lastReviewAt: latestReview?.createdAt },
      request
    )
    return NextResponse.json(
      { error: 'Вы уже оставляли отзыв на это предложение в последние 24 часа' },
      { status: 429 }
    )
  }

  // Anti-fraud: photo URLs must belong to the app's own storage
  if (photoUrls && photoUrls.length > 0) {
    const allowedPrefixes = getAllowedStoragePrefixes()
    const invalidUrl = photoUrls.find((url) => !isOwnStorageUrl(url, allowedPrefixes))
    if (invalidUrl) {
      await logReviewRejection(
        session.userId,
        session.role,
        offerId,
        'REJECTED_PHOTO_URL',
        { invalidUrl },
        request
      )
      return NextResponse.json(
        { error: 'Фото должны быть загружены в хранилище приложения' },
        { status: 400 }
      )
    }
  }

  // Create the review
  const review = await prisma.offerReview.create({
    data: {
      offerId,
      userId: session.userId,
      redemptionId,
      rating,
      comment: comment?.trim() || null,
      photoUrls: photoUrls || [],
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      redemption: { select: { status: true } },
    },
  })

  // Award coins for review (non-blocking)
  const hasPhotos = (photoUrls?.length ?? 0) > 0
  const coinReward = await awardReviewCoins(session.userId, review.id, hasPhotos).catch(() => null)

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
        isVerifiedVisit: review.redemption.status === 'SUCCESS',
      },
      coinReward: coinReward?.coins ?? 0,
    },
    { status: 201 }
  )
}
