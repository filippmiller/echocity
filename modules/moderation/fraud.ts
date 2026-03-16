import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function checkRedemptionFraud(redemption: {
  id: string
  userId: string
  offerId: string
  merchantId: string
  branchId: string
  scannedByUserId: string | null
}) {
  try {
    // Flag: same user+offer >3x in 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentCount = await prisma.redemption.count({
      where: {
        userId: redemption.userId,
        offerId: redemption.offerId,
        status: 'SUCCESS',
        redeemedAt: { gte: oneDayAgo },
      },
    })

    if (recentCount > 3) {
      await createFraudFlag({
        entityType: 'USER',
        entityId: redemption.userId,
        flagType: 'EXCESSIVE_REDEMPTIONS',
        severity: 'MEDIUM',
        reason: `User redeemed offer ${redemption.offerId} ${recentCount} times in 24h`,
      })
    }

    // Flag: staff redeeming own merchant's offers
    if (redemption.scannedByUserId) {
      const staffOwnRedemption = await prisma.merchantStaff.findFirst({
        where: { userId: redemption.userId, merchantId: redemption.merchantId },
      })
      if (staffOwnRedemption) {
        await createFraudFlag({
          entityType: 'REDEMPTION',
          entityId: redemption.id,
          flagType: 'SELF_REDEMPTION',
          severity: 'HIGH',
          reason: `User ${redemption.userId} is staff of merchant ${redemption.merchantId} and redeemed their own offer`,
        })
      }
    }
  } catch (e) {
    logger.error('Fraud check failed', { error: String(e), redemptionId: redemption.id })
  }
}

export async function checkRateLimitFraud(userId: string) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const failedAttempts = await prisma.redemptionEvent.count({
      where: {
        actorId: userId,
        eventType: { in: ['LIMIT_FAILED', 'RULE_FAILED', 'GEO_FAILED'] },
        createdAt: { gte: oneHourAgo },
      },
    })

    if (failedAttempts > 10) {
      await createFraudFlag({
        entityType: 'USER',
        entityId: userId,
        flagType: 'RATE_LIMIT_ABUSE',
        severity: 'LOW',
        reason: `User had ${failedAttempts} failed redemption attempts in 1 hour`,
      })
    }
  } catch (e) {
    logger.error('Rate limit fraud check failed', { error: String(e), userId })
  }
}

async function createFraudFlag(input: {
  entityType: string
  entityId: string
  flagType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
}) {
  // Avoid duplicate flags
  const existing = await prisma.fraudFlag.findFirst({
    where: {
      entityType: input.entityType,
      entityId: input.entityId,
      flagType: input.flagType,
      status: 'OPEN',
    },
  })
  if (existing) return

  await prisma.fraudFlag.create({ data: input })
  logger.info('Fraud flag created', { type: input.flagType, entity: `${input.entityType}:${input.entityId}` })
}
