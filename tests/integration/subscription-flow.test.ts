import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrismaClient, resetMockPrisma } from '../mocks/prisma'
import type { MockPrismaClient } from '../mocks/prisma'

/**
 * Integration test: Subscription flow with mocked Prisma.
 *
 * Covers:
 *   - Cannot subscribe to free plan
 *   - Valid plan creates subscription
 *   - Cancel updates subscription
 *   - Expire cron job marks past-due subs as expired
 */

let mockPrisma: MockPrismaClient

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const {
  createSubscription,
  cancelSubscription,
  getUserSubscription,
  expireSubscriptions,
} = await import('@/modules/subscriptions/service')

beforeEach(() => {
  mockPrisma = createMockPrismaClient()
  resetMockPrisma(mockPrisma)

  // Add subscriptionPlan and userSubscription models to mock
  mockPrisma.subscriptionPlan = {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(null),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  }
  mockPrisma.userSubscription = {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(null),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(null),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  }
})

const userId = 'user-sub-1'

describe('Subscription Flow — Create', () => {
  it('throws when subscribing to free plan', async () => {
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: 'plan-free',
      code: 'free',
      name: 'Free',
      priceMonthly: 0,
      trialDays: 0,
      isActive: true,
    })

    await expect(createSubscription(userId, 'free')).rejects.toThrow(
      'Cannot subscribe to free plan',
    )
  })

  it('throws when plan does not exist', async () => {
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(null)

    await expect(createSubscription(userId, 'nonexistent')).rejects.toThrow('Plan not found')
  })

  it('creates ACTIVE subscription for a paid plan with no trial', async () => {
    const plan = {
      id: 'plan-plus',
      code: 'plus',
      name: 'Plus',
      priceMonthly: 299,
      trialDays: 0,
      isActive: true,
    }
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(plan)

    const created = {
      id: 'sub-1',
      userId,
      planId: plan.id,
      status: 'ACTIVE',
      autoRenew: true,
    }
    mockPrisma.userSubscription.create.mockResolvedValue(created)

    const result = await createSubscription(userId, 'plus')

    expect(result.status).toBe('ACTIVE')
    expect(mockPrisma.userSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          autoRenew: true,
        }),
      }),
    )
  })

  it('creates TRIALING subscription for a plan with trial days', async () => {
    const plan = {
      id: 'plan-premium',
      code: 'premium',
      name: 'Premium',
      priceMonthly: 599,
      trialDays: 7,
      isActive: true,
    }
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(plan)

    const created = {
      id: 'sub-2',
      userId,
      planId: plan.id,
      status: 'TRIALING',
      autoRenew: true,
    }
    mockPrisma.userSubscription.create.mockResolvedValue(created)

    const result = await createSubscription(userId, 'premium')

    expect(result.status).toBe('TRIALING')
    expect(mockPrisma.userSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'TRIALING',
        }),
      }),
    )
  })
})

describe('Subscription Flow — Cancel', () => {
  it('throws when user has no active subscription', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null)

    await expect(cancelSubscription(userId)).rejects.toThrow('No active subscription')
  })

  it('sets autoRenew=false and records canceledAt', async () => {
    const existingSub = {
      id: 'sub-active',
      userId,
      status: 'ACTIVE',
      autoRenew: true,
    }
    mockPrisma.userSubscription.findFirst.mockResolvedValue(existingSub)
    mockPrisma.userSubscription.update.mockResolvedValue({
      ...existingSub,
      autoRenew: false,
      canceledAt: new Date(),
    })

    const result = await cancelSubscription(userId)

    expect(result.autoRenew).toBe(false)
    expect(result.canceledAt).toBeDefined()
    expect(mockPrisma.userSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existingSub.id },
        data: expect.objectContaining({
          autoRenew: false,
          canceledAt: expect.any(Date),
        }),
      }),
    )
  })
})

describe('Subscription Flow — Get User Subscription', () => {
  it('returns free status when no active subscription exists', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null)

    const result = await getUserSubscription(userId)

    expect(result.isSubscribed).toBe(false)
    expect(result.planCode).toBe('free')
    expect(result.status).toBeNull()
  })

  it('returns active subscription data when subscribed', async () => {
    const endAt = new Date(Date.now() + 30 * 86400000)
    mockPrisma.userSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      userId,
      status: 'ACTIVE',
      plan: { code: 'plus' },
      endAt,
    })

    const result = await getUserSubscription(userId)

    expect(result.isSubscribed).toBe(true)
    expect(result.planCode).toBe('plus')
    expect(result.status).toBe('ACTIVE')
    expect(result.endAt).toBe(endAt)
  })
})

describe('Subscription Flow — Expire (Cron)', () => {
  it('expires past-due subscriptions with autoRenew=false', async () => {
    mockPrisma.userSubscription.updateMany.mockResolvedValue({ count: 5 })

    const count = await expireSubscriptions()

    expect(count).toBe(5)
    expect(mockPrisma.userSubscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: expect.objectContaining({ in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] }),
          endAt: expect.any(Object),
          autoRenew: false,
        }),
        data: { status: 'EXPIRED' },
      }),
    )
  })

  it('returns 0 when nothing to expire', async () => {
    mockPrisma.userSubscription.updateMany.mockResolvedValue({ count: 0 })

    const count = await expireSubscriptions()

    expect(count).toBe(0)
  })
})
