import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrismaClient, type MockPrismaClient } from '../mocks/prisma'

let mockPrisma: MockPrismaClient

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

import {
  checkReferralEligibility,
  markReferralEligible,
  listReferralsForAdmin,
} from '@/modules/referrals/service'

function makeReferral(overrides: Partial<{ id: string; status: string; invitedUserId: string }> = {}) {
  return {
    id: 'ref-1',
    referralCodeId: 'code-1',
    invitedUserId: 'invited-1',
    status: 'PENDING',
    rewardGranted: false,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('modules/referrals/service', () => {
  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
    vi.clearAllMocks()
  })

  describe('checkReferralEligibility', () => {
    it('returns not eligible when no referral exists', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(null)

      const result = await checkReferralEligibility('user-1')

      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('No referral found')
      expect(result.referral).toBeNull()
    })

    it('returns not eligible when referral is not pending', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(makeReferral({ status: 'COMPLETED' }))

      const result = await checkReferralEligibility('user-1')

      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('COMPLETED')
      expect(result.referral).not.toBeNull()
    })

    it('returns not eligible when invited user has no redemptions', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(makeReferral())
      mockPrisma.redemption.count.mockResolvedValue(0)

      const result = await checkReferralEligibility('user-1')

      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('no successful redemptions')
    })

    it('returns eligible when referral is pending and invited user has redemptions', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(makeReferral())
      mockPrisma.redemption.count.mockResolvedValue(2)

      const result = await checkReferralEligibility('user-1')

      expect(result.eligible).toBe(true)
      expect(result.reason).toContain('completed at least one redemption')
      expect(result.referral).toMatchObject({ id: 'ref-1' })
    })
  })

  describe('markReferralEligible', () => {
    it('does nothing when referral is not eligible', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(null)

      const result = await markReferralEligible('user-1')

      expect(result).toBeNull()
      expect(mockPrisma.referral.update).not.toHaveBeenCalled()
    })

    it('updates status to COMPLETED and completedAt but does NOT set rewardGranted', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(makeReferral())
      mockPrisma.redemption.count.mockResolvedValue(1)
      mockPrisma.referral.update.mockResolvedValue(makeReferral({ status: 'COMPLETED' }))

      const result = await markReferralEligible('user-1')

      expect(result).not.toBeNull()
      expect(result?.status).toBe('COMPLETED')
      expect(mockPrisma.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date) as unknown as Date,
        },
      })

      const updateCall = mockPrisma.referral.update.mock.calls[0][0]
      expect(updateCall.data).not.toHaveProperty('rewardGranted')
    })
  })

  describe('listReferralsForAdmin', () => {
    it('defaults to PENDING status and maps users with eligibility', async () => {
      const referrer = { id: 'referrer-1', email: 'ref@example.com', firstName: 'Ref', lastName: null }
      const invited = { id: 'invited-1', email: 'inv@example.com', firstName: 'Inv', lastName: null }

      mockPrisma.referral.findMany.mockResolvedValue([
        {
          id: 'ref-1',
          status: 'PENDING',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          completedAt: null,
          invitedUserId: invited.id,
          referralCode: {
            user: referrer,
          },
          invitedUser: invited,
        },
      ])
      mockPrisma.referral.count.mockResolvedValue(1)
      mockPrisma.redemption.count.mockResolvedValue(1)

      const result = await listReferralsForAdmin()

      expect(mockPrisma.referral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
          take: 50,
          skip: 0,
        }),
      )
      expect(result.total).toBe(1)
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        id: 'ref-1',
        status: 'PENDING',
        eligible: true,
        redemptionCount: 1,
        referrer,
        invitedUser: invited,
      })
    })

    it('clamps limit and offset', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([])
      mockPrisma.referral.count.mockResolvedValue(0)

      await listReferralsForAdmin({ status: 'PENDING', limit: 500, offset: -5 })

      expect(mockPrisma.referral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 0,
        }),
      )
    })

    it('respects status filter', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([])
      mockPrisma.referral.count.mockResolvedValue(0)

      await listReferralsForAdmin({ status: 'COMPLETED' })

      expect(mockPrisma.referral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'COMPLETED' },
        }),
      )
    })
  })
})
