import { prisma } from '@/lib/prisma'

export interface SuspiciousReviewSignal {
  id: string
  userId?: string
  placeId?: string
  offerId?: string
  entityType?: string
  entityId?: string
  reason: string
  createdAt: string
  meta?: Record<string, unknown>
}

export interface ReviewVelocityUser {
  userId: string
  reviewCount: number
  windowHours: number
}

export interface SuspiciousReviewSignals {
  rejectedPlaceReviews: {
    count: number
    items: SuspiciousReviewSignal[]
  }
  rejectedOfferReviews: {
    count: number
    items: SuspiciousReviewSignal[]
  }
  highVelocityUsers: {
    count: number
    items: ReviewVelocityUser[]
  }
  auditRejections: {
    count: number
    items: SuspiciousReviewSignal[]
  }
  webhookReviewFailures: {
    count: number
    items: SuspiciousReviewSignal[]
  }
  checkedAt: string
}

const DEFAULT_VELOCITY_WINDOW_HOURS = 24
const DEFAULT_VELOCITY_THRESHOLD = 5
const DEFAULT_SAMPLE_LIMIT = 50

/**
 * Aggregate suspicious review signals for the admin fraud view.
 *
 * Signals include:
 * - Place reviews that are unpublished or soft-deleted
 * - Offer reviews that are unpublished
 * - Users posting many reviews within a short window (review velocity)
 * - Audit log REJECT actions on REVIEW / OFFER_REVIEW entities
 * - Webhook logs with review-related events that failed or had invalid signatures
 */
export async function getSuspiciousReviewSignals(
  options: {
    velocityWindowHours?: number
    velocityThreshold?: number
    sampleLimit?: number
  } = {}
): Promise<SuspiciousReviewSignals> {
  const {
    velocityWindowHours = DEFAULT_VELOCITY_WINDOW_HOURS,
    velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
    sampleLimit = DEFAULT_SAMPLE_LIMIT,
  } = options

  const windowStart = new Date(Date.now() - velocityWindowHours * 60 * 60 * 1000)

  const [
    rejectedPlaceReviews,
    rejectedOfferReviews,
    recentPlaceReviews,
    recentOfferReviews,
    auditRejections,
    webhookReviewFailures,
  ] = await Promise.all([
    prisma.review.findMany({
      where: { OR: [{ isPublished: false }, { isDeleted: true }] },
      select: {
        id: true,
        userId: true,
        placeId: true,
        rating: true,
        body: true,
        isPublished: true,
        isDeleted: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: sampleLimit,
    }),
    prisma.offerReview.findMany({
      where: { isPublished: false },
      select: {
        id: true,
        userId: true,
        offerId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: sampleLimit,
    }),
    prisma.review.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { userId: true, createdAt: true },
    }),
    prisma.offerReview.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { userId: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: {
        action: 'REJECT',
        entityType: { in: ['REVIEW', 'OFFER_REVIEW'] },
      },
      select: {
        id: true,
        actorId: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: sampleLimit,
    }),
    prisma.webhookLog.findMany({
      where: {
        eventType: { contains: 'review', mode: 'insensitive' },
        status: { in: ['failed', 'invalid_signature'] },
      },
      select: {
        id: true,
        provider: true,
        eventType: true,
        status: true,
        error: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: sampleLimit,
    }),
  ])

  const reviewCountsByUser = new Map<string, number>()
  for (const review of [...recentPlaceReviews, ...recentOfferReviews]) {
    reviewCountsByUser.set(review.userId, (reviewCountsByUser.get(review.userId) || 0) + 1)
  }

  const highVelocityUsers = Array.from(reviewCountsByUser.entries())
    .filter(([, count]) => count >= velocityThreshold)
    .map(([userId, reviewCount]) => ({
      userId,
      reviewCount,
      windowHours: velocityWindowHours,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, sampleLimit)

  return {
    rejectedPlaceReviews: {
      count: rejectedPlaceReviews.length,
      items: rejectedPlaceReviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        placeId: review.placeId,
        reason: review.isDeleted
          ? 'Отзыв удалён'
          : review.isPublished
          ? 'Неизвестная причина'
          : 'Отзыв снят с публикации',
        createdAt: review.createdAt.toISOString(),
        meta: {
          rating: review.rating,
          bodyPreview: review.body.slice(0, 120),
        },
      })),
    },
    rejectedOfferReviews: {
      count: rejectedOfferReviews.length,
      items: rejectedOfferReviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        offerId: review.offerId,
        reason: 'Отзыв на предложение снят с публикации',
        createdAt: review.createdAt.toISOString(),
        meta: {
          rating: review.rating,
          commentPreview: review.comment?.slice(0, 120),
        },
      })),
    },
    highVelocityUsers: {
      count: highVelocityUsers.length,
      items: highVelocityUsers,
    },
    auditRejections: {
      count: auditRejections.length,
      items: auditRejections.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        entityType: log.entityType,
        entityId: log.entityId,
        reason: 'Отклонено через аудит-лог',
        createdAt: log.createdAt.toISOString(),
        meta: log.metadata as Record<string, unknown> | undefined,
      })),
    },
    webhookReviewFailures: {
      count: webhookReviewFailures.length,
      items: webhookReviewFailures.map((log) => ({
        id: log.id,
        reason: log.error || `Статус: ${log.status}`,
        createdAt: log.createdAt.toISOString(),
        meta: {
          provider: log.provider,
          eventType: log.eventType,
          status: log.status,
        },
      })),
    },
    checkedAt: new Date().toISOString(),
  }
}
