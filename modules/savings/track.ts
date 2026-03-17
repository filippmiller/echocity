import { prisma } from '@/lib/prisma'

/**
 * Track a savings record when a redemption is completed.
 * Also upgrades referral status to COMPLETED on first redemption.
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
  } catch (err: any) {
    // P2002 = unique constraint violation — already tracked
    if (err?.code === 'P2002') return
    throw err
  }

  // Check if this is the user's first redemption (for referral upgrade)
  const redemptionCount = await prisma.redemption.count({
    where: { userId, status: 'SUCCESS' },
  })

  if (redemptionCount === 1) {
    // First redemption — upgrade referral to COMPLETED if exists
    const referral = await prisma.referral.findUnique({
      where: { invitedUserId: userId },
    })

    if (referral && referral.status === 'PENDING') {
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    }
  }
}
