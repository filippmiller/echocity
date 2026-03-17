import { prisma } from '@/lib/prisma'
import { generateSessionToken, generateShortCode } from './tokens'
import { validateOfferForRedemption } from '@/modules/offers/service'
import { checkRedemptionFraud } from '@/modules/moderation/fraud'
import { trackSaving } from '@/modules/savings/track'
import { validateGeoProximity } from './geo'
import { checkAndProgressMissions, checkBadgeEligibility } from '@/modules/gamification/service'

const SESSION_TTL_MS = 60 * 1000 // 60 seconds

export async function createRedemptionSession(userId: string, offerId: string, userLat?: number, userLng?: number) {
  // Validate the offer first
  const validation = await validateOfferForRedemption(offerId, userId)
  if (!validation.valid) {
    await prisma.redemptionEvent.create({
      data: {
        eventType: validation.errorCode === 'SUBSCRIPTION_REQUIRED' ? 'RULE_FAILED' : 'LIMIT_FAILED',
        actorType: 'USER',
        actorId: userId,
        metadata: { offerId, errorCode: validation.errorCode },
      },
    })
    return { success: false, error: validation.errorCode, message: validation.errorMessage }
  }

  const offer = await prisma.offer.findUnique({ where: { id: offerId } })
  if (!offer) return { success: false, error: 'OFFER_NOT_FOUND', message: 'Предложение не найдено' }

  // Cancel any existing active sessions for this user+offer
  await prisma.redemptionSession.updateMany({
    where: { userId, offerId, status: 'ACTIVE' },
    data: { status: 'CANCELED' },
  })

  const sessionToken = generateSessionToken()
  const shortCode = generateShortCode()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const session = await prisma.redemptionSession.create({
    data: {
      userId,
      offerId,
      branchId: offer.branchId,
      sessionToken,
      shortCode,
      status: 'ACTIVE',
      expiresAt,
      userLat: userLat ?? null,
      userLng: userLng ?? null,
    },
  })

  await prisma.redemptionEvent.create({
    data: {
      sessionId: session.id,
      eventType: 'QR_GENERATED',
      actorType: 'USER',
      actorId: userId,
    },
  })

  return { success: true, session: { id: session.id, sessionToken, shortCode, expiresAt } }
}

export async function validateAndRedeem(input: { sessionToken?: string; shortCode?: string; scannedByUserId?: string }) {
  const { sessionToken, shortCode, scannedByUserId } = input

  // Find session by token or code
  const session = await prisma.redemptionSession.findFirst({
    where: sessionToken
      ? { sessionToken, status: 'ACTIVE' }
      : { shortCode, status: 'ACTIVE' },
    include: { offer: { include: { merchant: true } } },
  })

  if (!session) {
    return { success: false, error: 'SESSION_NOT_FOUND', message: 'Сессия не найдена или истекла' }
  }

  if (session.expiresAt < new Date()) {
    await prisma.redemptionSession.update({ where: { id: session.id }, data: { status: 'EXPIRED' } })
    return { success: false, error: 'SESSION_EXPIRED', message: 'QR-код истёк. Попросите клиента обновить' }
  }

  // Re-validate the offer (limits might have changed)
  const validation = await validateOfferForRedemption(session.offerId, session.userId)
  if (!validation.valid) {
    await prisma.redemptionEvent.create({
      data: {
        sessionId: session.id,
        eventType: validation.errorCode?.includes('LIMIT') ? 'LIMIT_FAILED' : 'RULE_FAILED',
        actorType: 'STAFF',
        actorId: scannedByUserId,
        metadata: { errorCode: validation.errorCode },
      },
    })
    return { success: false, error: validation.errorCode, message: validation.errorMessage }
  }

  // Geo-radius enforcement
  const offerWithRules = await prisma.offer.findUnique({
    where: { id: session.offerId },
    include: {
      rules: { where: { ruleType: 'GEO_RADIUS' } },
      branch: { select: { lat: true, lng: true } },
    },
  })

  const geoRule = offerWithRules?.rules[0]
  let geoWarning: string | undefined

  if (geoRule && offerWithRules?.branch) {
    const maxRadius = typeof geoRule.value === 'object' && geoRule.value !== null
      ? (geoRule.value as { meters?: number }).meters ?? Number(geoRule.value)
      : Number(geoRule.value)

    const branchLat = offerWithRules.branch.lat
    const branchLng = offerWithRules.branch.lng

    if (session.userLat != null && session.userLng != null && branchLat != null && branchLng != null) {
      const geo = validateGeoProximity(session.userLat, session.userLng, branchLat, branchLng, maxRadius)

      if (!geo.valid) {
        await prisma.redemptionEvent.create({
          data: {
            sessionId: session.id,
            eventType: 'GEO_FAILED',
            actorType: 'SYSTEM',
            metadata: {
              userLat: session.userLat,
              userLng: session.userLng,
              branchLat,
              branchLng,
              distanceMeters: geo.distanceMeters,
              maxRadiusMeters: maxRadius,
            },
          },
        })
        return {
          success: false,
          error: 'GEO_TOO_FAR',
          message: `Вы слишком далеко от заведения (${geo.distanceMeters}м, макс. ${maxRadius}м)`,
        }
      }
    } else if (session.userLat == null || session.userLng == null) {
      // User denied location — allow with warning, do not block
      geoWarning = 'Местоположение не предоставлено. Гео-проверка пропущена.'
    }
  }

  // Create redemption + mark session used in transaction
  const redemption = await prisma.$transaction(async (tx) => {
    await tx.redemptionSession.update({ where: { id: session.id }, data: { status: 'USED' } })

    const r = await tx.redemption.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        offerId: session.offerId,
        merchantId: session.offer.merchantId,
        branchId: session.offer.branchId,
        scannedByUserId: scannedByUserId ?? null,
        status: 'SUCCESS',
      },
    })

    await tx.redemptionEvent.create({
      data: {
        sessionId: session.id,
        redemptionId: r.id,
        eventType: 'REDEEMED',
        actorType: scannedByUserId ? 'STAFF' : 'SYSTEM',
        actorId: scannedByUserId,
      },
    })

    // If FREE_FOR_ALL, create billing event
    if (session.offer.visibility === 'FREE_FOR_ALL') {
      await tx.merchantBillingEvent.create({
        data: {
          merchantId: session.offer.merchantId,
          offerId: session.offerId,
          redemptionId: r.id,
          eventType: 'REDEMPTION_FEE',
          amount: 5000, // 50₽ in kopecks
          currency: 'RUB',
          status: 'PENDING',
        },
      })
    }

    return r
  })

  // Non-blocking fraud check
  checkRedemptionFraud({
    id: redemption.id,
    userId: session.userId,
    offerId: session.offerId,
    merchantId: session.offer.merchantId,
    branchId: session.offer.branchId,
    scannedByUserId: scannedByUserId ?? null,
  }).catch(() => {})

  // Non-blocking savings tracking
  if (session.offer.benefitValue) {
    const savedKopecks = Math.round(Number(session.offer.benefitValue) * 100)
    trackSaving(session.userId, redemption.id, savedKopecks).catch(() => {})
  }

  // Non-blocking gamification progress
  checkAndProgressMissions(session.userId, 'redemption').catch(() => {})
  checkBadgeEligibility(session.userId).catch(() => {})

  return {
    success: true,
    geoWarning,
    redemption: {
      id: redemption.id,
      offerTitle: session.offer.title,
      benefitType: session.offer.benefitType,
      benefitValue: Number(session.offer.benefitValue),
      branchId: session.offer.branchId,
    },
  }
}

// Cron: expire stale sessions
export async function expireSessions() {
  const result = await prisma.redemptionSession.updateMany({
    where: { status: 'ACTIVE', expiresAt: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  })
  return result.count
}
