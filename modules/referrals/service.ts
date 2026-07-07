import { prisma } from '@/lib/prisma'
import type { Referral } from '@prisma/client'

export type ReferralEligibilityResult = {
  eligible: boolean
  reason: string
  referral: Referral | null
}

export type PendingReferralListItem = {
  id: string
  status: string
  createdAt: Date
  completedAt: Date | null
  referrer: {
    id: string
    email: string
    firstName: string
    lastName: string | null
  }
  invitedUser: {
    id: string
    email: string
    firstName: string
    lastName: string | null
  }
  redemptionCount: number
  eligible: boolean
}

/**
 * Check whether a PENDING referral is eligible for reward.
 * Eligibility requires the invited user to have at least one successful redemption.
 * This does NOT grant rewards — it only reports eligibility.
 */
export async function checkReferralEligibility(
  invitedUserId: string,
): Promise<ReferralEligibilityResult> {
  const referral = await prisma.referral.findUnique({
    where: { invitedUserId },
  })

  if (!referral) {
    return { eligible: false, reason: 'No referral found for user', referral: null }
  }

  if (referral.status !== 'PENDING') {
    return { eligible: false, reason: `Referral status is ${referral.status}`, referral }
  }

  const redemptionCount = await prisma.redemption.count({
    where: { userId: invitedUserId, status: 'SUCCESS' },
  })

  if (redemptionCount === 0) {
    return { eligible: false, reason: 'Invited user has no successful redemptions', referral }
  }

  return {
    eligible: true,
    reason: 'Invited user completed at least one redemption',
    referral,
  }
}

/**
 * Mark a PENDING referral as COMPLETED when it is eligible.
 * Returns the updated referral or null if no update happened.
 * This sets status only — it does NOT set rewardGranted.
 */
export async function markReferralEligible(
  invitedUserId: string,
): Promise<Referral | null> {
  const { eligible, referral } = await checkReferralEligibility(invitedUserId)

  if (!eligible || !referral) {
    return null
  }

  return prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })
}

/**
 * List referrals for admin visibility.
 * Defaults to PENDING referrals so ops can review the reward queue.
 */
export async function listReferralsForAdmin(options?: {
  status?: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'REWARDED'
  limit?: number
  offset?: number
}): Promise<{ items: PendingReferralListItem[]; total: number }> {
  const status = options?.status ?? 'PENDING'
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100)
  const offset = Math.max(options?.offset ?? 0, 0)

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { status },
      include: {
        referralCode: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invitedUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.referral.count({ where: { status } }),
  ])

  const items = await Promise.all(
    referrals.map(async (r) => {
      const redemptionCount = await prisma.redemption.count({
        where: { userId: r.invitedUserId, status: 'SUCCESS' },
      })

      return {
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        referrer: r.referralCode.user,
        invitedUser: r.invitedUser,
        redemptionCount,
        eligible: r.status === 'PENDING' && redemptionCount > 0,
      }
    }),
  )

  return { items, total }
}
