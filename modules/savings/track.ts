import { prisma } from '@/lib/prisma'
import { markReferralEligible } from '@/modules/referrals/service'

/**
 * Track a savings record when a redemption is completed.
 * Also marks any pending referral as eligible (status COMPLETED) on first redemption.
 * Rewards are NOT granted here — that is left to explicit admin/operator action.
 */
export async function trackSaving(
  userId: string,
  redemptionId: string,
  savedAmount: number, // in kopecks
  currency: string = 'RUB'
) {
  // Create savings record (idempotent via unique redemptionId)
  try {
    await prisma.userSavings.create({
      data: {
        userId,
        redemptionId,
        savedAmount,
        currency,
      },
    })
  } catch (err) {
    // P2002 = unique constraint violation — already tracked
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') return
    throw err
  }

  // Check if this is the user's first redemption (for referral eligibility)
  const redemptionCount = await prisma.redemption.count({
    where: { userId, status: 'SUCCESS' },
  })

  if (redemptionCount === 1) {
    // First redemption — mark pending referral as eligible, but do NOT grant reward
    await markReferralEligible(userId)
  }
}
