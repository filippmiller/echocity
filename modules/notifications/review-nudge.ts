/**
 * Post-redemption review nudge service.
 *
 * 2 hours after a redemption, if the user hasn't left a review yet,
 * we send a push notification asking them to share their experience.
 */

import { prisma } from '@/lib/prisma'
import { sendPushNotification } from './push'
import { NotificationType } from './types'
import { logger } from '@/lib/logger'

const WINDOW_MINUTES = 30 // cron runs every 30 min — we look for redemptions in a 30-min window
const NUDGE_DELAY_MS = 2 * 60 * 60 * 1000 // 2 hours

/**
 * Cron helper: find redemptions from ~2h ago that have no review and send a push nudge.
 * Runs every 30 minutes.
 */
export async function sendPendingReviewNudges(): Promise<number> {
  const now = new Date()

  // Window: between (now - 2h30m) and (now - 2h) to match the 30-min cron cadence
  const windowEnd = new Date(now.getTime() - NUDGE_DELAY_MS)
  const windowStart = new Date(windowEnd.getTime() - WINDOW_MINUTES * 60 * 1000)

  // Find SUCCESS redemptions in that window with no review yet
  const redemptions = await prisma.redemption.findMany({
    where: {
      status: 'SUCCESS',
      redeemedAt: { gte: windowStart, lte: windowEnd },
      offerReview: null,
    },
    select: {
      id: true,
      userId: true,
      offerId: true,
      offer: {
        select: {
          title: true,
          branch: { select: { title: true } },
          merchant: { select: { name: true } },
        },
      },
    },
  })

  if (redemptions.length === 0) return 0

  let nudgedCount = 0

  await Promise.allSettled(
    redemptions.map(async (r) => {
      try {
        const placeName = r.offer.branch.title || r.offer.merchant.name

        await sendPushNotification(r.userId, {
          title: 'Как вам скидка?',
          body: `Как вам скидка в ${placeName}? Оставьте отзыв и помогите другим`,
          url: `/offers/${r.offerId}?review=1&redemptionId=${r.id}`,
          type: NotificationType.SAVINGS_REPORT,
          data: { redemptionId: r.id, offerId: r.offerId },
        })

        nudgedCount++
        logger.info('reviewNudge.sent', { userId: r.userId, redemptionId: r.id })
      } catch (err) {
        logger.error('reviewNudge.failed', { redemptionId: r.id, error: String(err) })
      }
    })
  )

  logger.info('sendPendingReviewNudges.done', { found: redemptions.length, nudged: nudgedCount })
  return nudgedCount
}
