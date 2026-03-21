import { prisma } from '@/lib/prisma'
import type { OfferType, BenefitType, OfferVisibility, RedemptionChannel } from '@prisma/client'
import type { CreateOfferInput, OfferValidationResult, OfferWithDetails } from './types'
import { notifyNearbyNewOffer } from '@/modules/notifications/triggers'

const CATEGORY_PLACE_TYPE_MAP: Record<string, string[]> = {
  coffee: ['CAFE'],
  food: ['RESTAURANT'],
  bars: ['BAR'],
  beauty: ['BEAUTY', 'NAILS', 'HAIR'],
  services: ['DRYCLEANING', 'OTHER'],
}

export async function createOffer(input: CreateOfferInput, createdByUserId: string) {
  const { schedules, blackoutDates, rules, limits, ...offerData } = input

  return prisma.offer.create({
    data: {
      ...offerData,
      offerType: offerData.offerType as OfferType,
      benefitType: offerData.benefitType as BenefitType,
      visibility: (offerData.visibility || 'PUBLIC') as OfferVisibility,
      redemptionChannel: (offerData.redemptionChannel || 'IN_STORE') as RedemptionChannel,
      benefitValue: offerData.benefitValue,
      minOrderAmount: offerData.minOrderAmount ?? null,
      maxDiscountAmount: offerData.maxDiscountAmount ?? null,
      startAt: new Date(offerData.startAt),
      endAt: offerData.endAt ? new Date(offerData.endAt) : null,
      approvalStatus: 'DRAFT',
      lifecycleStatus: 'INACTIVE',
      createdByUserId,
      schedules: schedules ? { create: schedules } : undefined,
      blackoutDates: blackoutDates
        ? { create: blackoutDates.map((d) => ({ date: new Date(d.date), reason: d.reason })) }
        : undefined,
      rules: rules
        ? { create: rules.map((r) => ({ ruleType: r.ruleType as any, operator: r.operator, value: r.value as any })) }
        : undefined,
      limits: limits ? { create: limits } : undefined,
    },
    include: { schedules: true, rules: true, limits: true, blackoutDates: true, branch: true, merchant: true },
  })
}

export async function submitForModeration(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { merchant: true } })
  if (!offer) throw new Error('Offer not found')
  if (offer.merchant.ownerId !== userId) throw new Error('Not authorized')
  if (offer.approvalStatus !== 'DRAFT' && offer.approvalStatus !== 'REJECTED') {
    throw new Error('Offer can only be submitted from DRAFT or REJECTED status')
  }

  return prisma.offer.update({
    where: { id: offerId },
    data: { approvalStatus: 'PENDING' },
  })
}

export async function approveOffer(offerId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } })
  if (!offer || offer.approvalStatus !== 'PENDING') throw new Error('Invalid offer state')

  const now = new Date()
  const isScheduledForFuture = offer.startAt > now

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: {
      approvalStatus: 'APPROVED',
      lifecycleStatus: isScheduledForFuture ? 'SCHEDULED' : 'ACTIVE',
    },
  })

  // Fire-and-forget: notify nearby users about the new offer
  // Only notify immediately if the offer is going ACTIVE right now (not scheduled for later)
  if (!isScheduledForFuture) {
    notifyNearbyNewOffer(offerId).catch(() => {
      // errors are logged inside the function; never block approval
    })
  }

  return updated
}

export async function rejectOffer(offerId: string, reason: string) {
  return prisma.offer.update({
    where: { id: offerId },
    data: { approvalStatus: 'REJECTED', rejectionReason: reason },
  })
}

export async function pauseOffer(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { merchant: true } })
  if (!offer) throw new Error('Offer not found')
  if (offer.merchant.ownerId !== userId) throw new Error('Not authorized')
  if (offer.lifecycleStatus !== 'ACTIVE') throw new Error('Can only pause active offers')

  return prisma.offer.update({ where: { id: offerId }, data: { lifecycleStatus: 'PAUSED' } })
}

export async function resumeOffer(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { merchant: true } })
  if (!offer) throw new Error('Offer not found')
  if (offer.merchant.ownerId !== userId) throw new Error('Not authorized')
  if (offer.lifecycleStatus !== 'PAUSED') throw new Error('Can only resume paused offers')

  return prisma.offer.update({ where: { id: offerId }, data: { lifecycleStatus: 'ACTIVE' } })
}

export async function getOfferById(offerId: string): Promise<OfferWithDetails | null> {
  return prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      schedules: true,
      rules: true,
      limits: true,
      blackoutDates: true,
      branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true, nearestMetro: true } },
      merchant: { select: { id: true, name: true, isVerified: true } },
    },
  }) as any
}

export async function getActiveOffersByCity(
  cityName: string,
  options?: { visibility?: string; category?: string; metro?: string; limit?: number; offset?: number },
) {
  const now = new Date()
  const placeTypes = options?.category ? CATEGORY_PLACE_TYPE_MAP[options.category] : undefined

  return prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      startAt: { lte: now },
      OR: [
        { endAt: null },
        { endAt: { gt: now } },
      ],
      branch: {
        city: cityName,
        isActive: true,
        ...(placeTypes?.length ? { placeType: { in: placeTypes as any } } : {}),
        ...(options?.metro ? { nearestMetro: { contains: options.metro, mode: 'insensitive' } } : {}),
      },
      ...(options?.visibility ? { visibility: options.visibility as any } : {}),
    },
    include: {
      schedules: true,
      limits: true,
      branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true, nearestMetro: true } },
      merchant: { select: { id: true, name: true, isVerified: true } },
      _count: { select: { redemptions: true, offerReviews: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  })
}

export async function getNearbyOffers(lat: number, lng: number, radiusKm: number, cityName: string) {
  // SECURITY: Uses Prisma tagged template literal — all ${} values are auto-parameterized.
  // DO NOT convert to $queryRawUnsafe or string concatenation.
  const offers = await prisma.$queryRaw<Array<any>>`
    SELECT o.*, p.title as "branchTitle", p.address as "branchAddress", p.lat as "branchLat", p.lng as "branchLng",
      (6371 * acos(cos(radians(${lat})) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.lat)))) AS distance
    FROM "Offer" o
    JOIN "Place" p ON o."branchId" = p.id
    WHERE o."lifecycleStatus" = 'ACTIVE'
      AND o."approvalStatus" = 'APPROVED'
      AND p."isActive" = true
      AND p.city = ${cityName}
      AND p.lat IS NOT NULL
      AND p.lng IS NOT NULL
      AND (6371 * acos(cos(radians(${lat})) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.lat)))) < ${radiusKm}
    ORDER BY distance ASC
    LIMIT 50
  `
  return offers
}

// Validation chain: checks if an offer can be redeemed right now by a given user
export async function validateOfferForRedemption(offerId: string, userId: string): Promise<OfferValidationResult> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { schedules: true, rules: true, limits: true, blackoutDates: true },
  })

  if (!offer) return { valid: false, errorCode: 'OFFER_NOT_FOUND', errorMessage: 'Предложение не найдено' }
  if (offer.lifecycleStatus !== 'ACTIVE') return { valid: false, errorCode: 'OFFER_NOT_ACTIVE', errorMessage: 'Предложение неактивно' }
  if (offer.startAt > new Date()) {
    return { valid: false, errorCode: 'OFFER_NOT_STARTED', errorMessage: 'Предложение ещё не началось' }
  }
  if (offer.endAt && offer.endAt <= new Date()) {
    return { valid: false, errorCode: 'OFFER_EXPIRED', errorMessage: 'Срок действия предложения истёк' }
  }

  // Check subscription for members-only
  if (offer.visibility === 'MEMBERS_ONLY') {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    })
    if (!sub) return { valid: false, errorCode: 'SUBSCRIPTION_REQUIRED', errorMessage: 'Нужна подписка Plus или Premium' }
  }

  // Check schedule (Moscow time = UTC+3)
  const now = new Date()
  const moscowOffset = 3 * 60
  const moscowTime = new Date(now.getTime() + moscowOffset * 60000)
  const weekday = (moscowTime.getUTCDay() + 6) % 7 // 0=Monday

  if (offer.schedules.length > 0) {
    const currentTime = `${String(moscowTime.getUTCHours()).padStart(2, '0')}:${String(moscowTime.getUTCMinutes()).padStart(2, '0')}`
    const matchingSchedule = offer.schedules.find(
      (s) => s.weekday === weekday && !s.isBlackout && s.startTime <= currentTime && s.endTime > currentTime
    )
    if (!matchingSchedule) return { valid: false, errorCode: 'OUTSIDE_SCHEDULE', errorMessage: 'Предложение не действует в это время' }
  }

  // Check blackout dates
  const todayStr = moscowTime.toISOString().split('T')[0]
  const isBlackout = offer.blackoutDates.some((b) => b.date.toISOString().split('T')[0] === todayStr)
  if (isBlackout) return { valid: false, errorCode: 'BLACKOUT_DATE', errorMessage: 'Предложение не действует сегодня' }

  // Check limits
  if (offer.limits) {
    const startOfDay = new Date(todayStr + 'T00:00:00Z')
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(moscowTime.getUTCFullYear(), moscowTime.getUTCMonth(), 1)

    if (offer.limits.dailyLimit) {
      const dailyCount = await prisma.redemption.count({
        where: { offerId, status: 'SUCCESS', redeemedAt: { gte: startOfDay } },
      })
      if (dailyCount >= offer.limits.dailyLimit) return { valid: false, errorCode: 'DAILY_LIMIT', errorMessage: 'Лимит на сегодня исчерпан' }
    }

    if (offer.limits.weeklyLimit) {
      const weeklyCount = await prisma.redemption.count({
        where: { offerId, status: 'SUCCESS', redeemedAt: { gte: startOfWeek } },
      })
      if (weeklyCount >= offer.limits.weeklyLimit) return { valid: false, errorCode: 'WEEKLY_LIMIT', errorMessage: 'Лимит на эту неделю исчерпан' }
    }

    if (offer.limits.monthlyLimit) {
      const monthlyCount = await prisma.redemption.count({
        where: { offerId, status: 'SUCCESS', redeemedAt: { gte: startOfMonth } },
      })
      if (monthlyCount >= offer.limits.monthlyLimit) return { valid: false, errorCode: 'MONTHLY_LIMIT', errorMessage: 'Лимит на этот месяц исчерпан' }
    }

    if (offer.limits.totalLimit) {
      const totalCount = await prisma.redemption.count({
        where: { offerId, status: 'SUCCESS' },
      })
      if (totalCount >= offer.limits.totalLimit) return { valid: false, errorCode: 'TOTAL_LIMIT', errorMessage: 'Общий лимит исчерпан' }
    }

    if (offer.limits.perUserDailyLimit) {
      const userDailyCount = await prisma.redemption.count({
        where: { offerId, userId, status: 'SUCCESS', redeemedAt: { gte: startOfDay } },
      })
      if (userDailyCount >= offer.limits.perUserDailyLimit) return { valid: false, errorCode: 'USER_DAILY_LIMIT', errorMessage: 'Вы уже использовали это предложение сегодня' }
    }

    if (offer.limits.perUserWeeklyLimit) {
      const userWeeklyCount = await prisma.redemption.count({
        where: { offerId, userId, status: 'SUCCESS', redeemedAt: { gte: startOfWeek } },
      })
      if (userWeeklyCount >= offer.limits.perUserWeeklyLimit) return { valid: false, errorCode: 'USER_WEEKLY_LIMIT', errorMessage: 'Вы исчерпали недельный лимит использования' }
    }

    if (offer.limits.perUserLifetimeLimit) {
      const userTotalCount = await prisma.redemption.count({
        where: { offerId, userId, status: 'SUCCESS' },
      })
      if (userTotalCount >= offer.limits.perUserLifetimeLimit) return { valid: false, errorCode: 'USER_LIFETIME_LIMIT', errorMessage: 'Вы исчерпали лимит использования' }
    }
  }

  // Check rules
  for (const rule of offer.rules) {
    if (rule.ruleType === 'FIRST_TIME_ONLY') {
      const existing = await prisma.redemption.count({ where: { offerId, userId, status: 'SUCCESS' } })
      if (existing > 0) return { valid: false, errorCode: 'FIRST_TIME_ONLY', errorMessage: 'Только для первого визита' }
    }
  }

  return { valid: true }
}

// Cron job: expire past-endAt offers
export async function expireOffers() {
  const now = new Date()
  const result = await prisma.offer.updateMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      endAt: { lte: now },
    },
    data: { lifecycleStatus: 'EXPIRED' },
  })
  return result.count
}

// Cron job: activate scheduled offers
export async function activateScheduledOffers() {
  const now = new Date()
  const result = await prisma.offer.updateMany({
    where: {
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'SCHEDULED',
      startAt: { lte: now },
    },
    data: { lifecycleStatus: 'ACTIVE' },
  })
  return result.count
}
