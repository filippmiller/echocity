import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockReviewFindMany,
  mockOfferReviewFindMany,
  mockAuditLogFindMany,
  mockWebhookLogFindMany,
} = vi.hoisted(() => ({
  mockReviewFindMany: vi.fn(),
  mockOfferReviewFindMany: vi.fn(),
  mockAuditLogFindMany: vi.fn(),
  mockWebhookLogFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    review: { findMany: mockReviewFindMany },
    offerReview: { findMany: mockOfferReviewFindMany },
    auditLog: { findMany: mockAuditLogFindMany },
    webhookLog: { findMany: mockWebhookLogFindMany },
  },
}))

import { getSuspiciousReviewSignals } from '@/modules/reviews/antifraud'

describe('reviews/antifraud suspicious signals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReviewFindMany.mockResolvedValue([])
    mockOfferReviewFindMany.mockResolvedValue([])
    mockAuditLogFindMany.mockResolvedValue([])
    mockWebhookLogFindMany.mockResolvedValue([])
  })

  it('returns zero counts when no suspicious signals exist', async () => {
    const signals = await getSuspiciousReviewSignals()

    expect(signals.rejectedPlaceReviews.count).toBe(0)
    expect(signals.rejectedOfferReviews.count).toBe(0)
    expect(signals.highVelocityUsers.count).toBe(0)
    expect(signals.auditRejections.count).toBe(0)
    expect(signals.webhookReviewFailures.count).toBe(0)
  })

  it('flags unpublished and deleted place reviews', async () => {
    mockReviewFindMany.mockImplementation((args: { where?: Record<string, unknown> }) => {
      const where = args?.where ?? {}
      if (where.OR) {
        return Promise.resolve([
          {
            id: 'review-1',
            userId: 'user-1',
            placeId: 'place-1',
            rating: 1,
            body: 'spam',
            isPublished: false,
            isDeleted: false,
            createdAt: new Date('2026-07-07T12:00:00.000Z'),
          },
          {
            id: 'review-2',
            userId: 'user-2',
            placeId: 'place-2',
            rating: 5,
            body: 'deleted',
            isPublished: true,
            isDeleted: true,
            createdAt: new Date('2026-07-07T12:00:00.000Z'),
          },
        ])
      }
      return Promise.resolve([])
    })

    const signals = await getSuspiciousReviewSignals()

    expect(signals.rejectedPlaceReviews.count).toBe(2)
    expect(signals.rejectedPlaceReviews.items[0].reason).toContain('снят с публикации')
    expect(signals.rejectedPlaceReviews.items[1].reason).toContain('удалён')
  })

  it('flags unpublished offer reviews', async () => {
    mockOfferReviewFindMany.mockImplementation((args: { where?: Record<string, unknown> }) => {
      const where = args?.where ?? {}
      if (where.isPublished === false) {
        return Promise.resolve([
          {
            id: 'offer-review-1',
            userId: 'user-1',
            offerId: 'offer-1',
            rating: 2,
            comment: 'bad',
            createdAt: new Date('2026-07-07T12:00:00.000Z'),
          },
        ])
      }
      return Promise.resolve([])
    })

    const signals = await getSuspiciousReviewSignals()

    expect(signals.rejectedOfferReviews.count).toBe(1)
    expect(signals.rejectedOfferReviews.items[0].offerId).toBe('offer-1')
  })

  it('detects high review velocity users', async () => {
    const now = new Date('2026-07-07T12:00:00.000Z')
    const recent = Array.from({ length: 6 }, () => ({
      userId: 'spammer',
      createdAt: now,
    }))

    mockReviewFindMany.mockImplementation((args: { where?: Record<string, unknown> }) => {
      const where = args?.where ?? {}
      if (where.createdAt) return Promise.resolve(recent)
      return Promise.resolve([])
    })
    mockOfferReviewFindMany.mockImplementation((args: { where?: Record<string, unknown> }) => {
      const where = args?.where ?? {}
      if (where.createdAt) return Promise.resolve([])
      return Promise.resolve([])
    })

    const signals = await getSuspiciousReviewSignals({ velocityThreshold: 5 })

    expect(signals.highVelocityUsers.count).toBe(1)
    expect(signals.highVelocityUsers.items[0]).toEqual({
      userId: 'spammer',
      reviewCount: 6,
      windowHours: 24,
    })
  })

  it('ignores users below the velocity threshold', async () => {
    mockReviewFindMany.mockImplementation((args: { where?: Record<string, unknown> }) => {
      const where = args?.where ?? {}
      if (where.createdAt) {
        return Promise.resolve([
          { userId: 'normal', createdAt: new Date('2026-07-07T12:00:00.000Z') },
          { userId: 'normal', createdAt: new Date('2026-07-07T11:00:00.000Z') },
        ])
      }
      return Promise.resolve([])
    })

    const signals = await getSuspiciousReviewSignals({ velocityThreshold: 5 })

    expect(signals.highVelocityUsers.count).toBe(0)
  })

  it('pulls audit log rejections for review entities', async () => {
    mockAuditLogFindMany.mockResolvedValue([
      {
        id: 'audit-1',
        actorId: 'admin-1',
        entityType: 'REVIEW',
        entityId: 'review-1',
        metadata: { reason: 'spam' },
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
      },
    ])

    const signals = await getSuspiciousReviewSignals()

    expect(signals.auditRejections.count).toBe(1)
    expect(signals.auditRejections.items[0].entityType).toBe('REVIEW')
  })

  it('pulls failed webhook logs for review events', async () => {
    mockWebhookLogFindMany.mockResolvedValue([
      {
        id: 'wh-1',
        provider: 'reviews-moderator',
        eventType: 'review.flagged',
        status: 'failed',
        error: 'timeout',
        createdAt: new Date('2026-07-07T12:00:00.000Z'),
      },
    ])

    const signals = await getSuspiciousReviewSignals()

    expect(signals.webhookReviewFailures.count).toBe(1)
    expect(signals.webhookReviewFailures.items[0].meta?.eventType).toBe('review.flagged')
  })
})
