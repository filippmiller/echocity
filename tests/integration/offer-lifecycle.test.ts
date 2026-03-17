import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrismaClient, resetMockPrisma } from '../mocks/prisma'
import type { MockPrismaClient } from '../mocks/prisma'

/**
 * Integration test: Offer lifecycle with mocked Prisma.
 *
 * Simulates the full offer flow:
 *   DRAFT → PENDING (submit) → APPROVED/ACTIVE (approve) → validate → EXPIRED (expire)
 *
 * All Prisma calls are mocked — no database required.
 */

let mockPrisma: MockPrismaClient

// We need to mock @/lib/prisma before importing the service
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

// Mock the logger to avoid noise
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Import after mocks are in place
const {
  createOffer,
  submitForModeration,
  approveOffer,
  validateOfferForRedemption,
  expireOffers,
} = await import('@/modules/offers/service')

beforeEach(() => {
  mockPrisma = createMockPrismaClient()
  resetMockPrisma(mockPrisma)
})

describe('Offer Lifecycle', () => {
  const userId = 'user-1'
  const merchantId = 'merchant-1'
  const offerId = 'offer-1'
  const branchId = 'branch-1'

  it('creates an offer in DRAFT / INACTIVE state', async () => {
    const created = {
      id: offerId,
      title: 'Test Offer',
      approvalStatus: 'DRAFT',
      lifecycleStatus: 'INACTIVE',
      merchantId,
      branchId,
    }
    mockPrisma.offer.create.mockResolvedValue(created)

    const result = await createOffer(
      {
        title: 'Test Offer',
        merchantId,
        branchId,
        offerType: 'PERCENT_DISCOUNT',
        benefitType: 'PERCENT',
        benefitValue: 10,
        startAt: new Date().toISOString(),
      } as any,
      userId,
    )

    expect(result.approvalStatus).toBe('DRAFT')
    expect(result.lifecycleStatus).toBe('INACTIVE')
    expect(mockPrisma.offer.create).toHaveBeenCalledTimes(1)
  })

  it('submits a DRAFT offer for moderation (DRAFT → PENDING)', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      approvalStatus: 'DRAFT',
      merchant: { ownerId: userId },
    })
    mockPrisma.offer.update.mockResolvedValue({
      id: offerId,
      approvalStatus: 'PENDING',
    })

    const result = await submitForModeration(offerId, userId)

    expect(result.approvalStatus).toBe('PENDING')
    expect(mockPrisma.offer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: offerId },
        data: { approvalStatus: 'PENDING' },
      }),
    )
  })

  it('rejects submit if offer is not in DRAFT or REJECTED status', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      approvalStatus: 'APPROVED',
      merchant: { ownerId: userId },
    })

    await expect(submitForModeration(offerId, userId)).rejects.toThrow(
      'Offer can only be submitted from DRAFT or REJECTED status',
    )
  })

  it('rejects submit if user is not the merchant owner', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      approvalStatus: 'DRAFT',
      merchant: { ownerId: 'someone-else' },
    })

    await expect(submitForModeration(offerId, userId)).rejects.toThrow('Not authorized')
  })

  it('approves a PENDING offer and activates it (PENDING → APPROVED/ACTIVE)', async () => {
    const pastStart = new Date(Date.now() - 86400000) // yesterday
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      approvalStatus: 'PENDING',
      startAt: pastStart,
    })
    mockPrisma.offer.update.mockResolvedValue({
      id: offerId,
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
    })

    const result = await approveOffer(offerId)

    expect(result.approvalStatus).toBe('APPROVED')
    expect(result.lifecycleStatus).toBe('ACTIVE')
    expect(mockPrisma.offer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvalStatus: 'APPROVED',
          lifecycleStatus: 'ACTIVE',
        }),
      }),
    )
  })

  it('approves a future-start offer as SCHEDULED instead of ACTIVE', async () => {
    const futureStart = new Date(Date.now() + 86400000 * 7) // next week
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      approvalStatus: 'PENDING',
      startAt: futureStart,
    })
    mockPrisma.offer.update.mockResolvedValue({
      id: offerId,
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'SCHEDULED',
    })

    const result = await approveOffer(offerId)

    expect(result.lifecycleStatus).toBe('SCHEDULED')
    expect(mockPrisma.offer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvalStatus: 'APPROVED',
          lifecycleStatus: 'SCHEDULED',
        }),
      }),
    )
  })

  it('rejects approve if offer is not PENDING', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      approvalStatus: 'DRAFT',
    })

    await expect(approveOffer(offerId)).rejects.toThrow('Invalid offer state')
  })

  it('validates an ACTIVE offer successfully', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      lifecycleStatus: 'ACTIVE',
      visibility: 'PUBLIC',
      schedules: [],
      rules: [],
      limits: null,
      blackoutDates: [],
    })

    const result = await validateOfferForRedemption(offerId, userId)

    expect(result.valid).toBe(true)
  })

  it('rejects validation for non-existent offer', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue(null)

    const result = await validateOfferForRedemption('nonexistent', userId)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('OFFER_NOT_FOUND')
  })

  it('rejects validation for inactive offer', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      lifecycleStatus: 'PAUSED',
      visibility: 'PUBLIC',
      schedules: [],
      rules: [],
      limits: null,
      blackoutDates: [],
    })

    const result = await validateOfferForRedemption(offerId, userId)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('OFFER_NOT_ACTIVE')
  })

  it('rejects MEMBERS_ONLY offer when user has no subscription', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      lifecycleStatus: 'ACTIVE',
      visibility: 'MEMBERS_ONLY',
      schedules: [],
      rules: [],
      limits: null,
      blackoutDates: [],
    })
    mockPrisma.userSubscription = {
      ...mockPrisma.offer, // reuse shape
      findFirst: vi.fn().mockResolvedValue(null),
    } as any

    const result = await validateOfferForRedemption(offerId, userId)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('SUBSCRIPTION_REQUIRED')
  })

  it('expires offers past their endAt date', async () => {
    mockPrisma.offer.updateMany.mockResolvedValue({ count: 3 })

    const count = await expireOffers()

    expect(count).toBe(3)
    expect(mockPrisma.offer.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lifecycleStatus: 'ACTIVE',
          endAt: expect.any(Object),
        }),
        data: { lifecycleStatus: 'EXPIRED' },
      }),
    )
  })
})
