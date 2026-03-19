/**
 * Web Push notification sender.
 *
 * Uses the `web-push` npm package to deliver push messages
 * to all subscriptions registered for a given user.
 *
 * DEPENDENCY: `web-push` must be installed (`npm i web-push`).
 * Also needs @types/web-push for TypeScript (`npm i -D @types/web-push`).
 */

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { NotificationPayload } from './types'

// Configure VAPID details once at module load.
// These env vars must be set — see scripts/generate-vapid-keys.ts.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:ops@filippmiller.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} else {
  logger.warn('push.vapid.missing', {
    message: 'VAPID keys are not configured — push notifications will not work.',
  })
}

/**
 * Send a push notification to all registered devices for a user.
 *
 * This function is intentionally non-blocking: errors are logged
 * but never thrown, so callers can fire-and-forget.
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      logger.warn('push.send.skipped', { userId, reason: 'VAPID keys not configured' })
      return
    }

    // Check if user has push enabled
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { pushNotifications: true, notificationsEnabled: true },
    })

    if (!profile?.notificationsEnabled || !profile?.pushNotifications) {
      logger.info('push.send.skipped', { userId, reason: 'User disabled notifications' })
      return
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      logger.info('push.send.skipped', { userId, reason: 'No subscriptions' })
      return
    }

    const jsonPayload = JSON.stringify(payload)

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            jsonPayload
          )
        } catch (error: unknown) {
          const statusCode =
            error && typeof error === 'object' && 'statusCode' in error
              ? (error as { statusCode: number }).statusCode
              : undefined

          // 410 Gone or 404 Not Found = subscription expired, clean it up
          if (statusCode === 410 || statusCode === 404) {
            logger.info('push.subscription.expired', {
              subscriptionId: sub.id,
              endpoint: sub.endpoint,
            })
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {
              // Already deleted — ignore
            })
          } else {
            logger.error('push.send.failed', {
              subscriptionId: sub.id,
              statusCode,
              error: String(error),
            })
          }
        }
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    logger.info('push.send.complete', { userId, total: subscriptions.length, sent })
  } catch (error) {
    logger.error('push.send.error', { userId, error: String(error) })
    // Never throw — this is fire-and-forget
  }
}
