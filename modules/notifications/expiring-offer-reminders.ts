/**
 * Expiring saved offer reminders.
 *
 * Detects offers a user has favorited that are about to expire and sends
 * reminders via push and/or email according to user preferences.
 * A ReminderLog row prevents duplicate reminders for the same offer/channel.
 */

import { prisma } from '@/lib/prisma'
import { sendPushNotification } from './push'
import { NotificationType } from './types'
import { sendEmail, isEmailDeliveryConfigured } from '@/modules/email/resend'
import { logger } from '@/lib/logger'

export type ReminderChannel = 'push' | 'email'

export interface ExpiringSavedOffer {
  userId: string
  offerId: string
  offer: {
    id: string
    title: string
    endAt: Date | null
    branch: { title: string; city: string } | null
    merchant: { name: string } | null
  }
}

const REMINDER_TYPE = 'EXPIRING_OFFER'

/**
 * Find saved offers that are expiring within the given window and have not
 * already received a reminder in this window.
 */
export async function findExpiringSavedOffers(windowHours = 24): Promise<ExpiringSavedOffer[]> {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000)
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

  const expiringOffers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      endAt: { gte: now, lte: windowEnd },
    },
    select: {
      id: true,
      title: true,
      endAt: true,
      branch: { select: { title: true, city: true } },
      merchant: { select: { name: true } },
    },
  })

  if (expiringOffers.length === 0) return []

  const offerMap = new Map(expiringOffers.map((o) => [o.id, o]))
  const offerIds = expiringOffers.map((o) => o.id)

  const favorites = await prisma.favorite.findMany({
    where: { entityType: 'OFFER', entityId: { in: offerIds } },
    select: { userId: true, entityId: true },
  })

  if (favorites.length === 0) return []

  // Exclude (userId, offerId) pairs that already have a push reminder in this window
  const existingLogs = await prisma.reminderLog.findMany({
    where: {
      type: REMINDER_TYPE,
      channel: 'push',
      sentAt: { gte: windowStart },
      OR: favorites.map((f) => ({ userId: f.userId, offerId: f.entityId })),
    },
    select: { userId: true, offerId: true },
  })
  const loggedSet = new Set(existingLogs.map((l) => `${l.userId}:${l.offerId}`))

  return favorites
    .filter((f) => !loggedSet.has(`${f.userId}:${f.entityId}`))
    .map((f) => {
      const offer = offerMap.get(f.entityId)!
      return {
        userId: f.userId,
        offerId: f.entityId,
        offer,
      }
    })
}

/**
 * Resolve which channels should be used for a user based on their profile
 * and the requested channel list.
 */
export function resolveChannels(
  preferences: { notificationsEnabled: boolean; pushNotifications: boolean; emailNotifications: boolean } | null,
  requested: ReminderChannel[]
): ReminderChannel[] {
  if (!preferences?.notificationsEnabled) return []
  const enabled: ReminderChannel[] = []
  if (requested.includes('push') && preferences.pushNotifications) enabled.push('push')
  if (requested.includes('email') && preferences.emailNotifications) enabled.push('email')
  return enabled
}

/**
 * Send an expiring-offer reminder to a user for a specific offer.
 * Respects user preferences and writes a ReminderLog row per channel to dedupe.
 */
export async function sendReminder(
  userId: string,
  offerId: string,
  channels: ReminderChannel[] = ['push', 'email']
): Promise<{ sent: ReminderChannel[]; skipped: ReminderChannel[] }> {
  const [offer, profile, user] = await Promise.all([
    prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        title: true,
        endAt: true,
        branch: { select: { title: true, city: true } },
        merchant: { select: { name: true } },
      },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: true,
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ])

  if (!offer) {
    logger.warn('expiringReminder.offerNotFound', { userId, offerId })
    return { sent: [], skipped: channels }
  }

  const enabledChannels = resolveChannels(profile, channels)
  const skipped = channels.filter((c) => !enabledChannels.includes(c))
  const sent: ReminderChannel[] = []

  const placeName = offer.branch?.title || offer.merchant?.name || 'заведении'
  const hoursLeft = offer.endAt
    ? Math.max(1, Math.round((offer.endAt.getTime() - Date.now()) / 3_600_000))
    : undefined

  const body = hoursLeft
    ? `Скидка "${offer.title}" в ${placeName} заканчивается через ${hoursLeft} ч`
    : `Скидка "${offer.title}" в ${placeName} скоро закончится`

  for (const channel of enabledChannels) {
    try {
      if (channel === 'push') {
        await sendPushNotification(userId, {
          title: 'Скидка заканчивается',
          body,
          url: `/offers/${offerId}`,
          type: NotificationType.EXPIRY_REMINDER,
        })
      }

      if (channel === 'email') {
        if (!isEmailDeliveryConfigured() || !user?.email) {
          skipped.push('email')
          continue
        }
        await sendEmail({
          to: user.email,
          subject: 'Скидка заканчивается',
          html: `<p>${body}</p><p><a href="/offers/${offerId}">Открыть скидку</a></p>`,
          text: `${body}\n/offers/${offerId}`,
        })
      }

      await prisma.reminderLog.create({
        data: { userId, offerId, channel, type: REMINDER_TYPE },
      })
      sent.push(channel)
    } catch (err) {
      logger.error('expiringReminder.sendFailed', { userId, offerId, channel, error: String(err) })
    }
  }

  return { sent, skipped }
}

/**
 * Cron-ready batch processor: finds all expiring saved offers and sends
 * reminders respecting user preferences and deduplicating via ReminderLog.
 */
export async function processExpiringOfferReminders(windowHours = 24): Promise<number> {
  const offers = await findExpiringSavedOffers(windowHours)
  if (offers.length === 0) return 0

  const results = await Promise.allSettled(
    offers.map(({ userId, offerId }) =>
      sendReminder(userId, offerId, ['push', 'email']).catch((err) => {
        logger.error('expiringReminder.batchItemFailed', { userId, offerId, error: String(err) })
        return { sent: [] as ReminderChannel[], skipped: ['push', 'email'] as ReminderChannel[] }
      })
    )
  )

  const sentCount = results.reduce((sum, r) => {
    if (r.status !== 'fulfilled') return sum
    return sum + r.value.sent.length
  }, 0)

  logger.info('processExpiringOfferReminders.done', {
    offerCount: offers.length,
    sentCount,
  })

  return sentCount
}
