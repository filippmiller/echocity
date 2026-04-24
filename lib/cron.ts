/**
 * Cron job registration.
 *
 * Sprint B.7 hardening: every handler is wrapped in `withCronLock` which
 *   (a) acquires a Postgres advisory lock keyed on the job name, so multi-
 *       instance deploys can't double-fire the same schedule, and
 *   (b) writes a CronRun row so observability can answer
 *       "did the 03:00 expire-subscriptions job run at all last night?".
 */

import cron from 'node-cron'
import { expireOffers, activateScheduledOffers } from '@/modules/offers/service'
import { expireSessions } from '@/modules/redemptions/service'
import { expireSubscriptions } from '@/modules/subscriptions/service'
import { expireStories } from '@/modules/stories/service'
import { completeExpiredReservations } from '@/modules/reservations/service'
import { sendWeeklyDigests } from '@/modules/notifications/weekly-digest'
import { checkExpiringFavorites, checkStreaksAtRisk } from '@/modules/notifications/triggers'
import { sendPendingReviewNudges } from '@/modules/notifications/review-nudge'
import { distributeAllCorporateCredits } from '@/modules/corporate/service'
import { sweepExpiredIdempotency } from '@/modules/payments/idempotency'
import { logger } from '@/lib/logger'
import { withCronLock } from '@/lib/cronLock'

let initialized = false

type CronHandler = () => Promise<void>

/**
 * Schedule `handler` on the given cron expression, wrapped in the advisory-lock
 * guard and CronRun logger. `jobName` must be globally unique — it's the lock
 * key AND the observability dimension.
 */
function schedule(expression: string, jobName: string, handler: CronHandler): void {
  cron.schedule(expression, async () => {
    const result = await withCronLock(jobName, handler)
    if (!result.ran) {
      // Either another instance holds the lock (expected) or the lock
      // acquisition failed. withCronLock has already logged.
      return
    }
    if (result.error) {
      logger.error(`Cron ${jobName} failed`, { error: String(result.error) })
    }
  })
}

export function initCronJobs() {
  if (initialized || process.env.NODE_ENV === 'test') return
  initialized = true

  // Every minute: expire redemption sessions
  schedule('* * * * *', 'expireSessions', async () => {
    const count = await expireSessions()
    if (count > 0) logger.info(`Expired ${count} redemption sessions`)
  })

  // Every 5 minutes: activate scheduled offers
  schedule('*/5 * * * *', 'activateScheduledOffers', async () => {
    const count = await activateScheduledOffers()
    if (count > 0) logger.info(`Activated ${count} scheduled offers`)
  })

  // Every hour: expire past-endAt offers
  schedule('0 * * * *', 'expireOffers', async () => {
    const count = await expireOffers()
    if (count > 0) logger.info(`Expired ${count} offers`)
  })

  // Every 15 minutes: expire stories (24h TTL)
  schedule('*/15 * * * *', 'expireStories', async () => {
    const count = await expireStories()
    if (count > 0) logger.info(`Expired ${count} stories`)
  })

  // Every hour: complete past reservations
  schedule('30 * * * *', 'completeExpiredReservations', async () => {
    const count = await completeExpiredReservations()
    if (count > 0) logger.info(`Completed ${count} expired reservations`)
  })

  // Daily at 3am: expire subscriptions
  schedule('0 3 * * *', 'expireSubscriptions', async () => {
    const count = await expireSubscriptions()
    if (count > 0) logger.info(`Expired ${count} subscriptions`)
  })

  // Every Monday at 10:00 Moscow time (07:00 UTC): weekly digest push
  schedule('0 7 * * 1', 'sendWeeklyDigests', async () => {
    const count = await sendWeeklyDigests()
    logger.info(`Weekly digest sent to ${count} users`)
  })

  // Daily at 7pm Moscow (16:00 UTC): streak-at-risk notifications
  schedule('0 16 * * *', 'checkStreaksAtRisk', async () => {
    const count = await checkStreaksAtRisk()
    if (count > 0) logger.info(`Streak-at-risk notifications sent to ${count} users`)
  })

  // Daily at 8pm Moscow (17:00 UTC): expiring-favorite notifications
  schedule('0 17 * * *', 'checkExpiringFavorites', async () => {
    const count = await checkExpiringFavorites()
    if (count > 0) logger.info(`Expiring-favorite notifications sent to ${count} users`)
  })

  // Every 30 minutes: post-redemption review nudge (2h after redemption)
  schedule('*/30 * * * *', 'sendPendingReviewNudges', async () => {
    const count = await sendPendingReviewNudges()
    if (count > 0) logger.info(`Review nudges sent to ${count} users`)
  })

  // 1st of each month at 6am Moscow (3am UTC): distribute corporate credits
  schedule('0 3 1 * *', 'distributeAllCorporateCredits', async () => {
    const count = await distributeAllCorporateCredits()
    if (count > 0) logger.info(`Corporate credits distributed to ${count} employees`)
  })

  // Every 6 hours: sweep expired Idempotency rows (Sprint B.1 TTL cleanup).
  schedule('0 */6 * * *', 'sweepExpiredIdempotency', async () => {
    const count = await sweepExpiredIdempotency()
    if (count > 0) logger.info(`Swept ${count} expired Idempotency rows`)
  })

  logger.info('Cron jobs initialized (Sprint B.7 advisory-lock guard active)')
}
