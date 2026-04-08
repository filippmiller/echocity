/**
 * Smart push notification triggers.
 *
 * Context-aware notifications beyond the weekly digest:
 * - New approved offer → notify users who favorited that place or live in the same city
 * - Expiring favorited offer → remind user 24h before expiry
 * - Streak at risk → remind user who hasn't visited today and has a streak >= 3
 */

import { prisma } from '@/lib/prisma'
import { sendPushNotification } from './push'
import { NotificationType } from './types'
import { logger } from '@/lib/logger'

const BATCH_SIZE = 50

/**
 * Notify users about a newly approved offer.
 *
 * Recipients:
 *   1. Users who favorited the place (branch) this offer belongs to.
 *   2. Users in the same city who have push notifications enabled.
 *
 * To avoid spamming, city-wide notifications are capped at BATCH_SIZE * 4.
 */
export async function notifyNearbyNewOffer(offerId: string): Promise<void> {
  try {
    // Load the offer with its branch (place) and merchant details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        title: true,
        branch: { select: { id: true, title: true, city: true } },
        merchant: { select: { name: true } },
      },
    })

    if (!offer) {
      logger.warn('notifyNearbyNewOffer.offerNotFound', { offerId })
      return
    }

    const placeName = offer.branch.title || offer.merchant.name
    const city = offer.branch.city
    const branchId = offer.branch.id
    const notifTitle = 'Новая скидка рядом'
    const notifBody = `Новая скидка в ${placeName}: ${offer.title}`

    // --- Batch 1: users who favorited this specific place ---
    const favoritedUserIds = await prisma.favorite.findMany({
      where: { entityType: 'PLACE', entityId: branchId },
      select: { userId: true },
    })

    const favoritedSet = new Set(favoritedUserIds.map((f) => f.userId))

    await Promise.allSettled(
      [...favoritedSet].map((userId) =>
        sendPushNotification(userId, {
          title: notifTitle,
          body: notifBody,
          url: `/offers/${offerId}`,
          type: NotificationType.FAVORITE_PLACE_NEW_OFFER,
        }).catch((err) =>
          logger.error('notifyNearbyNewOffer.favoritedUser.failed', { userId, error: String(err) })
        )
      )
    )

    // --- Batch 2: city-wide users (cursor paginated, max 4 batches) ---
    let cursor: string | undefined = undefined
    let batchCount = 0

    for (;;) {
      if (batchCount >= 4) break

      const findArgs = {
        where: {
          city,
          isActive: true,
          id: favoritedSet.size > 0 ? { notIn: [...favoritedSet] } : undefined,
          profile: {
            notificationsEnabled: true,
            pushNotifications: true,
          },
        },
        select: { id: true },
        take: BATCH_SIZE,
        orderBy: { id: 'asc' as const },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
      }
      const users: { id: string }[] = await prisma.user.findMany(findArgs)

      if (users.length === 0) break

      await Promise.allSettled(
        users.map((u) =>
          sendPushNotification(u.id, {
            title: 'Новые скидки в вашем городе',
            body: notifBody,
            url: `/offers/${offerId}`,
            type: NotificationType.NEARBY_DEAL,
          }).catch((err) =>
            logger.error('notifyNearbyNewOffer.cityUser.failed', { userId: u.id, error: String(err) })
          )
        )
      )

      if (users.length < BATCH_SIZE) break
      cursor = users[users.length - 1].id
      batchCount++
    }

    logger.info('notifyNearbyNewOffer.done', { offerId, favoritedCount: favoritedSet.size })
  } catch (err) {
    logger.error('notifyNearbyNewOffer.error', { offerId, error: String(err) })
  }
}

/**
 * Notify a specific user that an offer they favorited is expiring within 24 hours.
 */
export async function notifyExpiringFavorite(userId: string, offerId: string): Promise<void> {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        title: true,
        branch: { select: { title: true } },
        merchant: { select: { name: true } },
      },
    })

    if (!offer) return

    const placeName = offer.branch.title || offer.merchant.name

    await sendPushNotification(userId, {
      title: 'Скидка заканчивается!',
      body: `Скидка ${offer.title} в ${placeName} заканчивается завтра!`,
      url: `/offers/${offerId}`,
      type: NotificationType.EXPIRY_REMINDER,
    })

    logger.info('notifyExpiringFavorite.sent', { userId, offerId })
  } catch (err) {
    logger.error('notifyExpiringFavorite.error', { userId, offerId, error: String(err) })
  }
}

/**
 * Notify a user that their visit streak is at risk (>= 3-day streak, no visit today).
 */
export async function notifyStreakAtRisk(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakCurrent: true },
    })

    if (!user || user.streakCurrent < 3) return

    await sendPushNotification(userId, {
      title: 'Ваша серия под угрозой!',
      body: `Не потеряйте серию ${user.streakCurrent} дней! Зайдите сегодня`,
      url: '/offers',
      type: NotificationType.WEEKLY_DIGEST,
    })

    logger.info('notifyStreakAtRisk.sent', { userId, streak: user.streakCurrent })
  } catch (err) {
    logger.error('notifyStreakAtRisk.error', { userId, error: String(err) })
  }
}

/**
 * Cron helper: find all favorited OFFER entries expiring tomorrow and notify their owners.
 * Called daily at 8pm Moscow (5pm UTC).
 */
export async function checkExpiringFavorites(): Promise<number> {
  const now = new Date()
  // Expiring "tomorrow" = within the next 24-48h window
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  // Find offers ending in the next 24-48h
  const expiringOffers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      endAt: { gte: in24h, lt: in48h },
    },
    select: { id: true },
  })

  if (expiringOffers.length === 0) return 0

  const offerIds = expiringOffers.map((o) => o.id)

  // Find users who favorited any of those offers
  const favorites = await prisma.favorite.findMany({
    where: { entityType: 'OFFER', entityId: { in: offerIds } },
    select: { userId: true, entityId: true },
  })

  await Promise.allSettled(
    favorites.map(({ userId, entityId }) => notifyExpiringFavorite(userId, entityId))
  )

  logger.info('checkExpiringFavorites.done', { offerCount: offerIds.length, notifiedCount: favorites.length })
  return favorites.length
}

/**
 * Cron helper: find users with a streak >= 3 who haven't visited today and notify them.
 * Called daily at 7pm Moscow (4pm UTC).
 */
export async function checkStreaksAtRisk(): Promise<number> {
  const now = new Date()
  // Moscow is UTC+3; "today in Moscow" starts at midnight Moscow = 21:00 UTC previous day
  const moscowOffset = 3 * 60 * 60 * 1000
  const moscowNow = new Date(now.getTime() + moscowOffset)
  const moscowToday = new Date(
    Date.UTC(moscowNow.getUTCFullYear(), moscowNow.getUTCMonth(), moscowNow.getUTCDate())
  )
  // streakLastDate before today (Moscow) means they haven't visited today
  const streakLastDateBefore = new Date(moscowToday.getTime() - moscowOffset)

  const atRiskUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      streakCurrent: { gte: 3 },
      OR: [
        { streakLastDate: null },
        { streakLastDate: { lt: streakLastDateBefore } },
      ],
      profile: {
        notificationsEnabled: true,
        pushNotifications: true,
      },
    },
    select: { id: true },
  })

  await Promise.allSettled(atRiskUsers.map((u) => notifyStreakAtRisk(u.id)))

  logger.info('checkStreaksAtRisk.done', { count: atRiskUsers.length })
  return atRiskUsers.length
}

/**
 * Notify users about a flash deal happening right now.
 * Targets users in the same city with push enabled.
 */
export async function notifyFlashDealNearby(offerId: string): Promise<void> {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        title: true,
        endAt: true,
        branch: { select: { title: true, city: true } },
        merchant: { select: { name: true } },
      },
    })

    if (!offer) {
      logger.warn('notifyFlashDealNearby.offerNotFound', { offerId })
      return
    }

    const placeName = offer.branch.title || offer.merchant.name
    const city = offer.branch.city
    const minutesLeft = offer.endAt
      ? Math.round((offer.endAt.getTime() - Date.now()) / 60000)
      : 30

    let cursor: string | undefined = undefined
    let batchCount = 0

    for (;;) {
      if (batchCount >= 6) break

      const users: { id: string }[] = await prisma.user.findMany({
        where: {
          city,
          isActive: true,
          profile: {
            notificationsEnabled: true,
            pushNotifications: true,
          },
        },
        select: { id: true },
        take: BATCH_SIZE,
        orderBy: { id: 'asc' as const },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
      })

      if (users.length === 0) break

      await Promise.allSettled(
        users.map((u) =>
          sendPushNotification(u.id, {
            title: 'Скидка прямо сейчас!',
            body: `${offer.title} в ${placeName} — осталось ${minutesLeft} мин`,
            url: `/offers/${offerId}`,
            type: NotificationType.FLASH_DEAL,
          }).catch((err) =>
            logger.error('notifyFlashDealNearby.failed', { userId: u.id, error: String(err) })
          )
        )
      )

      if (users.length < BATCH_SIZE) break
      cursor = users[users.length - 1].id
      batchCount++
    }

    logger.info('notifyFlashDealNearby.done', { offerId })
  } catch (err) {
    logger.error('notifyFlashDealNearby.error', { offerId, error: String(err) })
  }
}
